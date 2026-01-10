import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMpesaHandlers } from "../src/handlers";
import { MpesaClient } from "@singularity-payments/core";
import type { Request, Response } from "express";
import {
  mockSTKCallbackSuccess,
  mockSTKCallbackFailure,
  mockC2BCallback,
  mockB2CCallback,
  mockB2BCallback,
  mockBalanceCallback,
  mockTransactionStatusCallback,
  mockReversalCallback,
} from "./mockData";

// Mock MpesaClient
vi.mock("@singularity-payments/core", () => ({
  MpesaClient: vi.fn(),
}));

describe("createMpesaHandlers", () => {
  let mockClient: any;
  let handlers: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock response
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

    // Create mock client with all methods
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

  describe("STK Callback Handler", () => {
    it("should handle successful STK callback", async () => {
      mockReq.body = mockSTKCallbackSuccess;
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.stkCallback(mockReq as Request, mockRes as Response);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockSTKCallbackSuccess,
        "196.201.214.200",
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        ResultCode: 0,
        ResultDesc: "Success",
      });
    });

    it("should handle failed STK callback", async () => {
      mockReq.body = mockSTKCallbackFailure;
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      await handlers.stkCallback(mockReq as Request, mockRes as Response);

      expect(mockClient.handleSTKCallback).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it("should handle errors in STK callback", async () => {
      mockReq.body = mockSTKCallbackSuccess;
      mockClient.handleSTKCallback.mockRejectedValue(
        new Error("Database error"),
      );

      await handlers.stkCallback(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        ResultCode: 1,
        ResultDesc: "Internal error processing callback",
      });
    });

    it("should extract IP from x-forwarded-for header", async () => {
      mockReq.headers = { "x-forwarded-for": "203.0.113.1" };
      mockReq.body = mockSTKCallbackSuccess;
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.stkCallback(mockReq as Request, mockRes as Response);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockSTKCallbackSuccess,
        "203.0.113.1",
      );
    });
  });

  describe("C2B Validation Handler", () => {
    it("should handle C2B validation", async () => {
      mockReq.body = mockC2BCallback;
      mockClient.handleC2BValidation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      await handlers.c2bValidation(mockReq as Request, mockRes as Response);

      expect(mockClient.handleC2BValidation).toHaveBeenCalledWith(
        mockC2BCallback,
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it("should handle C2B validation errors", async () => {
      mockReq.body = mockC2BCallback;
      mockClient.handleC2BValidation.mockRejectedValue(
        new Error("Validation failed"),
      );

      await handlers.c2bValidation(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        ResultCode: 1,
        ResultDesc: "Validation failed",
      });
    });
  });

  describe("C2B Confirmation Handler", () => {
    it("should handle C2B confirmation", async () => {
      mockReq.body = mockC2BCallback;
      mockClient.handleC2BConfirmation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.c2bConfirmation(mockReq as Request, mockRes as Response);

      expect(mockClient.handleC2BConfirmation).toHaveBeenCalledWith(
        mockC2BCallback,
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe("B2C Handlers", () => {
    it("should handle B2C result callback", async () => {
      mockReq.body = mockB2CCallback;
      mockClient.handleB2CCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.b2cResult(mockReq as Request, mockRes as Response);

      expect(mockClient.handleB2CCallback).toHaveBeenCalledWith(
        mockB2CCallback,
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it("should handle B2C timeout", async () => {
      mockReq.body = { TransactionID: "test-123" };

      await handlers.b2cTimeout(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });

    it("should handle B2C errors", async () => {
      mockReq.body = mockB2CCallback;
      mockClient.handleB2CCallback.mockRejectedValue(
        new Error("Processing error"),
      );

      await handlers.b2cResult(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });
  });

  describe("B2B Handlers", () => {
    it("should handle B2B result callback", async () => {
      mockReq.body = mockB2BCallback;
      mockClient.handleB2BCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.b2bResult(mockReq as Request, mockRes as Response);

      expect(mockClient.handleB2BCallback).toHaveBeenCalledWith(
        mockB2BCallback,
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it("should handle B2B timeout", async () => {
      mockReq.body = { TransactionID: "test-123" };

      await handlers.b2bTimeout(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });
  });

  describe("STK Push Handler", () => {
    it("should handle STK push request", async () => {
      mockReq.body = {
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "INV-001",
        transactionDesc: "Payment",
      };

      mockClient.stkPush.mockResolvedValue({
        MerchantRequestID: "test-123",
        CheckoutRequestID: "test-456",
        ResponseCode: "0",
        ResponseDescription: "Success",
        CustomerMessage: "Success",
      });

      await handlers.stkPush(mockReq as Request, mockRes as Response);

      expect(mockClient.stkPush).toHaveBeenCalledWith({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "INV-001",
        transactionDesc: "Payment",
        callbackUrl: undefined,
      });
      expect(mockJson).toHaveBeenCalled();
    });

    it("should validate required fields for STK push", async () => {
      mockReq.body = { amount: 1000 }; // Missing phoneNumber

      await handlers.stkPush(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Amount and phone number are required",
      });
    });

    it("should handle STK push errors", async () => {
      mockReq.body = {
        amount: 1000,
        phoneNumber: "254712345678",
      };

      mockClient.stkPush.mockRejectedValue(new Error("API Error"));

      await handlers.stkPush(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: "API Error",
      });
    });
  });

  describe("STK Query Handler", () => {
    it("should handle STK query request", async () => {
      mockReq.body = {
        CheckoutRequestID: "test-456",
      };

      mockClient.stkQuery.mockResolvedValue({
        ResponseCode: "0",
        ResponseDescription: "Success",
        ResultCode: "0",
        ResultDesc: "Success",
      });

      await handlers.stkQuery(mockReq as Request, mockRes as Response);

      expect(mockClient.stkQuery).toHaveBeenCalledWith({
        CheckoutRequestID: "test-456",
      });
    });

    it("should validate CheckoutRequestID", async () => {
      mockReq.body = {};

      await handlers.stkQuery(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "CheckoutRequestID is required",
      });
    });
  });

  describe("B2C Request Handler", () => {
    it("should handle B2C request", async () => {
      mockReq.body = {
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        remarks: "Salary",
      };

      mockClient.b2c.mockResolvedValue({
        ConversationID: "test-123",
        OriginatorConversationID: "test-456",
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.b2c(mockReq as Request, mockRes as Response);

      expect(mockClient.b2c).toHaveBeenCalled();
    });

    it("should validate B2C required fields", async () => {
      mockReq.body = { amount: 1000 }; // Missing phoneNumber and commandID

      await handlers.b2c(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe("B2B Request Handler", () => {
    it("should handle B2B request", async () => {
      mockReq.body = {
        amount: 5000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        accountReference: "INV-001",
        remarks: "Payment",
      };

      mockClient.b2b.mockResolvedValue({
        ConversationID: "test-123",
        OriginatorConversationID: "test-456",
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.b2b(mockReq as Request, mockRes as Response);

      expect(mockClient.b2b).toHaveBeenCalled();
    });

    it("should validate B2B required fields", async () => {
      mockReq.body = { amount: 5000 }; // Missing required fields

      await handlers.b2b(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe("Account Balance Handler", () => {
    it("should handle balance request", async () => {
      mockReq.body = {
        identifierType: "4",
        remarks: "Balance check",
      };

      mockClient.accountBalance.mockResolvedValue({
        ConversationID: "test-123",
        OriginatorConversationID: "test-456",
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.balance(mockReq as Request, mockRes as Response);

      expect(mockClient.accountBalance).toHaveBeenCalled();
    });

    it("should handle balance callback", async () => {
      mockReq.body = mockBalanceCallback;
      mockClient.handleAccountBalanceCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.balanceResult(mockReq as Request, mockRes as Response);

      expect(mockClient.handleAccountBalanceCallback).toHaveBeenCalled();
    });

    it("should handle balance timeout", async () => {
      mockReq.body = { TransactionID: "test-123" };

      await handlers.balanceTimeout(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });
  });

  describe("Transaction Status Handler", () => {
    it("should handle transaction status request", async () => {
      mockReq.body = {
        transactionID: "ABC123",
      };

      mockClient.transactionStatus.mockResolvedValue({
        ConversationID: "test-123",
        OriginatorConversationID: "test-456",
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.transactionStatus(mockReq as Request, mockRes as Response);

      expect(mockClient.transactionStatus).toHaveBeenCalled();
    });

    it("should validate transactionID", async () => {
      mockReq.body = {};

      await handlers.transactionStatus(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should handle status callback", async () => {
      mockReq.body = mockTransactionStatusCallback;
      mockClient.handleTransactionStatusCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.statusResult(mockReq as Request, mockRes as Response);

      expect(mockClient.handleTransactionStatusCallback).toHaveBeenCalled();
    });
  });

  describe("Reversal Handler", () => {
    it("should handle reversal request", async () => {
      mockReq.body = {
        transactionID: "ABC123",
        amount: 1000,
      };

      mockClient.reversal.mockResolvedValue({
        ConversationID: "test-123",
        OriginatorConversationID: "test-456",
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.reversal(mockReq as Request, mockRes as Response);

      expect(mockClient.reversal).toHaveBeenCalled();
    });

    it("should validate reversal required fields", async () => {
      mockReq.body = { transactionID: "ABC123" }; // Missing amount

      await handlers.reversal(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should handle reversal callback", async () => {
      mockReq.body = mockReversalCallback;
      mockClient.handleReversalCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.reversalResult(mockReq as Request, mockRes as Response);

      expect(mockClient.handleReversalCallback).toHaveBeenCalled();
    });
  });

  describe("C2B Registration Handler", () => {
    it("should handle C2B URL registration", async () => {
      mockReq.body = {
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      };

      mockClient.registerC2BUrl.mockResolvedValue({
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.registerC2B(mockReq as Request, mockRes as Response);

      expect(mockClient.registerC2BUrl).toHaveBeenCalled();
    });

    it("should validate URLs for C2B registration", async () => {
      mockReq.body = { confirmationURL: "https://example.com/confirmation" }; // Missing validationURL

      await handlers.registerC2B(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe("C2B Simulation Handler", () => {
    it("should handle C2B simulation", async () => {
      mockReq.body = {
        shortCode: "600000",
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
        commandID: "CustomerPayBillOnline",
      };

      mockClient.simulateC2B.mockResolvedValue({
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.simulateC2B(mockReq as Request, mockRes as Response);

      expect(mockClient.simulateC2B).toHaveBeenCalled();
    });

    it("should validate C2B simulation fields", async () => {
      mockReq.body = { amount: 1000 }; // Missing required fields

      await handlers.simulateC2B(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe("QR Code Generation Handler", () => {
    it("should generate QR code", async () => {
      mockReq.body = {
        merchantName: "Test Business",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      };

      mockClient.generateDynamicQR.mockResolvedValue({
        ResponseCode: "00",
        ResponseDescription: "Success",
        QRCode: "base64-encoded-qr",
      });

      await handlers.generateQR(mockReq as Request, mockRes as Response);

      expect(mockClient.generateDynamicQR).toHaveBeenCalled();
    });

    it("should validate QR generation fields", async () => {
      mockReq.body = { merchantName: "Test" }; // Missing required fields

      await handlers.generateQR(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should validate QR size parameter", async () => {
      mockReq.body = {
        merchantName: "Test Business",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: "400", // Invalid size
      };
      await handlers.generateQR(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Size must be either '300' or '500'",
      });
    });
  });
});
