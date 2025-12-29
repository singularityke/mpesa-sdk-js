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

export function createMpesa(config: MpesaConfig, options?: MpesaClientOptions) {
  const client = new MpesaClient(config, options);
  const handlers = createMpesaHandlers(client);

  const app = new Elysia({ prefix: "/mpesa" })
    .post("/stk-push", handlers.stkPush)
    .post("/stk-query", handlers.stkQuery)
    .post("/callback", handlers.stkCallback)
    .post("/b2c", handlers.b2c)
    .post("/b2b", handlers.b2b)
    .post("/balance", handlers.balance)
    .post("/transaction-status", handlers.transactionStatus)
    .post("/reversal", handlers.reversal)
    .post("/register-c2b", handlers.registerC2B)
    .post("/generate-qr", handlers.generateQR)
    .post("/c2b-validation", handlers.c2bValidation)
    .post("/c2b-confirmation", handlers.c2bConfirmation)
    .post("/b2c-result", handlers.b2cResult)
    .post("/b2c-timeout", handlers.b2cTimeout)
    .post("/b2b-result", handlers.b2bResult)
    .post("/b2b-timeout", handlers.b2bTimeout)
    .post("/balance-result", handlers.balanceResult)
    .post("/balance-timeout", handlers.balanceTimeout)
    .post("/reversal-result", handlers.reversalResult)
    .post("/reversal-timeout", handlers.reversalTimeout)
    .post("/status-result", handlers.statusResult)
    .post("/status-timeout", handlers.statusTimeout);

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
  type STKCallback,
  type C2BCallback,
  type ParsedCallbackData,
  type ParsedC2BCallback,
} from "@singularity-payments/core";
