import { MpesaClient } from "@singularity-payments/core";
import type {
  MpesaConfig,
  MpesaClientOptions,
} from "@singularity-payments/core";
import { Elysia } from "elysia";
import { createMpesaHandlers } from "./handlers";

export { createMpesaHandlers };
export * from "./types";
export type {
  MpesaConfig,
  MpesaClientOptions,
} from "@singularity-payments/core";

/**
 * Create M-Pesa instance for Elysia
 *
 * @example
 * ```typescript
 * // lib/mpesa.ts
 * import { createMpesa } from "@singularity-payments/elysia";
 *
 * export const mpesa = createMpesa({
 *   consumerKey: process.env.MPESA_CONSUMER_KEY!,
 *   consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
 *   passkey: process.env.MPESA_PASSKEY!,
 *   shortcode: process.env.MPESA_SHORTCODE!,
 *   environment: "sandbox",
 *   callbackUrl: `${process.env.APP_URL}/mpesa/callback`,
 *   resultUrl: `${process.env.APP_URL}/mpesa`,
 *   timeoutUrl: `${process.env.APP_URL}/mpesa`,
 * }, {
 *   callbackOptions: {
 *     onSuccess: async (data) => {
 *       console.log("STK Payment successful:", data);
 *       // Save to database
 *     },
 *     onFailure: async (data) => {
 *       console.log("STK Payment failed:", data);
 *     },
 *     onB2CResult: async (data) => {
 *       console.log("B2C Result:", data);
 *     },
 *     onB2BResult: async (data) => {
 *       console.log("B2B Result:", data);
 *     },
 *     onAccountBalance: async (data) => {
 *       console.log("Balance:", data);
 *     },
 *     onTransactionStatus: async (data) => {
 *       console.log("Transaction Status:", data);
 *     },
 *     onReversal: async (data) => {
 *       console.log("Reversal:", data);
 *     },
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // index.ts
 * import { Elysia } from "elysia";
 * import { mpesa } from "./lib/mpesa";
 *
 * const app = new Elysia()
 *   .use(mpesa.app)
 *   .listen(3000);
 * ```
 */
export function createMpesa(config: MpesaConfig, options?: MpesaClientOptions) {
  const client = new MpesaClient(config, options);
  const handlers = createMpesaHandlers(client);

  const app = new Elysia({ prefix: "/mpesa" })
    // Client API endpoints
    .post("/stk-push", handlers.stkPush)
    .post("/stk-query", handlers.stkQuery)
    .post("/b2c", handlers.b2c)
    .post("/b2b", handlers.b2b)
    .post("/balance", handlers.balance)
    .post("/transaction-status", handlers.transactionStatus)
    .post("/reversal", handlers.reversal)
    .post("/register-c2b", handlers.registerC2B)
    .post("/generate-qr", handlers.generateQR)

    // Webhook endpoints
    .post("/callback", handlers.stkCallback)
    .post("/stk-callback", handlers.stkCallback)
    .post("/c2b-validation", handlers.c2bValidation)
    .post("/validation", handlers.c2bValidation)
    .post("/c2b-confirmation", handlers.c2bConfirmation)
    .post("/confirmation", handlers.c2bConfirmation)
    .post("/b2c-result", handlers.b2cResult)
    .post("/b2c-timeout", handlers.b2cTimeout)
    .post("/b2b-result", handlers.b2bResult)
    .post("/b2b-timeout", handlers.b2bTimeout)
    .post("/balance-result", handlers.balanceResult)
    .post("/balance-timeout", handlers.balanceTimeout)
    .post("/reversal-result", handlers.reversalResult)
    .post("/reversal-timeout", handlers.reversalTimeout)
    .post("/status-result", handlers.statusResult)
    .post("/status-timeout", handlers.statusTimeout)
    .post("/simulate-c2b", handlers.simulateC2B);

  return {
    /**
     * M-Pesa client instance for making API calls
     */
    client,
    /**
     * Individual handler functions for custom routing
     */
    handlers,
    /**
     * Pre-configured Elysia app with all M-Pesa routes
     */
    app,
  };
}

/**
 * Re-export core types and classes for convenience
 */
export {
  MpesaClient,
  type STKPushRequest,
  type STKPushResponse,
  type TransactionStatusRequest,
  type TransactionStatusResponse,
  type C2BRegisterRequest,
  type C2BRegisterResponse,
  type STKCallback,
  type C2BCallback,
  type B2CCallback,
  type B2BCallback,
  type AccountBalanceCallback,
  type TransactionStatusCallback,
  type ReversalCallback,
  type ParsedCallbackData,
  type ParsedC2BCallback,
  type B2CRequest,
  type B2CResponse,
  type B2BRequest,
  type B2BResponse,
  type AccountBalanceRequest,
  type AccountBalanceResponse,
  type GeneralTransactionStatusRequest,
  type GeneralTransactionStatusResponse,
  type ReversalRequest,
  type ReversalResponse,
} from "@singularity-payments/core";
