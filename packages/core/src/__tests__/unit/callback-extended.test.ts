import { describe, it, expect, vi } from "vitest";
import { MpesaCallbackHandler } from "../../utils/callback";
import { mockB2CCallback, successfulSTKCallback } from "../fixtures/callbacks";
import {
  B2BCallback,
  AccountBalanceCallback,
  TransactionStatusCallback,
  ReversalCallback,
} from "../../types/mpesa";

describe("MpesaCallbackHandler Extended", () => {
  describe("B2C Callbacks", () => {
    it("should parse successful B2C callback", () => {
      const handler = new MpesaCallbackHandler();
      const parsed = handler.parseB2CCallback(mockB2CCallback);

      expect(parsed.isSuccess).toBe(true);
      expect(parsed.transactionId).toBe("NLJ7RT61SV");
      expect(parsed.amount).toBe(5000);
      expect(parsed.charges).toBe(50);
    });

    it("should parse failed B2C callback", () => {
      const handler = new MpesaCallbackHandler();
      const failedCallback: any = {
        Result: {
          ResultType: 0,
          ResultCode: 1,
          ResultDesc: "Insufficient funds",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
        },
      };

      const parsed = handler.parseB2CCallback(failedCallback);

      expect(parsed.isSuccess).toBe(false);
      expect(parsed.errorMessage).toBeTruthy();
    });
  });

  describe("B2B Callbacks", () => {
    it("should parse successful B2B callback", () => {
      const handler = new MpesaCallbackHandler();
      const callback: B2BCallback = {
        Result: {
          ResultType: 0,
          ResultCode: 0,
          ResultDesc: "Success",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
          ResultParameters: {
            ResultParameter: [
              { Key: "Amount", Value: 1000 },
              { Key: "DebitAccountBalance", Value: "5000.00" },
              { Key: "TransCompletedTime", Value: "20231201120000" },
              { Key: "ReceiverPartyPublicName", Value: "Test Business" },
              { Key: "Currency", Value: "KES" },
            ],
          },
        },
      };

      const parsed = handler.parseB2BCallback(callback);

      expect(parsed.isSuccess).toBe(true);
      expect(parsed.amount).toBe(1000);
      expect(parsed.debitAccountBalance).toBe("5000.00");
      expect(parsed.currency).toBe("KES");
    });

    it("should parse failed B2B callback", () => {
      const handler = new MpesaCallbackHandler();
      const callback: B2BCallback = {
        Result: {
          ResultType: 0,
          ResultCode: 1,
          ResultDesc: "Failed",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
        },
      };

      const parsed = handler.parseB2BCallback(callback);

      expect(parsed.isSuccess).toBe(false);
      expect(parsed.errorMessage).toBeTruthy();
    });
  });

  describe("Account Balance Callbacks", () => {
    it("should parse successful account balance callback", () => {
      const handler = new MpesaCallbackHandler();
      const callback: AccountBalanceCallback = {
        Result: {
          ResultType: 0,
          ResultCode: 0,
          ResultDesc: "Success",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
          ResultParameters: {
            ResultParameter: [
              { Key: "WorkingAccountAvailableFunds", Value: 10000 },
              { Key: "AvailableBalance", Value: 9500 },
              { Key: "BookedBalance", Value: 10500 },
            ],
          },
        },
      };

      const parsed = handler.parseAccountBalanceCallback(callback);

      expect(parsed.isSuccess).toBe(true);
      expect(parsed.workingBalance).toBe(10000);
      expect(parsed.availableBalance).toBe(9500);
      expect(parsed.bookedBalance).toBe(10500);
    });

    it("should parse failed account balance callback", () => {
      const handler = new MpesaCallbackHandler();
      const callback: AccountBalanceCallback = {
        Result: {
          ResultType: 0,
          ResultCode: 1,
          ResultDesc: "Failed",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
        },
      };

      const parsed = handler.parseAccountBalanceCallback(callback);

      expect(parsed.isSuccess).toBe(false);
      expect(parsed.errorMessage).toBeTruthy();
    });
  });

  describe("Transaction Status Callbacks", () => {
    it("should parse successful transaction status callback", () => {
      const handler = new MpesaCallbackHandler();
      const callback: TransactionStatusCallback = {
        Result: {
          ResultType: 0,
          ResultCode: 0,
          ResultDesc: "Success",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
          ResultParameters: {
            ResultParameter: [
              { Key: "ReceiptNo", Value: "NLJ7RT61SV" },
              { Key: "Amount", Value: 1000 },
              { Key: "FinalisedTime", Value: "20231201120000" },
            ],
          },
        },
      };

      const parsed = handler.parseTransactionStatusCallback(callback);

      expect(parsed.isSuccess).toBe(true);
      expect(parsed.receiptNo).toBe("NLJ7RT61SV");
      expect(parsed.amount).toBe(1000);
      expect(parsed.completedTime).toBe("20231201120000");
    });

    it("should parse failed transaction status callback", () => {
      const handler = new MpesaCallbackHandler();
      const callback: TransactionStatusCallback = {
        Result: {
          ResultType: 0,
          ResultCode: 1,
          ResultDesc: "Transaction not found",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
        },
      };

      const parsed = handler.parseTransactionStatusCallback(callback);

      expect(parsed.isSuccess).toBe(false);
      expect(parsed.errorMessage).toBeTruthy();
    });
  });

  describe("Reversal Callbacks", () => {
    it("should parse successful reversal callback", () => {
      const handler = new MpesaCallbackHandler();
      const callback: ReversalCallback = {
        Result: {
          ResultType: 0,
          ResultCode: 0,
          ResultDesc: "Success",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
        },
      };

      const parsed = handler.parseReversalCallback(callback);

      expect(parsed.isSuccess).toBe(true);
      expect(parsed.transactionId).toBe("trans-789");
    });

    it("should parse failed reversal callback", () => {
      const handler = new MpesaCallbackHandler();
      const callback: ReversalCallback = {
        Result: {
          ResultType: 0,
          ResultCode: 1,
          ResultDesc: "Reversal failed",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
        },
      };

      const parsed = handler.parseReversalCallback(callback);

      expect(parsed.isSuccess).toBe(false);
      expect(parsed.errorMessage).toBeTruthy();
    });
  });

  describe("Logging", () => {
    it("should use custom logger when provided", async () => {
      const logger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      const handler = new MpesaCallbackHandler({ logger });

      await handler.handleCallback(successfulSTKCallback);

      expect(logger.info).toHaveBeenCalled();
    });
  });
});
