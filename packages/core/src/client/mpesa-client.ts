import { MpesaConfig, MpesaPlugin } from "../types/config";
import { MpesaAuth } from "../utils/auth";
import {
  MpesaCallbackHandler,
  CallbackHandlerOptions,
  ParsedCallbackData,
  ParsedC2BCallback,
} from "../utils/callback";
import {
  STKPushRequest,
  STKPushResponse,
  TransactionStatusRequest,
  TransactionStatusResponse,
  C2BRegisterRequest,
  C2BRegisterResponse,
  STKCallback,
  C2BCallback,
} from "../types/mpesa";
import {
  MpesaValidationError,
  MpesaTimeoutError,
  MpesaNetworkError,
  parseMpesaApiError,
} from "../utils/errors";
import { retryWithBackoff, RetryOptions } from "../utils/retry";
import { RateLimiter, RedisRateLimiter, RedisLike } from "../utils/ratelimiter";

export interface MpesaClientOptions {
  callbackOptions?: CallbackHandlerOptions;
  retryOptions?: RetryOptions;
  rateLimitOptions?: {
    enabled?: boolean;
    maxRequests?: number;
    windowMs?: number;
    redis?: RedisLike;
  };
  requestTimeout?: number;
}

export class MpesaClient {
  private config: MpesaConfig;
  private auth: MpesaAuth;
  private plugins: MpesaPlugin[] = [];
  private callbackHandler: MpesaCallbackHandler;
  private retryOptions: RetryOptions;
  private rateLimiter: RateLimiter | RedisRateLimiter | null = null;
  private readonly REQUEST_TIMEOUT: number;

  constructor(config: MpesaConfig, options: MpesaClientOptions = {}) {
    this.config = config;
    this.auth = new MpesaAuth(config);
    this.callbackHandler = new MpesaCallbackHandler(options.callbackOptions);
    this.retryOptions = options.retryOptions || {};
    this.REQUEST_TIMEOUT = options.requestTimeout || 30000;

    // Setup rate limiting
    if (options.rateLimitOptions?.enabled !== false) {
      const rateLimitOpts = {
        maxRequests: options.rateLimitOptions?.maxRequests || 100,
        windowMs: options.rateLimitOptions?.windowMs || 60000,
      };

      if (options.rateLimitOptions?.redis) {
        this.rateLimiter = new RedisRateLimiter(
          options.rateLimitOptions.redis,
          rateLimitOpts,
        );
      } else {
        this.rateLimiter = new RateLimiter(rateLimitOpts);
      }
    }
  }

  /**
   * Make HTTP request with error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    payload: any,
    rateLimitKey?: string,
  ): Promise<T> {
    return retryWithBackoff(async () => {
      // Check rate limit
      if (this.rateLimiter && rateLimitKey) {
        await this.rateLimiter.checkLimit(rateLimitKey);
      }

      const token = await this.auth.getAccessToken();
      const baseUrl = this.auth.getBaseUrl();

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.REQUEST_TIMEOUT,
      );

      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw parseMpesaApiError(response.status, errorBody);
        }

        return (await response.json()) as T;
      } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === "AbortError") {
          throw new MpesaTimeoutError(`Request timed out for ${endpoint}`);
        }

        if (error.statusCode) {
          throw error;
        }

        throw new MpesaNetworkError(
          `Network error on ${endpoint}: ${error.message}`,
          true,
          error,
        );
      }
    }, this.retryOptions);
  }

  /**
   * Validate phone number format
   */
  private validateAndFormatPhone(phone: string): string {
    let formatted = phone.replace(/[\s\-\+]/g, "");

    if (formatted.startsWith("0")) {
      formatted = "254" + formatted.substring(1);
    } else if (!formatted.startsWith("254")) {
      formatted = "254" + formatted;
    }

    // Validate Kenyan phone number
    if (!/^254[17]\d{8}$/.test(formatted)) {
      throw new MpesaValidationError(
        `Invalid phone number format: ${phone}. Must be a valid Kenyan number.`,
      );
    }

    return formatted;
  }

