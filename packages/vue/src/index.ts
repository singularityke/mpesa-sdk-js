import { MpesaVueClient, type MpesaClientConfig } from "./client";

/**
 * Create M-Pesa client for Vue applications
 */
export function createMpesaClient(config?: MpesaClientConfig) {
  return new MpesaVueClient(config);
}

// Re-export client class and config
export { MpesaVueClient, type MpesaClientConfig } from "./client";

// Re-export all core types for convenience
export type {
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
  STKCallback,
  C2BCallback,
  B2CCallback,
  B2BCallback,
} from "@singularity-payments/core";
