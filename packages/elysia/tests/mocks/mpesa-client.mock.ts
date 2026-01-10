import { vi } from "vitest";
import type { MpesaClient } from "@singularity-payments/core";

export function createMockMpesaClient(): MpesaClient {
  return {
    handleSTKCallback: vi.fn().mockResolvedValue({
      ResultCode: 0,
      ResultDesc: "Success",
    }),
    handleC2BValidation: vi.fn().mockResolvedValue({
      ResultCode: 0,
      ResultDesc: "Accepted",
    }),
    handleC2BConfirmation: vi.fn().mockResolvedValue({
      ResultCode: 0,
      ResultDesc: "Success",
    }),
    handleB2CCallback: vi.fn().mockResolvedValue({
      ResultCode: 0,
      ResultDesc: "Success",
    }),
    handleB2BCallback: vi.fn().mockResolvedValue({
      ResultCode: 0,
      ResultDesc: "Success",
    }),
    handleAccountBalanceCallback: vi.fn().mockResolvedValue({
      ResultCode: 0,
      ResultDesc: "Success",
    }),
    handleTransactionStatusCallback: vi.fn().mockResolvedValue({
      ResultCode: 0,
      ResultDesc: "Success",
    }),
    handleReversalCallback: vi.fn().mockResolvedValue({
      ResultCode: 0,
      ResultDesc: "Success",
    }),

    stkPush: vi.fn().mockResolvedValue({
      MerchantRequestID: "mock-merchant-id",
      CheckoutRequestID: "mock-checkout-id",
      ResponseCode: "0",
      ResponseDescription: "Success",
      CustomerMessage: "Success. Request accepted for processing",
    }),
    stkQuery: vi.fn().mockResolvedValue({
      ResponseCode: "0",
      ResponseDescription: "The service request has been accepted successfully",
      MerchantRequestID: "mock-merchant-id",
      CheckoutRequestID: "mock-checkout-id",
      ResultCode: "0",
      ResultDesc: "The service request is processed successfully.",
    }),
    b2c: vi.fn().mockResolvedValue({
      ConversationID: "mock-conversation-id",
      OriginatorConversationID: "mock-originator-id",
      ResponseCode: "0",
      ResponseDescription: "Accept the service request successfully.",
    }),
    b2b: vi.fn().mockResolvedValue({
      ConversationID: "mock-conversation-id",
      OriginatorConversationID: "mock-originator-id",
      ResponseCode: "0",
      ResponseDescription: "Accept the service request successfully.",
    }),
    accountBalance: vi.fn().mockResolvedValue({
      ConversationID: "mock-conversation-id",
      OriginatorConversationID: "mock-originator-id",
      ResponseCode: "0",
      ResponseDescription: "Accept the service request successfully.",
    }),
    transactionStatus: vi.fn().mockResolvedValue({
      ConversationID: "mock-conversation-id",
      OriginatorConversationID: "mock-originator-id",
      ResponseCode: "0",
      ResponseDescription: "Accept the service request successfully.",
    }),
    reversal: vi.fn().mockResolvedValue({
      ConversationID: "mock-conversation-id",
      OriginatorConversationID: "mock-originator-id",
      ResponseCode: "0",
      ResponseDescription: "Accept the service request successfully.",
    }),
    registerC2BUrl: vi.fn().mockResolvedValue({
      ResponseCode: "0",
      ResponseDescription: "Success",
    }),
    generateDynamicQR: vi.fn().mockResolvedValue({
      ResponseCode: "00",
      ResponseDescription: "Success",
      QRCode: "mock-qr-code-data",
    }),
    simulateC2B: vi.fn().mockResolvedValue({
      ResponseCode: "0",
      ResponseDescription: "Success",
    }),
  } as unknown as MpesaClient;
}