  /**
   * Add a plugin to extend functionality
   */
  use(plugin: MpesaPlugin): this {
    this.plugins.push(plugin);
    plugin.init(this);
    return this;
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa Online)
   */
  async stkPush(request: STKPushRequest): Promise<STKPushResponse> {
    // Validate inputs
    if (request.amount < 1) {
      throw new MpesaValidationError("Amount must be at least 1 KES");
    }

    if (!request.accountReference || request.accountReference.length > 13) {
      throw new MpesaValidationError(
        "Account reference is required and must be 13 characters or less",
      );
    }

    if (!request.transactionDesc) {
      throw new MpesaValidationError("Transaction description is required");
    }

    const phone = this.validateAndFormatPhone(request.phoneNumber);

    const payload = {
      BusinessShortCode: this.config.shortcode,
      Password: this.auth.getPassword(),
      Timestamp: this.auth.getTimestamp(),
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.floor(request.amount),
      PartyA: phone,
      PartyB: this.config.shortcode,
      PhoneNumber: phone,
      CallBackURL: request.callbackUrl || this.config.callbackUrl,
      AccountReference: request.accountReference,
      TransactionDesc: request.transactionDesc,
    };

    return this.makeRequest<STKPushResponse>(
      "/mpesa/stkpush/v1/processrequest",
      payload,
      `stk:${phone}`,
    );
  }

  /**
   * Query STK Push transaction status
   */
  async stkQuery(
    request: TransactionStatusRequest,
  ): Promise<TransactionStatusResponse> {
    if (!request.checkoutRequestID) {
      throw new MpesaValidationError("CheckoutRequestID is required");
    }

    const payload = {
      BusinessShortCode: this.config.shortcode,
      Password: this.auth.getPassword(),
      Timestamp: this.auth.getTimestamp(),
      CheckoutRequestID: request.checkoutRequestID,
    };

    return this.makeRequest<TransactionStatusResponse>(
      "/mpesa/stkpushquery/v1/query",
      payload,
      `query:${request.checkoutRequestID}`,
    );
  }

  /**
   * Register C2B URLs for validation and confirmation
   */
  async registerC2BUrl(
    request: C2BRegisterRequest,
  ): Promise<C2BRegisterResponse> {
    if (!request.confirmationURL || !request.validationURL) {
      throw new MpesaValidationError(
        "Both confirmationURL and validationURL are required",
      );
    }

    const payload = {
      ShortCode: request.shortCode,
      ResponseType: request.responseType,
      ConfirmationURL: request.confirmationURL,
      ValidationURL: request.validationURL,
    };

    return this.makeRequest<C2BRegisterResponse>(
      "/mpesa/c2b/v1/registerurl",
      payload,
      "c2b:register",
    );
  }

  /**
   * Get the callback handler instance
   */
  getCallbackHandler(): MpesaCallbackHandler {
    return this.callbackHandler;
  }

  /**
   * Handle an incoming STK Push callback
   * Returns M-Pesa compliant response
   */
  async handleSTKCallback(
    callback: STKCallback,
    ipAddress?: string,
  ): Promise<object> {
    try {
      await this.callbackHandler.handleCallback(callback, ipAddress);
      return this.callbackHandler.createCallbackResponse(true);
    } catch (error) {
      console.error("STK Callback handling error:", error);
      return this.callbackHandler.createCallbackResponse(
        false,
        "Internal error",
      );
    }
  }

  /**
   * Handle C2B validation request
   */
  async handleC2BValidation(callback: C2BCallback): Promise<object> {
    try {
      const isValid = await this.callbackHandler.handleC2BValidation(callback);
      return this.callbackHandler.createCallbackResponse(
        isValid,
        isValid ? "Accepted" : "Rejected",
      );
    } catch (error) {
      console.error("C2B Validation error:", error);
      return this.callbackHandler.createCallbackResponse(
        false,
        "Validation failed",
      );
    }
  }

  /**
   * Handle C2B confirmation
   */
  async handleC2BConfirmation(callback: C2BCallback): Promise<object> {
    try {
      await this.callbackHandler.handleC2BConfirmation(callback);
      return this.callbackHandler.createCallbackResponse(true);
    } catch (error) {
      console.error("C2B Confirmation error:", error);
      return this.callbackHandler.createCallbackResponse(
        false,
        "Processing failed",
      );
    }
  }

  /**
   * Parse STK callback without handling (for testing)
   */
  parseSTKCallback(callback: STKCallback): ParsedCallbackData {
    return this.callbackHandler.parseCallback(callback);
  }

  /**
   * Parse C2B callback without handling (for testing)
   */
  parseC2BCallback(callback: C2BCallback): ParsedC2BCallback {
    return this.callbackHandler.parseC2BCallback(callback);
  }

  /**
   * Get configuration (for plugins)
   */
  getConfig(): MpesaConfig {
    return this.config;
  }

  /**
   * Get rate limiter usage for a key
   */
  getRateLimitUsage(key: string) {
    if (this.rateLimiter instanceof RateLimiter) {
      return this.rateLimiter.getUsage(key);
    }
    return null;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.rateLimiter instanceof RateLimiter) {
      this.rateLimiter.destroy();
    }
  }
}
