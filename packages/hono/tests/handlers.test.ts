import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMpesaHandlers } from "../src/handlers";
import { Context } from "hono";
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

describe("createMpesaHandlers", () => {
  let mockClient: any;
  let handlers: any;

  // Helper function to create mock Hono context
  const createMockContext = (body: any = {}, headers: any = {}) => {
    return {
      req: {
        json: vi.fn().mockResolvedValue(body),
        header: vi.fn((key: string) => headers[key]),
      },
      json: vi.fn(
        (data, status) => new Response(JSON.stringify(data), { status }),
      ),
    } as unknown as Context;
  };

  beforeEach(() => {
    vi.clearAllMocks();

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
      const c = createMockContext(mockSTKCallbackSuccess, {
        "x-forwarded-for": "196.201.214.200",
      });

      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.stkCallback(c);
      const jsonData = await response.json();

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockSTKCallbackSuccess,
        "196.201.214.200",
      );
      expect(response.status).toBe(200);
      expect(jsonData).toEqual({
        ResultCode: 0,
        ResultDesc: "Success",
      });
    });

    it("should handle failed STK callback", async () => {
      const c = createMockContext(mockSTKCallbackFailure);

      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      const response = await handlers.stkCallback(c);

      expect(mockClient.handleSTKCallback).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle errors in STK callback", async () => {
      const c = createMockContext(mockSTKCallbackSuccess);

      mockClient.handleSTKCallback.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await handlers.stkCallback(c);
      const jsonData = await response.json();

      expect(response.status).toBe(200);
      expect(jsonData).toEqual({
        ResultCode: 1,
        ResultDesc: "Internal error processing callback",
      });
    });

    it("should extract IP from x-forwarded-for header", async () => {
      const c = createMockContext(mockSTKCallbackSuccess, {
        "x-forwarded-for": "203.0.113.1",
      });

      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.stkCallback(c);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockSTKCallbackSuccess,
        "203.0.113.1",
      );
    });
  });

  describe("C2B Validation Handler", () => {
    it("should handle C2B validation", async () => {
      const c = createMockContext(mockC2BCallback);

      mockClient.handleC2BValidation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      const response = await handlers.c2bValidation(c);

      expect(mockClient.handleC2BValidation).toHaveBeenCalledWith(
        mockC2BCallback,
      );
      expect(response.status).toBe(200);
    });

    it("should handle C2B validation errors", async () => {
      const c = createMockContext(mockC2BCallback);

      mockClient.handleC2BValidation.mockRejectedValue(
        new Error("Validation failed"),
      );

      const response = await handlers.c2bValidation(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 1,
        ResultDesc: "Validation failed",
      });
    });
  });

  describe("C2B Confirmation Handler", () => {
    it("should handle C2B confirmation", async () => {
      const c = createMockContext(mockC2BCallback);

      mockClient.handleC2BConfirmation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.c2bConfirmation(c);

      expect(mockClient.handleC2BConfirmation).toHaveBeenCalledWith(
        mockC2BCallback,
      );
      expect(response.status).toBe(200);
    });
  });

  describe("B2C Handlers", () => {
    it("should handle B2C result callback", async () => {
      const c = createMockContext(mockB2CCallback);

      mockClient.handleB2CCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.b2cResult(c);

      expect(mockClient.handleB2CCallback).toHaveBeenCalledWith(
        mockB2CCallback,
      );
      expect(response.status).toBe(200);
    });

    it("should handle B2C timeout", async () => {
      const c = createMockContext({ TransactionID: "test-123" });

      const response = await handlers.b2cTimeout(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });

    it("should handle B2C errors", async () => {
      const c = createMockContext(mockB2CCallback);

      mockClient.handleB2CCallback.mockRejectedValue(
        new Error("Processing error"),
      );

      const response = await handlers.b2cResult(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });
  });

  describe("B2B Handlers", () => {
    it("should handle B2B result callback", async () => {
      const c = createMockContext(mockB2BCallback);

      mockClient.handleB2BCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.b2bResult(c);

      expect(mockClient.handleB2BCallback).toHaveBeenCalledWith(
        mockB2BCallback,
      );
      expect(response.status).toBe(200);
    });

    it("should handle B2B timeout", async () => {
      const c = createMockContext({ TransactionID: "test-123" });

      const response = await handlers.b2bTimeout(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });
  });

  describe("STK Push Handler", () => {
    it("should handle STK push request", async () => {
      const c = createMockContext({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "INV-001",
        transactionDesc: "Payment",
      });

      mockClient.stkPush.mockResolvedValue({
        MerchantRequestID: "test-123",
        CheckoutRequestID: "test-456",
        ResponseCode: "0",
        ResponseDescription: "Success",
        CustomerMessage: "Success",
      });

      const response = await handlers.stkPush(c);

      expect(mockClient.stkPush).toHaveBeenCalledWith({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "INV-001",
        transactionDesc: "Payment",
        callbackUrl: undefined,
      });
    });

    it("should validate required fields for STK push", async () => {
      const c = createMockContext({ amount: 1000 });

      const response = await handlers.stkPush(c);
      const jsonData = await response.json();

      expect(response.status).toBe(400);
      expect(jsonData).toEqual({
        error: "Amount and phone number are required",
      });
    });

    it("should handle STK push errors", async () => {
      const c = createMockContext({
        amount: 1000,
        phoneNumber: "254712345678",
      });

      mockClient.stkPush.mockRejectedValue(new Error("API Error"));

      const response = await handlers.stkPush(c);
      const jsonData = await response.json();

      expect(response.status).toBe(500);
      expect(jsonData).toEqual({
        error: "API Error",
      });
    });
  });

  describe("STK Query Handler", () => {
    it("should handle STK query request", async () => {
      const c = createMockContext({
        CheckoutRequestID: "test-456",
      });

      mockClient.stkQuery.mockResolvedValue({
        ResponseCode: "0",
        ResponseDescription: "Success",
        ResultCode: "0",
        ResultDesc: "Success",
      });

      await handlers.stkQuery(c);

      expect(mockClient.stkQuery).toHaveBeenCalledWith({
        CheckoutRequestID: "test-456",
      });
    });

    it("should validate CheckoutRequestID", async () => {
      const c = createMockContext({});

      const response = await handlers.stkQuery(c);
      const jsonData = await response.json();

      expect(response.status).toBe(400);
      expect(jsonData).toEqual({
        error: "CheckoutRequestID is required",
      });
    });
  });

  describe("B2C Request Handler", () => {
    it("should handle B2C request", async () => {
      const c = createMockContext({
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        remarks: "Salary",
      });

      mockClient.b2c.mockResolvedValue({
        ConversationID: "test-123",
        OriginatorConversationID: "test-456",
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.b2c(c);

      expect(mockClient.b2c).toHaveBeenCalled();
    });

    it("should validate B2C required fields", async () => {
      const c = createMockContext({ amount: 1000 });

      const response = await handlers.b2c(c);

      expect(response.status).toBe(400);
    });
  });

  describe("B2B Request Handler", () => {
    it("should handle B2B request", async () => {
      const c = createMockContext({
        amount: 5000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        accountReference: "INV-001",
        remarks: "Payment",
      });

      mockClient.b2b.mockResolvedValue({
        ConversationID: "test-123",
        OriginatorConversationID: "test-456",
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.b2b(c);

      expect(mockClient.b2b).toHaveBeenCalled();
    });

    it("should validate B2B required fields", async () => {
      const c = createMockContext({ amount: 5000 });

      const response = await handlers.b2b(c);

      expect(response.status).toBe(400);
    });
  });

  describe("Account Balance Handler", () => {
    it("should handle balance request", async () => {
      const c = createMockContext({
        identifierType: "4",
        remarks: "Balance check",
      });

      mockClient.accountBalance.mockResolvedValue({
        ConversationID: "test-123",
        OriginatorConversationID: "test-456",
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.balance(c);

      expect(mockClient.accountBalance).toHaveBeenCalled();
    });

    it("should handle balance callback", async () => {
      const c = createMockContext(mockBalanceCallback);

      mockClient.handleAccountBalanceCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.balanceResult(c);

      expect(mockClient.handleAccountBalanceCallback).toHaveBeenCalled();
    });

    it("should handle balance timeout", async () => {
      const c = createMockContext({ TransactionID: "test-123" });

      const response = await handlers.balanceTimeout(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });
  });

  describe("Transaction Status Handler", () => {
    it("should handle transaction status request", async () => {
      const c = createMockContext({
        transactionID: "ABC123",
      });

      mockClient.transactionStatus.mockResolvedValue({
        ConversationID: "test-123",
        OriginatorConversationID: "test-456",
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.transactionStatus(c);

      expect(mockClient.transactionStatus).toHaveBeenCalled();
    });

    it("should validate transactionID", async () => {
      const c = createMockContext({});

      const response = await handlers.transactionStatus(c);

      expect(response.status).toBe(400);
    });

    it("should handle status callback", async () => {
      const c = createMockContext(mockTransactionStatusCallback);

      mockClient.handleTransactionStatusCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.statusResult(c);

      expect(mockClient.handleTransactionStatusCallback).toHaveBeenCalled();
    });
  });

  describe("Reversal Handler", () => {
    it("should handle reversal request", async () => {
      const c = createMockContext({
        transactionID: "ABC123",
        amount: 1000,
      });

      mockClient.reversal.mockResolvedValue({
        ConversationID: "test-123",
        OriginatorConversationID: "test-456",
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.reversal(c);

      expect(mockClient.reversal).toHaveBeenCalled();
    });

    it("should validate reversal required fields", async () => {
      const c = createMockContext({ transactionID: "ABC123" });

      const response = await handlers.reversal(c);

      expect(response.status).toBe(400);
    });

    it("should handle reversal callback", async () => {
      const c = createMockContext(mockReversalCallback);

      mockClient.handleReversalCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.reversalResult(c);

      expect(mockClient.handleReversalCallback).toHaveBeenCalled();
    });
  });

  describe("C2B Registration Handler", () => {
    it("should handle C2B URL registration", async () => {
      const c = createMockContext({
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      });

      mockClient.registerC2BUrl.mockResolvedValue({
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.registerC2B(c);

      expect(mockClient.registerC2BUrl).toHaveBeenCalled();
    });

    it("should validate URLs for C2B registration", async () => {
      const c = createMockContext({
        confirmationURL: "https://example.com/confirmation",
      });

      const response = await handlers.registerC2B(c);

      expect(response.status).toBe(400);
    });
  });

  describe("C2B Simulation Handler", () => {
    it("should handle C2B simulation", async () => {
      const c = createMockContext({
        shortCode: "600000",
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
        commandID: "CustomerPayBillOnline",
      });

      mockClient.simulateC2B.mockResolvedValue({
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      await handlers.simulateC2B(c);

      expect(mockClient.simulateC2B).toHaveBeenCalled();
    });

    it("should validate C2B simulation fields", async () => {
      const c = createMockContext({ amount: 1000 });

      const response = await handlers.simulateC2B(c);

      expect(response.status).toBe(400);
    });
  });

  describe("QR Code Generation Handler", () => {
    it("should generate QR code", async () => {
      const c = createMockContext({
        merchantName: "Test Business",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      });

      mockClient.generateDynamicQR.mockResolvedValue({
        ResponseCode: "00",
        ResponseDescription: "Success",
        QRCode: "base64-encoded-qr",
      });

      await handlers.generateQR(c);

      expect(mockClient.generateDynamicQR).toHaveBeenCalled();
    });

    it("should validate QR generation fields", async () => {
      const c = createMockContext({ merchantName: "Test" });

      const response = await handlers.generateQR(c);
      expect(response.status).toBe(400);
    });
    it("should validate QR size parameter", async () => {
      const c = createMockContext({
        merchantName: "Test Business",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: "400",
      });
      const response = await handlers.generateQR(c);
      const jsonData = await response.json();
      expect(response.status).toBe(400);
      expect(jsonData).toEqual({
        error: "Size must be either '300' or '500'",
      });
    });
  });
});
