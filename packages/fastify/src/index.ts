import { MpesaClient } from "@singularity-payments/core";
import type {
  MpesaConfig,
  MpesaClientOptions,
} from "@singularity-payments/core";
import { createMpesaHandlers } from "./handlers";
import type { FastifyInstance } from "fastify";

export { createMpesaHandlers };
export * from "./types";
export type {
  MpesaConfig,
  MpesaClientOptions,
} from "@singularity-payments/core";

export function createMpesa(config: MpesaConfig, options?: MpesaClientOptions) {
  const client = new MpesaClient(config, options);
  const handlers = createMpesaHandlers(client);

  const router = (fastify: FastifyInstance) => {
    fastify.post("/stk-push", handlers.stkPush);
    fastify.post("/stk-query", handlers.stkQuery);
    fastify.post("/callback", handlers.stkCallback);
    fastify.post("/b2c", handlers.b2c);
    fastify.post("/b2b", handlers.b2b);
    fastify.post("/balance", handlers.balance);
    fastify.post("/transaction-status", handlers.transactionStatus);
    fastify.post("/reversal", handlers.reversal);
    fastify.post("/register-c2b", handlers.registerC2B);
    fastify.post("/generate-qr", handlers.generateQR);
    fastify.post("/c2b-validation", handlers.c2bValidation);
    fastify.post("/c2b-confirmation", handlers.c2bConfirmation);
    fastify.post("/b2c-result", handlers.b2cResult);
    fastify.post("/b2c-timeout", handlers.b2cTimeout);
    fastify.post("/b2b-result", handlers.b2bResult);
    fastify.post("/b2b-timeout", handlers.b2bTimeout);
    fastify.post("/balance-result", handlers.balanceResult);
    fastify.post("/balance-timeout", handlers.balanceTimeout);
    fastify.post("/reversal-result", handlers.reversalResult);
    fastify.post("/reversal-timeout", handlers.reversalTimeout);
    fastify.post("/status-result", handlers.statusResult);
    fastify.post("/status-timeout", handlers.statusTimeout);
    fastify.post("/simulate-c2b", handlers.simulateC2B);
    return fastify;
  };

  return {
    client,
    handlers,
    router,
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
