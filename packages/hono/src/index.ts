import { MpesaClient } from "@singularity-payments/core";
import type {
  MpesaConfig,
  MpesaClientOptions,
} from "@singularity-payments/core";
import { Hono } from "hono";
import { createMpesaHandlers } from "./handlers";

export { createMpesaHandlers };
export * from "./types";
export type {
  MpesaConfig,
  MpesaClientOptions,
} from "@singularity-payments/core";

export function createMpesa(config: MpesaConfig, options?: MpesaClientOptions) {
  const client = new MpesaClient(config, options);
  const handlers = createMpesaHandlers(client);
  const app = new Hono();

  app.post("/stk-push", handlers.stkPush);
  app.post("/stk-query", handlers.stkQuery);
  app.post("/callback", handlers.stkCallback);
  app.post("/b2c", handlers.b2c);
  app.post("/b2b", handlers.b2b);
  app.post("/balance", handlers.balance);
  app.post("/transaction-status", handlers.transactionStatus);
  app.post("/reversal", handlers.reversal);
  app.post("/register-c2b", handlers.registerC2B);
  app.post("/generate-qr", handlers.generateQR);
  app.post("/c2b-validation", handlers.c2bValidation);
  app.post("/c2b-confirmation", handlers.c2bConfirmation);
  app.post("/b2c-result", handlers.b2cResult);
  app.post("/b2c-timeout", handlers.b2cTimeout);
  app.post("/b2b-result", handlers.b2bResult);
  app.post("/b2b-timeout", handlers.b2bTimeout);
  app.post("/balance-result", handlers.balanceResult);
  app.post("/balance-timeout", handlers.balanceTimeout);
  app.post("/reversal-result", handlers.reversalResult);
  app.post("/reversal-timeout", handlers.reversalTimeout);
  app.post("/status-result", handlers.statusResult);
  app.post("/status-timeout", handlers.statusTimeout);
  app.post("/simulate-c2b", handlers.simulateC2B);

  return {
    client,
    handlers,
    app,
  };
}

export {
  MpesaClient,
  type STKPushRequest,
  type STKPushResponse,
  type TransactionStatusRequest,
  type TransactionStatusResponse,
  type C2BRegisterRequest,
  type C2BRegisterResponse,
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
  type DynamicQRRequest,
  type DynamicQRResponse,
  type STKCallback,
  type C2BCallback,
  type B2CCallback,
  type B2BCallback,
  type AccountBalanceCallback,
  type TransactionStatusCallback,
  type ReversalCallback,
  type ParsedCallbackData,
  type ParsedC2BCallback,
  type CallbackHandlerOptions,
} from "@singularity-payments/core";
