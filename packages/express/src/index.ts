import { MpesaClient } from "@singularity-payments/core";
import type {
  MpesaConfig,
  MpesaClientOptions,
} from "@singularity-payments/core";
import { createMpesaHandlers } from "./handlers";
import type { Router } from "express";

export { createMpesaHandlers };
export * from "./types";
export type {
  MpesaConfig,
  MpesaClientOptions,
} from "@singularity-payments/core";

/**
 * Create M-Pesa instance for Express
 *
 * @example
 * ```typescript
 * // lib/mpesa.ts
 * import { createMpesa } from "@singularity-payments/express";
 *
 * export const mpesa = createMpesa({
 *   consumerKey: process.env.MPESA_CONSUMER_KEY!,
 *   consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
 *   passkey: process.env.MPESA_PASSKEY!,
 *   shortcode: process.env.MPESA_SHORTCODE!,
 *   environment: "sandbox",
 *   callbackUrl: `${process.env.APP_URL}/api/mpesa/callback`,
 *   resultUrl: `${process.env.APP_URL}/api/mpesa`,
 *   timeoutUrl: `${process.env.APP_URL}/api/mpesa`,
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
 * // routes/mpesa.ts
 * import express from "express";
 * import { mpesa } from "../lib/mpesa";
 *
 * const router = express.Router();
 *
 * // Use the built-in router helper
 * mpesa.router(router);
 *
 * export default router;
 * ```
 */
export function createMpesa(config: MpesaConfig, options?: MpesaClientOptions) {
  const client = new MpesaClient(config, options);
  const handlers = createMpesaHandlers(client);

  const router = (expressRouter: Router) => {
    // Client API endpoints
    expressRouter.post("/stk-push", handlers.stkPush);
    expressRouter.post("/stk-query", handlers.stkQuery);
    expressRouter.post("/b2c", handlers.b2c);
    expressRouter.post("/b2b", handlers.b2b);
    expressRouter.post("/balance", handlers.balance);
    expressRouter.post("/transaction-status", handlers.transactionStatus);
    expressRouter.post("/reversal", handlers.reversal);
    expressRouter.post("/register-c2b", handlers.registerC2B);
    expressRouter.post("/generate-qr", handlers.generateQR);

    // Webhook endpoints
    expressRouter.post("/callback", handlers.stkCallback);
    expressRouter.post("/stk-callback", handlers.stkCallback);
    expressRouter.post("/c2b-validation", handlers.c2bValidation);
    expressRouter.post("/validation", handlers.c2bValidation);
    expressRouter.post("/c2b-confirmation", handlers.c2bConfirmation);
    expressRouter.post("/confirmation", handlers.c2bConfirmation);
    expressRouter.post("/b2c-result", handlers.b2cResult);
    expressRouter.post("/b2c-timeout", handlers.b2cTimeout);
    expressRouter.post("/b2b-result", handlers.b2bResult);
    expressRouter.post("/b2b-timeout", handlers.b2bTimeout);
    expressRouter.post("/balance-result", handlers.balanceResult);
    expressRouter.post("/balance-timeout", handlers.balanceTimeout);
    expressRouter.post("/reversal-result", handlers.reversalResult);
    expressRouter.post("/reversal-timeout", handlers.reversalTimeout);
    expressRouter.post("/status-result", handlers.statusResult);
    expressRouter.post("/status-timeout", handlers.statusTimeout);
    expressRouter.post("/simulate-c2b", handlers.simulateC2B);

    return expressRouter;
  };

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
     * Helper function to automatically register all routes
     */
    router,
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
