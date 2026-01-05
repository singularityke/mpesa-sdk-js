import type {
  STKPushRequest,
  STKPushResponse,
  TransactionStatusRequest,
  TransactionStatusResponse,
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
  C2BRegisterRequest,
  C2BRegisterResponse,
  DynamicQRRequest,
  DynamicQRResponse,
  C2BSimulateRequest,
  C2BSimulateResponse,
} from "@singularity-payments/core";

export interface MpesaClientConfig {
  baseUrl?: string;
  fetcher?: typeof fetch;
}

export class MpesaSvelteClient {
  private baseUrl: string;
  private fetcher: typeof fetch;

  constructor(config: MpesaClientConfig = {}) {
    this.baseUrl = config.baseUrl?.replace(/\/$/, "") || "";
    this.fetcher = config.fetcher || globalThis.fetch.bind(globalThis);
  }

  private async request<T>(
    endpoint: string,
    body: Record<string, any>,
  ): Promise<{ data?: T; error?: string }> {
    try {
      const response = await this.fetcher(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || data.errorMessage || "Request failed",
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async stkPush(request: Omit<STKPushRequest, "callbackUrl">) {
    return this.request<STKPushResponse>("/api/mpesa/stk-push", request);
  }

  async stkQuery(request: TransactionStatusRequest) {
    return this.request<TransactionStatusResponse>(
      "/api/mpesa/stk-query",
      request,
    );
  }

  async simulateC2B(request: C2BSimulateRequest) {
    return this.request<C2BSimulateResponse>(
      "/api/mpesa/simulate-c2b",
      request,
    );
  }

  async b2c(request: Omit<B2CRequest, "resultUrl" | "timeoutUrl">) {
    return this.request<B2CResponse>("/api/mpesa/b2c", request);
  }

  async b2b(request: Omit<B2BRequest, "resultUrl" | "timeoutUrl">) {
    return this.request<B2BResponse>("/api/mpesa/b2b", request);
  }

  async accountBalance(
    request: Omit<AccountBalanceRequest, "resultUrl" | "timeoutUrl">,
  ) {
    return this.request<AccountBalanceResponse>("/api/mpesa/balance", request);
  }

  async transactionStatus(
    request: Omit<GeneralTransactionStatusRequest, "resultUrl" | "timeoutUrl">,
  ) {
    return this.request<GeneralTransactionStatusResponse>(
      "/api/mpesa/transaction-status",
      request,
    );
  }

  async reversal(request: Omit<ReversalRequest, "resultUrl" | "timeoutUrl">) {
    return this.request<ReversalResponse>("/api/mpesa/reversal", request);
  }

  async registerC2B(request: C2BRegisterRequest) {
    return this.request<C2BRegisterResponse>(
      "/api/mpesa/register-c2b",
      request,
    );
  }

  async generateQR(request: DynamicQRRequest) {
    return this.request<DynamicQRResponse>("/api/mpesa/generate-qr", request);
  }
}
