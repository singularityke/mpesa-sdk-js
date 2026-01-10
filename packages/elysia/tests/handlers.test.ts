import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMpesaHandlers } from "../src/handlers";
import { createMockMpesaClient } from "./mocks/mpesa-client.mock";
import type { Context } from "elysia";

describe("M-Pesa Handlers", () => {
  let handlers: ReturnType<typeof createMpesaHandlers>;
  let mockClient: ReturnType<typeof createMockMpesaClient>;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    mockClient = createMockMpesaClient();
    handlers = createMpesaHandlers(mockClient);
    mockContext = {
      body: {},
      set: {
        status: 200,
        headers: {},
      },
      request: {
        headers: new Headers(),
      } as any,
    };
  });

  describe("STK Push Callback", () => {
    it("should handle successful STK callback", async () => {
      const callbackData = {
        Body: {
          stkCallback: {
            MerchantRequestID: "test-merchant-id",
            CheckoutRequestID: "test-checkout-id",
            ResultCode: 0,
            ResultDesc: "Success",
          },
        },
      };

      mockContext.body = callbackData;

      const result = await handlers.stkCallback(mockContext as Context);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        callbackData,
        undefined,
      );
      expect(result).toEqual({
        ResultCode: 0,
        ResultDesc: "Success",
      });
      expect(mockContext.set?.status).toBe(200);
    });

    it("should handle STK callback with IP address", async () => {
      const callbackData = {
        Body: { stkCallback: { ResultCode: 0 } },
      };

      mockContext.body = callbackData;
      mockContext.request = {
        headers: new Headers({
          "x-forwarded-for": "192.168.1.1",
        }),
      } as any;

      await handlers.stkCallback(mockContext as Context);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        callbackData,
        "192.168.1.1",
      );
    });

    it("should handle STK callback errors gracefully", async () => {
      vi.mocked(mockClient.handleSTKCallback).mockRejectedValueOnce(
        new Error("Processing failed"),
      );

      mockContext.body = { Body: { stkCallback: {} } };

      const result = await handlers.stkCallback(mockContext as Context);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Internal error processing callback",
      });
      expect(mockContext.set?.status).toBe(200);
    });
  });

  describe("C2B Validation", () => {
    it("should handle C2B validation", async () => {
      const validationData = {
        TransactionType: "Pay Bill",
        TransID: "test-trans-id",
        TransAmount: "100",
        BillRefNumber: "account123",
        MSISDN: "254712345678",
      };

      mockContext.body = validationData;

      const result = await handlers.c2bValidation(mockContext as Context);

      expect(mockClient.handleC2BValidation).toHaveBeenCalledWith(
        validationData,
      );
      expect(result.ResultCode).toBe(0);
    });

    it("should handle validation errors", async () => {
      vi.mocked(mockClient.handleC2BValidation).mockRejectedValueOnce(
        new Error("Invalid transaction"),
      );

      mockContext.body = {};

      const result = await handlers.c2bValidation(mockContext as Context);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Validation failed",
      });
    });
  });

  describe("C2B Confirmation", () => {
    it("should handle C2B confirmation", async () => {
      const confirmationData = {
        TransactionType: "Pay Bill",
        TransID: "test-trans-id",
        TransAmount: "100",
      };

      mockContext.body = confirmationData;

      const result = await handlers.c2bConfirmation(mockContext as Context);

      expect(mockClient.handleC2BConfirmation).toHaveBeenCalledWith(
        confirmationData,
      );
      expect(result.ResultCode).toBe(0);
    });
  });

  describe("STK Push", () => {
    it("should initiate STK push successfully", async () => {
      mockContext.body = {
        amount: 100,
        phoneNumber: "254712345678",
        accountReference: "INV001",
        transactionDesc: "Payment for invoice",
      };

      const result = await handlers.stkPush(mockContext as Context);

      expect(mockClient.stkPush).toHaveBeenCalledWith({
        amount: 100,
        phoneNumber: "254712345678",
        accountReference: "INV001",
        transactionDesc: "Payment for invoice",
        callbackUrl: undefined,
      });
      expect(result.ResponseCode).toBe("0");
    });

    it("should handle missing required fields", async () => {
      mockContext.body = {
        amount: 100,
      };

      const result = await handlers.stkPush(mockContext as Context);

      expect(result).toEqual({
        error: "Amount and phone number are required",
      });
      expect(mockContext.set?.status).toBe(400);
    });

    it("should use default values for optional fields", async () => {
      mockContext.body = {
        amount: 100,
        phoneNumber: "254712345678",
      };

      await handlers.stkPush(mockContext as Context);

      expect(mockClient.stkPush).toHaveBeenCalledWith({
        amount: 100,
        phoneNumber: "254712345678",
        accountReference: "Payment",
        transactionDesc: "Payment",
        callbackUrl: undefined,
      });
    });
  });

  describe("STK Query", () => {
    it("should query STK push status", async () => {
      mockContext.body = {
        CheckoutRequestID: "test-checkout-id",
      };

      const result = await handlers.stkQuery(mockContext as Context);

      expect(mockClient.stkQuery).toHaveBeenCalledWith({
        CheckoutRequestID: "test-checkout-id",
      });
      expect(result.ResponseCode).toBe("0");
    });

    it("should handle missing CheckoutRequestID", async () => {
      mockContext.body = {};

      const result = await handlers.stkQuery(mockContext as Context);

      expect(result).toEqual({
        error: "CheckoutRequestID is required",
      });
      expect(mockContext.set?.status).toBe(400);
    });
  });

  describe("B2C", () => {
    it("should initiate B2C transaction", async () => {
      mockContext.body = {
        amount: 500,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        remarks: "Salary payment",
      };

      const result = await handlers.b2c(mockContext as Context);

      expect(mockClient.b2c).toHaveBeenCalledWith({
        amount: 500,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        remarks: "Salary payment",
        occasion: undefined,
        resultUrl: undefined,
        timeoutUrl: undefined,
      });
      expect(result.ResponseCode).toBe("0");
    });

    it("should handle missing required fields", async () => {
      mockContext.body = {
        amount: 500,
        phoneNumber: "254712345678",
      };

      const result = await handlers.b2c(mockContext as Context);

      expect(result).toEqual({
        error: "Amount, phone number, and command ID are required",
      });
      expect(mockContext.set?.status).toBe(400);
    });
  });

  describe("B2B", () => {
    it("should initiate B2B transaction", async () => {
      mockContext.body = {
        amount: 1000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        accountReference: "ACC123",
        remarks: "Payment",
      };

      const result = await handlers.b2b(mockContext as Context);

      expect(mockClient.b2b).toHaveBeenCalledWith({
        amount: 1000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        senderIdentifierType: undefined,
        receiverIdentifierType: undefined,
        accountReference: "ACC123",
        remarks: "Payment",
        resultUrl: undefined,
        timeoutUrl: undefined,
      });
      expect(result.ResponseCode).toBe("0");
    });

    it("should handle missing required fields", async () => {
      mockContext.body = {
        amount: 1000,
      };

      const result = await handlers.b2b(mockContext as Context);

      expect(result).toEqual({
        error: "Amount, partyB, commandID, and account reference are required",
      });
      expect(mockContext.set?.status).toBe(400);
    });
  });

  describe("Simulate C2B", () => {
    it("should simulate C2B transaction", async () => {
      mockContext.body = {
        shortCode: "600000",
        amount: 100,
        phoneNumber: "254712345678",
        billRefNumber: "INVOICE001",
      };

      const result = await handlers.simulateC2B(mockContext as Context);

      expect(mockClient.simulateC2B).toHaveBeenCalledWith({
        shortCode: "600000",
        amount: 100,
        phoneNumber: "254712345678",
        billRefNumber: "INVOICE001",
        commandID: undefined,
      });
      expect(result.ResponseCode).toBe("0");
    });

    it("should handle missing required fields", async () => {
      mockContext.body = {
        amount: 100,
      };

      const result = await handlers.simulateC2B(mockContext as Context);

      expect(result).toEqual({
        error: "Amount, phone number, and bill reference number are required",
      });
      expect(mockContext.set?.status).toBe(400);
    });
  });

  describe("Transaction Status", () => {
    it("should query transaction status", async () => {
      mockContext.body = {
        transactionID: "TEST123456",
      };

      const result = await handlers.transactionStatus(mockContext as Context);

      expect(mockClient.transactionStatus).toHaveBeenCalled();
      expect(result.ResponseCode).toBe("0");
    });

    it("should handle missing transaction ID", async () => {
      mockContext.body = {};

      const result = await handlers.transactionStatus(mockContext as Context);

      expect(result).toEqual({
        error: "Transaction ID is required",
      });
      expect(mockContext.set?.status).toBe(400);
    });
  });

  describe("Reversal", () => {
    it("should initiate reversal", async () => {
      mockContext.body = {
        transactionID: "TEST123456",
        amount: 100,
      };

      const result = await handlers.reversal(mockContext as Context);

      expect(mockClient.reversal).toHaveBeenCalled();
      expect(result.ResponseCode).toBe("0");
    });

    it("should handle missing required fields", async () => {
      mockContext.body = {
        transactionID: "TEST123456",
      };

      const result = await handlers.reversal(mockContext as Context);

      expect(result).toEqual({
        error: "Transaction ID and amount are required",
      });
      expect(mockContext.set?.status).toBe(400);
    });
  });

  describe("Register C2B URLs", () => {
    it("should register C2B URLs", async () => {
      mockContext.body = {
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      };

      const result = await handlers.registerC2B(mockContext as Context);

      expect(mockClient.registerC2BUrl).toHaveBeenCalledWith({
        shortCode: undefined,
        responseType: undefined,
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      });
      expect(result.ResponseCode).toBe("0");
    });

    it("should handle missing URLs", async () => {
      mockContext.body = {};

      const result = await handlers.registerC2B(mockContext as Context);

      expect(result).toEqual({
        error: "Confirmation URL and validation URL are required",
      });
      expect(mockContext.set?.status).toBe(400);
    });
  });

  describe("Generate QR Code", () => {
    it("should generate QR code", async () => {
      mockContext.body = {
        merchantName: "Test Shop",
        refNo: "INV001",
        amount: 500,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      };

      const result = await handlers.generateQR(mockContext as Context);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith({
        merchantName: "Test Shop",
        refNo: "INV001",
        amount: 500,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: undefined,
      });
      expect(result.ResponseCode).toBe("00");
    });

    it("should handle QR size parameter", async () => {
      mockContext.body = {
        merchantName: "Test Shop",
        refNo: "INV001",
        amount: 500,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: "500",
      };

      await handlers.generateQR(mockContext as Context);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith(
        expect.objectContaining({
          size: "500",
        }),
      );
    });

    it("should reject invalid QR size", async () => {
      mockContext.body = {
        merchantName: "Test Shop",
        refNo: "INV001",
        amount: 500,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: "400",
      };

      const result = await handlers.generateQR(mockContext as Context);

      expect(result).toEqual({
        error: "Size must be either '300' or '500'",
      });
      expect(mockContext.set?.status).toBe(400);
    });

    it("should handle missing required fields", async () => {
      mockContext.body = {
        merchantName: "Test Shop",
      };

      const result = await handlers.generateQR(mockContext as Context);

      expect(result.error).toContain("required");
      expect(mockContext.set?.status).toBe(400);
    });
  });

  describe("Timeout Handlers", () => {
    it("should handle B2C timeout", async () => {
      mockContext.body = { some: "data" };

      const result = await handlers.b2cTimeout(mockContext as Context);

      expect(result).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
      expect(mockContext.set?.status).toBe(200);
    });

    it("should handle B2B timeout", async () => {
      mockContext.body = { some: "data" };

      const result = await handlers.b2bTimeout(mockContext as Context);

      expect(result).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });

    it("should handle balance timeout", async () => {
      mockContext.body = { some: "data" };

      const result = await handlers.balanceTimeout(mockContext as Context);

      expect(result).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });

    it("should handle reversal timeout", async () => {
      mockContext.body = { some: "data" };

      const result = await handlers.reversalTimeout(mockContext as Context);

      expect(result).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });

    it("should handle status timeout", async () => {
      mockContext.body = { some: "data" };

      const result = await handlers.statusTimeout(mockContext as Context);

      expect(result).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });
  });
});
