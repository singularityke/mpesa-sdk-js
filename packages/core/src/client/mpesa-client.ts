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
  B2CRequest,
  B2CResponse,
  B2BRequest,
  B2BResponse,
  AccountBalanceRequest,
  AccountBalanceResponse,
  GeneralTransactionStatusRequest,
  GeneralTransactionStatusResponse,
  ReversalRequest,
  ReversalResponse,
  DynamicQRRequest,
  DynamicQRResponse,
  ReversalCallback,
  TransactionStatusCallback,
  AccountBalanceCallback,
  B2BCallback,
  B2CCallback,
  C2BSimulateRequest,
  C2BSimulateResponse,
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
    if (!request.CheckoutRequestID) {
      throw new MpesaValidationError("CheckoutRequestID is required");
    }

    const payload = {
      BusinessShortCode: this.config.shortcode,
      Password: this.auth.getPassword(),
      Timestamp: this.auth.getTimestamp(),
      CheckoutRequestID: request.CheckoutRequestID,
    };

    return this.makeRequest<TransactionStatusResponse>(
      "/mpesa/stkpushquery/v1/query",
      payload,
      `query:${request.CheckoutRequestID}`,
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
   * B2C - Send money from business to customer
   */
  async b2c(request: B2CRequest): Promise<B2CResponse> {
    if (request.amount < 10) {
      throw new MpesaValidationError("B2C amount must be greater than 10");
    }
    if (!request.remarks || request.remarks.length > 100) {
      throw new MpesaValidationError(
        "B2C remarks must be between 1 and 100 characters",
      );
    }
    const phone = this.validateAndFormatPhone(request.phoneNumber);
    const payload = {
      InitiatorName: this.config.initiatorName,
      SecurityCredential: this.config.securityCredential,
      CommandID: request.commandID,
      Amount: Math.floor(request.amount),
      PartyA: this.config.shortcode,
      PartyB: phone,
      Remarks: request.remarks,
      QueueTimeOutURL: request.timeoutUrl || this.config.timeoutUrl,
      ResultURL: request.resultUrl || this.config.resultUrl,
      Occasion: request.occasion || "",
    };
    return this.makeRequest<B2CResponse>(
      "/mpesa/b2c/v1/paymentrequest",
      payload,
      `b2c:${phone}`,
    );
  }
  /**
   * B2B - Send money from business to business
   */
  async b2b(request: B2BRequest): Promise<B2BResponse> {
    if (request.amount < 1) {
      throw new MpesaValidationError("B2B amount must be greater than 0");
    }
    if (!request.remarks || request.remarks.length > 100) {
      throw new MpesaValidationError(
        "B2B remarks must be between 1 and 100 characters",
      );
    }
    if (!request.accountReference || request.accountReference.length > 13) {
      throw new MpesaValidationError(
        "Account reference is required and must be 13 characters or less",
      );
    }
    const payload = {
      Initiator: this.config.initiatorName,
      SecurityCredential: this.config.securityCredential,
      CommandID: request.commandID,
      Amount: Math.floor(request.amount),
      PartyA: this.config.shortcode,
      PartyB: request.partyB,
      SenderIdentifierType: request.senderIdentifierType,
      RecieverIdentifierType: request.receiverIdentifierType,
      Remarks: request.remarks,
      AccountReference: request.accountReference,
      QueueTimeOutURL: request.timeoutUrl || this.config.timeoutUrl,
      ResultURL: request.resultUrl || this.config.resultUrl,
    };
    return this.makeRequest<B2BResponse>(
      "/mpesa/b2b/v1/paymentrequest",
      payload,
      `b2b:${request.partyB}`,
    );
  }
  /**
   * Query account balance
   */
  async accountBalance(
    request: AccountBalanceRequest = {},
  ): Promise<AccountBalanceResponse> {
    const payload = {
      Initiator: this.config.initiatorName,
      SecurityCredential: this.config.securityCredential,
      CommandID: "AccountBalance",
      PartyA: request.partyA || this.config.shortcode,
      IdentifierType: request.identifierType || "4",
      Remarks: request.remarks || "Account balance query",
      QueueTimeOutURL: request.timeoutUrl || this.config.timeoutUrl,
      ResultURL: request.resultUrl || this.config.resultUrl,
    };
    return this.makeRequest<AccountBalanceResponse>(
      "/mpesa/accountbalance/v1/query",
      payload,
      "balance",
    );
  }
  /**
   * Query general transaction status
   */
  async transactionStatus(
    request: GeneralTransactionStatusRequest,
  ): Promise<GeneralTransactionStatusResponse> {
    if (!request.transactionID) {
      throw new MpesaValidationError("Transaction ID is required");
    }
    const payload = {
      Initiator: this.config.initiatorName,
      SecurityCredential: this.config.securityCredential,
      CommandID: "TransactionStatusQuery",
      TransactionID: request.transactionID,
      PartyA: request.partyA || this.config.shortcode,
      IdentifierType: request.identifierType || "4",
      Remarks: request.remarks || "Transaction status query",
      Occasion: request.occasion || "",
      QueueTimeOutURL: request.timeoutUrl || this.config.timeoutUrl,
      ResultURL: request.resultUrl || this.config.resultUrl,
    };
    return this.makeRequest<GeneralTransactionStatusResponse>(
      "/mpesa/transactionstatus/v1/query",
      payload,
      `status:${request.transactionID}`,
    );
  }
  /**
   * Reverse a transaction
   */

  async reversal(request: ReversalRequest): Promise<ReversalResponse> {
    if (!request.transactionID) {
      throw new MpesaValidationError("Transaction ID is required");
    }
    if (request.amount < 1) {
      throw new MpesaValidationError("Amount must be greater than 0");
    }
    const payload = {
      Initiator: this.config.initiatorName,
      SecurityCredential: this.config.securityCredential,
      CommandID: "TransactionReversal",
      TransactionID: request.transactionID,
      Amount: Math.floor(request.amount),
      ReceiverParty: request.receiverParty || this.config.shortcode,
      RecieverIdentifierType: request.receiverIdentifierType || "11",
      Remarks: request.remarks || "Transaction reversal",
      Occasion: request.occasion || "",
      QueueTimeOutURL: request.timeoutUrl || this.config.timeoutUrl,
      ResultURL: request.resultUrl || this.config.resultUrl,
    };
    return this.makeRequest<ReversalResponse>(
      "/mpesa/reversal/v1/request",
      payload,
      `reversal:${request.transactionID}`,
    );
  }
  /**
   * Generate Dynamic QR code
   */
  async generateDynamicQR(
    request: DynamicQRRequest,
  ): Promise<DynamicQRResponse> {
    if (!request.merchantName || request.merchantName.length > 26) {
      throw new MpesaValidationError(
        "Merchent name is required and must be 26 characters or less",
      );
    }
    if (!request.refNo || request.refNo.length > 12) {
      throw new MpesaValidationError(
        "Reference number is required and must be 12 characters or less",
      );
    }
    if (request.amount < 1 || request.amount > 999999) {
      throw new MpesaValidationError("Amount must be between 1 and 999999 KES");
    }
    const payload = {
      MerchantName: request.merchantName,
      RefNo: request.refNo,
      Amount: Math.floor(request.amount),
      TrxCode: request.transactionType,
      CPI: request.creditPartyIdentifier,
      Size: request.size || "300",
    };
    return this.makeRequest<DynamicQRResponse>(
      "/mpesa/qrcode/v1/generate",
      payload,
      `qr:${request.refNo}`,
    );
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
   * Handle B2C callback
   */
  async handleB2CCallback(callback: B2CCallback): Promise<object> {
    try {
      const parsed = this.callbackHandler.parseB2CCallback(callback);

      if (this.callbackHandler["options"].onB2CResult) {
        await this.callbackHandler["options"].onB2CResult(parsed);
      }

      return this.callbackHandler.createCallbackResponse(parsed.isSuccess);
    } catch (error) {
      console.error("B2C Callback error:", error);
      return this.callbackHandler.createCallbackResponse(
        false,
        "Processing failed",
      );
    }
  }
  /**
   * Simulate C2B transaction (for testing in sandbox)
   */
  async simulateC2B(request: C2BSimulateRequest): Promise<C2BSimulateResponse> {
    if (this.config.environment === "production") {
      throw new MpesaValidationError(
        "C2B simulation is only available in sandbox environment. " +
          "In production, C2B transactions come from real customer payments.",
      );
    }
    if (request.amount < 1) {
      throw new MpesaValidationError("Amount must be at least 1 KES");
    }

    if (!request.billRefNumber) {
      throw new MpesaValidationError("Bill reference number is required");
    }

    const phone = this.validateAndFormatPhone(request.phoneNumber);

    const payload = {
      ShortCode: request.shortcode || this.config.shortcode,
      CommandID: request.commandID || "CustomerPayBillOnline",
      Amount: Math.floor(request.amount),
      Msisdn: phone,
      BillRefNumber: request.billRefNumber,
    };

    return this.makeRequest<C2BSimulateResponse>(
      "/mpesa/c2b/v1/simulate",
      payload,
      `c2b:simulate:${phone}`,
    );
  }

  /**
   * Handle B2B callback
   */
  async handleB2BCallback(callback: B2BCallback): Promise<object> {
    try {
      const parsed = this.callbackHandler.parseB2BCallback(callback);

      if (this.callbackHandler["options"].onB2BResult) {
        await this.callbackHandler["options"].onB2BResult(parsed);
      }

      return this.callbackHandler.createCallbackResponse(parsed.isSuccess);
    } catch (error) {
      console.error("B2B Callback error:", error);
      return this.callbackHandler.createCallbackResponse(
        false,
        "Processing failed",
      );
    }
  }

  /**
   * Handle Account Balance callback
   */
  async handleAccountBalanceCallback(
    callback: AccountBalanceCallback,
  ): Promise<object> {
    try {
      const parsed = this.callbackHandler.parseAccountBalanceCallback(callback);

      if (this.callbackHandler["options"].onAccountBalanceResult) {
        await this.callbackHandler["options"].onAccountBalanceResult(parsed);
      }

      return this.callbackHandler.createCallbackResponse(parsed.isSuccess);
    } catch (error) {
      console.error("Account Balance Callback error:", error);
      return this.callbackHandler.createCallbackResponse(
        false,
        "Processing failed",
      );
    }
  }

  /**
   * Handle Transaction Status callback
   */
  async handleTransactionStatusCallback(
    callback: TransactionStatusCallback,
  ): Promise<object> {
    try {
      const parsed =
        this.callbackHandler.parseTransactionStatusCallback(callback);

      if (this.callbackHandler["options"].onTransactionStatusResult) {
        await this.callbackHandler["options"].onTransactionStatusResult(parsed);
      }

      return this.callbackHandler.createCallbackResponse(parsed.isSuccess);
    } catch (error) {
      console.error("Transaction Status Callback error:", error);
      return this.callbackHandler.createCallbackResponse(
        false,
        "Processing failed",
      );
    }
  }

  /**
   * Handle Reversal callback
   */
  async handleReversalCallback(callback: ReversalCallback): Promise<object> {
    try {
      const parsed = this.callbackHandler.parseReversalCallback(callback);

      if (this.callbackHandler["options"].onReversalResult) {
        await this.callbackHandler["options"].onReversalResult(parsed);
      }

      return this.callbackHandler.createCallbackResponse(parsed.isSuccess);
    } catch (error) {
      console.error("Reversal Callback error:", error);
      return this.callbackHandler.createCallbackResponse(
        false,
        "Processing failed",
      );
    }
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
