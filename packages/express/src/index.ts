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

export function createMpesa(config: MpesaConfig, options?: MpesaClientOptions) {
  const client = new MpesaClient(config, options);
  const handlers = createMpesaHandlers(client);

  const router = (expressRouter: Router) => {
    expressRouter.post("/stk-push", handlers.stkPush);
    expressRouter.post("/stk-query", handlers.stkQuery);
    expressRouter.post("/callback", handlers.stkCallback);
    expressRouter.post("/b2c", handlers.b2c);
    expressRouter.post("/b2b", handlers.b2b);
    expressRouter.post("/balance", handlers.balance);
    expressRouter.post("/transaction-status", handlers.transactionStatus);
    expressRouter.post("/reversal", handlers.reversal);
    expressRouter.post("/register-c2b", handlers.registerC2B);
    expressRouter.post("/generate-qr", handlers.generateQR);
    expressRouter.post("/c2b-validation", handlers.c2bValidation);
    expressRouter.post("/c2b-confirmation", handlers.c2bConfirmation);
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

    return expressRouter;
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
  type STKCallback,
  type C2BCallback,
  type ParsedCallbackData,
  type ParsedC2BCallback,
} from "@singularity-payments/core";
