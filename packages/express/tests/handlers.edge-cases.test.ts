import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMpesaHandlers } from "../src/handlers";
import type { Request, Response } from "express";

describe("Handler Edge Cases and Error Paths", () => {
  let mockClient: any;
  let handlers: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJson = vi.fn().mockReturnThis();
    mockStatus = vi.fn().mockReturnThis();

    mockRes = {
      json: mockJson,
      status: mockStatus,
    };

    mockReq = {
      body: {},
      headers: {},
      ip: "196.201.214.200",
    };

    mockClient = {
      handleSTKCallback: vi.fn(),
      handleC2BValidation: vi.fn(),
      handleC2BConfirmation: vi.fn(),
      handleB2CCallback: vi.fn(),
      handleB2BCallback: vi.fn(),
      handleAccountBalanceCallback: vi.fn(),
      handleTransactionStatusCallback: vi.fn(),
      handleReversalCallback: vi.fn(),
      stkPush: vi.fn(),
      stkQuery: vi.fn(),
      b2c: vi.fn(),
      b2b: vi.fn(),
      accountBalance: vi.fn(),
      transactionStatus: vi.fn(),
      reversal: vi.fn(),
      registerC2BUrl: vi.fn(),
      generateDynamicQR: vi.fn(),
      simulateC2B: vi.fn(),
    };

    handlers = createMpesaHandlers(mockClient);
  });

  describe("STK Callback - Error Scenarios", () => {
    it("should handle errors without message property", async () => {
      mockReq.body = {
        Body: {
          stkCallback: {
            MerchantRequestID: "123",
            CheckoutRequestID: "456",
            ResultCode: 0,
            ResultDesc: "Success",
          },
        },
      };
      mockClient.handleSTKCallback.mockRejectedValue({ code: "ERR_NETWORK" });

      await handlers.stkCallback(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        ResultCode: 1,
        ResultDesc: "Internal error processing callback",
      });
    });

    it("should handle x-real-ip header", async () => {
      mockReq.headers = { "x-real-ip": "203.0.113.5" };
      mockReq.body = {
        Body: {
          stkCallback: {
            MerchantRequestID: "123",
            CheckoutRequestID: "456",
            ResultCode: 0,
            ResultDesc: "Success",
          },
        },
      };
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.stkCallback(mockReq as Request, mockRes as Response);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockReq.body,
        "203.0.113.5",
      );
    });

    it("should handle array x-forwarded-for header", async () => {
      mockReq.headers = { "x-forwarded-for": ["203.0.113.1", "203.0.113.2"] };
      mockReq.body = {
        Body: {
          stkCallback: {
            MerchantRequestID: "123",
            CheckoutRequestID: "456",
            ResultCode: 0,
            ResultDesc: "Success",
          },
        },
      };
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.stkCallback(mockReq as Request, mockRes as Response);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockReq.body,
        undefined,
      );
    });
  });

  describe("C2B Validation - Error Paths", () => {
    it("should handle validation errors without message", async () => {
      mockReq.body = { TransactionType: "Pay Bill", TransID: "ABC123" };
      mockClient.handleC2BValidation.mockRejectedValue(new Error());

      await handlers.c2bValidation(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        ResultCode: 1,
        ResultDesc: "Validation failed",
      });
    });
  });

  describe("C2B Confirmation - Error Paths", () => {
    it("should handle confirmation errors", async () => {
      mockReq.body = { TransactionType: "Pay Bill", TransID: "ABC123" };
      mockClient.handleC2BConfirmation.mockRejectedValue(new Error("DB error"));

      await handlers.c2bConfirmation(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });
  });

  describe("STK Push - Error Paths", () => {
    it("should handle STK push with only amount (missing phoneNumber)", async () => {
      mockReq.body = { amount: 1000 };

      await handlers.stkPush(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should handle STK push with only phoneNumber (missing amount)", async () => {
      mockReq.body = { phoneNumber: "254712345678" };

      await handlers.stkPush(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should handle STK push with custom callbackUrl", async () => {
      mockReq.body = {
        amount: 1000,
        phoneNumber: "254712345678",
        callbackUrl: "https://custom.com/callback",
      };
      mockClient.stkPush.mockResolvedValue({ ResponseCode: "0" });

      await handlers.stkPush(mockReq as Request, mockRes as Response);

      expect(mockClient.stkPush).toHaveBeenCalledWith(
        expect.objectContaining({
          callbackUrl: "https://custom.com/callback",
        }),
      );
    });

    it("should handle STK push errors without message", async () => {
      mockReq.body = { amount: 1000, phoneNumber: "254712345678" };
      mockClient.stkPush.mockRejectedValue({});

      await handlers.stkPush(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({ error: "Request failed" });
    });
  });

  describe("STK Query - Error Paths", () => {
    it("should handle STK query errors without message", async () => {
      mockReq.body = { CheckoutRequestID: "test-123" };
      mockClient.stkQuery.mockRejectedValue({});

      await handlers.stkQuery(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({ error: "Request failed" });
    });
  });

  describe("B2C Request - Error Paths", () => {
    it("should handle B2C with custom URLs", async () => {
      mockReq.body = {
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        resultUrl: "https://custom.com/result",
        timeoutUrl: "https://custom.com/timeout",
      };
      mockClient.b2c.mockResolvedValue({ ResponseCode: "0" });

      await handlers.b2c(mockReq as Request, mockRes as Response);

      expect(mockClient.b2c).toHaveBeenCalledWith(
        expect.objectContaining({
          resultUrl: "https://custom.com/result",
          timeoutUrl: "https://custom.com/timeout",
        }),
      );
    });

    it("should handle B2C with occasion", async () => {
      mockReq.body = {
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        occasion: "Salary Payment",
      };
      mockClient.b2c.mockResolvedValue({ ResponseCode: "0" });

      await handlers.b2c(mockReq as Request, mockRes as Response);

      expect(mockClient.b2c).toHaveBeenCalledWith(
        expect.objectContaining({
          occasion: "Salary Payment",
        }),
      );
    });

    it("should handle B2C errors without message", async () => {
      mockReq.body = {
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
      };
      mockClient.b2c.mockRejectedValue({});

      await handlers.b2c(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({ error: "Request failed" });
    });
  });

  describe("B2B Request - Error Paths", () => {
    it("should handle B2B with custom URLs", async () => {
      mockReq.body = {
        amount: 5000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        accountReference: "INV-001",
        resultUrl: "https://custom.com/result",
        timeoutUrl: "https://custom.com/timeout",
      };
      mockClient.b2b.mockResolvedValue({ ResponseCode: "0" });

      await handlers.b2b(mockReq as Request, mockRes as Response);

      expect(mockClient.b2b).toHaveBeenCalledWith(
        expect.objectContaining({
          resultUrl: "https://custom.com/result",
          timeoutUrl: "https://custom.com/timeout",
        }),
      );
    });

    it("should handle B2B with identifier types", async () => {
      mockReq.body = {
        amount: 5000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        accountReference: "INV-001",
        senderIdentifierType: "4",
        receiverIdentifierType: "4",
      };
      mockClient.b2b.mockResolvedValue({ ResponseCode: "0" });

      await handlers.b2b(mockReq as Request, mockRes as Response);

      expect(mockClient.b2b).toHaveBeenCalledWith(
        expect.objectContaining({
          senderIdentifierType: "4",
          receiverIdentifierType: "4",
        }),
      );
    });

    it("should handle B2B errors without message", async () => {
      mockReq.body = {
        amount: 5000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        accountReference: "INV-001",
      };
      mockClient.b2b.mockRejectedValue({});

      await handlers.b2b(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({ error: "Request failed" });
    });
  });

  describe("C2B Registration - Error Paths", () => {
    it("should handle C2B registration with shortCode and responseType", async () => {
      mockReq.body = {
        shortCode: "600000",
        responseType: "Completed",
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      };
      mockClient.registerC2BUrl.mockResolvedValue({ ResponseCode: "0" });

      await handlers.registerC2B(mockReq as Request, mockRes as Response);

      expect(mockClient.registerC2BUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          shortCode: "600000",
          responseType: "Completed",
        }),
      );
    });

    it("should handle C2B registration errors without message", async () => {
      mockReq.body = {
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      };
      mockClient.registerC2BUrl.mockRejectedValue({});

      await handlers.registerC2B(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({ error: "Request failed" });
    });
  });

  describe("C2B Simulation - Error Paths", () => {
    it("should handle C2B simulation with all fields", async () => {
      mockReq.body = {
        shortCode: "600000",
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
        commandID: "CustomerPayBillOnline",
      };
      mockClient.simulateC2B.mockResolvedValue({ ResponseCode: "0" });

      await handlers.simulateC2B(mockReq as Request, mockRes as Response);

      expect(mockClient.simulateC2B).toHaveBeenCalledWith({
        shortCode: "600000",
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
        commandID: "CustomerPayBillOnline",
      });
    });

    it("should handle C2B simulation errors without message", async () => {
      mockReq.body = {
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
      };
      mockClient.simulateC2B.mockRejectedValue({});

      await handlers.simulateC2B(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({ error: "Request failed" });
    });
  });

  describe("QR Code Generation - Error Paths", () => {
    it("should handle QR generation with size 300", async () => {
      mockReq.body = {
        merchantName: "Test",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: "300",
      };
      mockClient.generateDynamicQR.mockResolvedValue({ ResponseCode: "00" });

      await handlers.generateQR(mockReq as Request, mockRes as Response);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith(
        expect.objectContaining({ size: "300" }),
      );
    });

    it("should handle QR generation with size 500", async () => {
      mockReq.body = {
        merchantName: "Test",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: "500",
      };
      mockClient.generateDynamicQR.mockResolvedValue({ ResponseCode: "00" });

      await handlers.generateQR(mockReq as Request, mockRes as Response);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith(
        expect.objectContaining({ size: "500" }),
      );
    });

    it("should handle QR generation without size", async () => {
      mockReq.body = {
        merchantName: "Test",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      };
      mockClient.generateDynamicQR.mockResolvedValue({ ResponseCode: "00" });

      await handlers.generateQR(mockReq as Request, mockRes as Response);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith(
        expect.objectContaining({ size: undefined }),
      );
    });

    it("should handle QR generation errors without message", async () => {
      mockReq.body = {
        merchantName: "Test",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      };
      mockClient.generateDynamicQR.mockRejectedValue({});

      await handlers.generateQR(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({ error: "Request failed" });
    });
  });
});
