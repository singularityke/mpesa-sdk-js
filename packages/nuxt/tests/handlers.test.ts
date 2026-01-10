import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMpesaHandlers } from "../src/handlers";
import { MpesaClient } from "@singularity-payments/core";
import type { H3Event } from "h3";
import { readBody, getRequestURL, getRequestHeader, createError } from "h3";
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

// Mock H3 utilities
vi.mock("h3", () => ({
  defineEventHandler: vi.fn((handler) => handler),
  readBody: vi.fn(),
  getRequestURL: vi.fn(),
  getRequestHeader: vi.fn(),
  createError: vi.fn((error) => error),
}));

describe("createMpesaHandlers", () => {
  let mockClient: any;
  let handlers: any;
  let mockEvent: Partial<H3Event>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEvent = {
      node: {
        req: {
          headers: {},
          socket: { remoteAddress: "196.201.214.200" },
        },
        res: {},
      } as any,
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

  describe("STK Callback Handler", () => {
    it("should handle successful STK callback", async () => {
      vi.mocked(readBody).mockResolvedValue(mockSTKCallbackSuccess);
      vi.mocked(getRequestHeader).mockReturnValue(undefined);
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const result = await handlers.stkCallback(mockEvent as H3Event);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockSTKCallbackSuccess,
        undefined,
      );
      expect(result).toEqual({
        ResultCode: 0,
        ResultDesc: "Success",
      });
    });

    it("should handle failed STK callback", async () => {
      vi.mocked(readBody).mockResolvedValue(mockSTKCallbackFailure);
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      const result = await handlers.stkCallback(mockEvent as H3Event);

      expect(mockClient.handleSTKCallback).toHaveBeenCalled();
      expect(result.ResultCode).toBe(0);
    });

    it("should handle errors in STK callback", async () => {
      vi.mocked(readBody).mockResolvedValue(mockSTKCallbackSuccess);
      mockClient.handleSTKCallback.mockRejectedValue(
        new Error("Database error"),
      );

      const result = await handlers.stkCallback(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Internal error processing callback",
      });
    });

    it("should extract IP from x-forwarded-for header", async () => {
      vi.mocked(readBody).mockResolvedValue(mockSTKCallbackSuccess);
      vi.mocked(getRequestHeader).mockImplementation((event, header) => {
        if (header === "x-forwarded-for") return "203.0.113.1";
        return undefined;
      });
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.stkCallback(mockEvent as H3Event);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockSTKCallbackSuccess,
        "203.0.113.1",
      );
    });

    it("should extract IP from x-real-ip header", async () => {
      vi.mocked(readBody).mockResolvedValue(mockSTKCallbackSuccess);
      vi.mocked(getRequestHeader).mockImplementation((event, header) => {
        if (header === "x-real-ip") return "203.0.113.5";
        return undefined;
      });
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.stkCallback(mockEvent as H3Event);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockSTKCallbackSuccess,
        "203.0.113.5",
      );
    });
  });

  describe("C2B Validation Handler", () => {
    it("should handle C2B validation", async () => {
      vi.mocked(readBody).mockResolvedValue(mockC2BCallback);
      mockClient.handleC2BValidation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      const result = await handlers.c2bValidation(mockEvent as H3Event);

      expect(mockClient.handleC2BValidation).toHaveBeenCalledWith(
        mockC2BCallback,
      );
      expect(result.ResultCode).toBe(0);
    });

    it("should handle C2B validation errors", async () => {
      vi.mocked(readBody).mockResolvedValue(mockC2BCallback);
      mockClient.handleC2BValidation.mockRejectedValue(
        new Error("Validation failed"),
      );

      const result = await handlers.c2bValidation(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Validation failed",
      });
    });
  });

  describe("C2B Confirmation Handler", () => {
    it("should handle C2B confirmation", async () => {
      vi.mocked(readBody).mockResolvedValue(mockC2BCallback);
      mockClient.handleC2BConfirmation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const result = await handlers.c2bConfirmation(mockEvent as H3Event);

      expect(mockClient.handleC2BConfirmation).toHaveBeenCalledWith(
        mockC2BCallback,
      );
      expect(result.ResultCode).toBe(0);
    });
  });

  describe("B2C Handlers", () => {
    it("should handle B2C result callback", async () => {
      vi.mocked(readBody).mockResolvedValue(mockB2CCallback);
      mockClient.handleB2CCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const result = await handlers.b2cResult(mockEvent as H3Event);

      expect(mockClient.handleB2CCallback).toHaveBeenCalledWith(
        mockB2CCallback,
      );
      expect(result.ResultCode).toBe(0);
    });

    it("should handle B2C timeout", async () => {
      vi.mocked(readBody).mockResolvedValue({ TransactionID: "test-123" });

      const result = await handlers.b2cTimeout(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });
  });

  describe("CatchAll Handler", () => {
    beforeEach(() => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/stk-push"),
      );
    });

    it("should route to STK push endpoint", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/stk-push"),
      );
      vi.mocked(readBody).mockResolvedValue({
        amount: 1000,
        phoneNumber: "254712345678",
      });
      mockClient.stkPush.mockResolvedValue({
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      const result = await handlers.catchAll(mockEvent as H3Event);

      expect(mockClient.stkPush).toHaveBeenCalled();
      expect(result.ResponseCode).toBe("0");
    });

    it("should validate required fields for STK push", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/stk-push"),
      );
      vi.mocked(readBody).mockResolvedValue({ amount: 1000 });

      await expect(
        handlers.catchAll(mockEvent as H3Event),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Amount and phone number are required",
      });
    });

    it("should handle unknown endpoints", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/unknown-endpoint"),
      );

      await expect(
        handlers.catchAll(mockEvent as H3Event),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
  describe("B2B Handlers", () => {
    it("should handle B2B result callback", async () => {
      vi.mocked(readBody).mockResolvedValue(mockB2BCallback);
      mockClient.handleB2BCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const result = await handlers.b2bResult(mockEvent as H3Event);

      expect(mockClient.handleB2BCallback).toHaveBeenCalledWith(
        mockB2BCallback,
      );
      expect(result.ResultCode).toBe(0);
    });

    it("should handle B2B timeout", async () => {
      vi.mocked(readBody).mockResolvedValue({ TransactionID: "test-123" });

      const result = await handlers.b2bTimeout(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });

    it("should handle B2B errors", async () => {
      vi.mocked(readBody).mockResolvedValue(mockB2BCallback);
      mockClient.handleB2BCallback.mockRejectedValue(
        new Error("Processing error"),
      );

      const result = await handlers.b2bResult(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });

    it("should handle B2B timeout errors", async () => {
      vi.mocked(readBody).mockRejectedValue(new Error("Read error"));

      const result = await handlers.b2bTimeout(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });
  });

  describe("Account Balance Handlers", () => {
    it("should handle balance result callback", async () => {
      vi.mocked(readBody).mockResolvedValue(mockBalanceCallback);
      mockClient.handleAccountBalanceCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const result = await handlers.balanceResult(mockEvent as H3Event);

      expect(mockClient.handleAccountBalanceCallback).toHaveBeenCalledWith(
        mockBalanceCallback,
      );
      expect(result.ResultCode).toBe(0);
    });

    it("should handle balance timeout", async () => {
      vi.mocked(readBody).mockResolvedValue({ TransactionID: "test-123" });

      const result = await handlers.balanceTimeout(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });

    it("should handle balance errors", async () => {
      vi.mocked(readBody).mockResolvedValue(mockBalanceCallback);
      mockClient.handleAccountBalanceCallback.mockRejectedValue(
        new Error("Processing error"),
      );

      const result = await handlers.balanceResult(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });

    it("should handle balance timeout errors", async () => {
      vi.mocked(readBody).mockRejectedValue(new Error("Read error"));

      const result = await handlers.balanceTimeout(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });
  });

  describe("Transaction Status Handlers", () => {
    it("should handle status result callback", async () => {
      vi.mocked(readBody).mockResolvedValue(mockTransactionStatusCallback);
      mockClient.handleTransactionStatusCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const result = await handlers.statusResult(mockEvent as H3Event);

      expect(mockClient.handleTransactionStatusCallback).toHaveBeenCalledWith(
        mockTransactionStatusCallback,
      );
      expect(result.ResultCode).toBe(0);
    });

    it("should handle status timeout", async () => {
      vi.mocked(readBody).mockResolvedValue({ TransactionID: "test-123" });

      const result = await handlers.statusTimeout(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });

    it("should handle status errors", async () => {
      vi.mocked(readBody).mockResolvedValue(mockTransactionStatusCallback);
      mockClient.handleTransactionStatusCallback.mockRejectedValue(
        new Error("Processing error"),
      );

      const result = await handlers.statusResult(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });

    it("should handle status timeout errors", async () => {
      vi.mocked(readBody).mockRejectedValue(new Error("Read error"));

      const result = await handlers.statusTimeout(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });
  });

  describe("Reversal Handlers", () => {
    it("should handle reversal result callback", async () => {
      vi.mocked(readBody).mockResolvedValue(mockReversalCallback);
      mockClient.handleReversalCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const result = await handlers.reversalResult(mockEvent as H3Event);

      expect(mockClient.handleReversalCallback).toHaveBeenCalledWith(
        mockReversalCallback,
      );
      expect(result.ResultCode).toBe(0);
    });

    it("should handle reversal timeout", async () => {
      vi.mocked(readBody).mockResolvedValue({ TransactionID: "test-123" });

      const result = await handlers.reversalTimeout(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });

    it("should handle reversal errors", async () => {
      vi.mocked(readBody).mockResolvedValue(mockReversalCallback);
      mockClient.handleReversalCallback.mockRejectedValue(
        new Error("Processing error"),
      );

      const result = await handlers.reversalResult(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });

    it("should handle reversal timeout errors", async () => {
      vi.mocked(readBody).mockRejectedValue(new Error("Read error"));

      const result = await handlers.reversalTimeout(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });
  });

  describe("C2B Confirmation Error Handling", () => {
    it("should handle C2B confirmation errors", async () => {
      vi.mocked(readBody).mockResolvedValue(mockC2BCallback);
      mockClient.handleC2BConfirmation.mockRejectedValue(
        new Error("Processing failed"),
      );

      const result = await handlers.c2bConfirmation(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });
  });

  describe("B2C Error Handling", () => {
    it("should handle B2C result errors", async () => {
      vi.mocked(readBody).mockResolvedValue(mockB2CCallback);
      mockClient.handleB2CCallback.mockRejectedValue(
        new Error("Processing error"),
      );

      const result = await handlers.b2cResult(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });

    it("should handle B2C timeout errors", async () => {
      vi.mocked(readBody).mockRejectedValue(new Error("Read error"));

      const result = await handlers.b2cTimeout(mockEvent as H3Event);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });
  });

  describe("STK Query Handler", () => {
    it("should handle STK query request", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/stk-query"),
      );
      vi.mocked(readBody).mockResolvedValue({
        CheckoutRequestID: "test-456",
      });
      mockClient.stkQuery.mockResolvedValue({
        ResponseCode: "0",
        ResponseDescription: "Success",
        ResultCode: "0",
        ResultDesc: "Success",
      });

      const result = await handlers.catchAll(mockEvent as H3Event);

      expect(mockClient.stkQuery).toHaveBeenCalledWith({
        CheckoutRequestID: "test-456",
      });
      expect(result.ResponseCode).toBe("0");
    });

    it("should validate CheckoutRequestID", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/stk-query"),
      );
      vi.mocked(readBody).mockResolvedValue({});

      await expect(
        handlers.catchAll(mockEvent as H3Event),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "CheckoutRequestID is required",
      });
    });
  });

  describe("B2C Request via CatchAll", () => {
    it("should handle B2C request with all fields", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/b2c"),
      );
      vi.mocked(readBody).mockResolvedValue({
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        remarks: "Salary payment",
        occasion: "Monthly salary",
        resultUrl: "https://custom.com/result",
        timeoutUrl: "https://custom.com/timeout",
      });
      mockClient.b2c.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll(mockEvent as H3Event);

      expect(mockClient.b2c).toHaveBeenCalledWith({
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        remarks: "Salary payment",
        occasion: "Monthly salary",
        resultUrl: "https://custom.com/result",
        timeoutUrl: "https://custom.com/timeout",
      });
    });

    it("should validate B2C required fields", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/b2c"),
      );
      vi.mocked(readBody).mockResolvedValue({ amount: 1000 });

      await expect(
        handlers.catchAll(mockEvent as H3Event),
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("B2B Request via CatchAll", () => {
    it("should handle B2B request with all fields", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/b2b"),
      );
      vi.mocked(readBody).mockResolvedValue({
        amount: 5000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        senderIdentifierType: "4",
        receiverIdentifierType: "4",
        accountReference: "INV-001",
        remarks: "Payment for goods",
        resultUrl: "https://custom.com/result",
        timeoutUrl: "https://custom.com/timeout",
      });
      mockClient.b2b.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll(mockEvent as H3Event);

      expect(mockClient.b2b).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000,
          partyB: "600000",
          commandID: "BusinessPayBill",
          senderIdentifierType: "4",
          receiverIdentifierType: "4",
        }),
      );
    });

    it("should validate B2B required fields", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/b2b"),
      );
      vi.mocked(readBody).mockResolvedValue({ amount: 5000 });

      await expect(
        handlers.catchAll(mockEvent as H3Event),
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("Balance Request via CatchAll", () => {
    it("should handle balance request", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/balance"),
      );
      vi.mocked(readBody).mockResolvedValue({
        identifierType: "4",
        remarks: "Balance check",
      });
      mockClient.accountBalance.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll(mockEvent as H3Event);

      expect(mockClient.accountBalance).toHaveBeenCalled();
    });
  });

  describe("Transaction Status via CatchAll", () => {
    it("should handle transaction status request", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/transaction-status"),
      );
      vi.mocked(readBody).mockResolvedValue({
        transactionID: "ABC123",
        partyA: "600000",
        identifierType: "4",
      });
      mockClient.transactionStatus.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll(mockEvent as H3Event);

      expect(mockClient.transactionStatus).toHaveBeenCalled();
    });

    it("should validate transactionID", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/transaction-status"),
      );
      vi.mocked(readBody).mockResolvedValue({});

      await expect(
        handlers.catchAll(mockEvent as H3Event),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Transaction ID is required",
      });
    });
  });

  describe("Reversal via CatchAll", () => {
    it("should handle reversal request", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/reversal"),
      );
      vi.mocked(readBody).mockResolvedValue({
        transactionID: "ABC123",
        amount: 1000,
        receiverParty: "600000",
      });
      mockClient.reversal.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll(mockEvent as H3Event);

      expect(mockClient.reversal).toHaveBeenCalled();
    });

    it("should validate reversal required fields", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/reversal"),
      );
      vi.mocked(readBody).mockResolvedValue({ transactionID: "ABC123" });

      await expect(
        handlers.catchAll(mockEvent as H3Event),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Transaction ID and amount are required",
      });
    });
  });

  describe("Register C2B via CatchAll", () => {
    it("should handle C2B URL registration", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/register-c2b"),
      );
      vi.mocked(readBody).mockResolvedValue({
        shortCode: "600000",
        responseType: "Completed",
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      });
      mockClient.registerC2BUrl.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll(mockEvent as H3Event);

      expect(mockClient.registerC2BUrl).toHaveBeenCalled();
    });

    it("should validate URLs for C2B registration", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/register-c2b"),
      );
      vi.mocked(readBody).mockResolvedValue({
        confirmationURL: "https://example.com/confirmation",
      });

      await expect(
        handlers.catchAll(mockEvent as H3Event),
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("Generate QR via CatchAll", () => {
    it("should generate QR code with size 500", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/generate-qr"),
      );
      vi.mocked(readBody).mockResolvedValue({
        merchantName: "Test Business",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: "500",
      });
      mockClient.generateDynamicQR.mockResolvedValue({
        ResponseCode: "00",
      });

      await handlers.catchAll(mockEvent as H3Event);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith(
        expect.objectContaining({ size: "500" }),
      );
    });

    it("should generate QR code without size", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/generate-qr"),
      );
      vi.mocked(readBody).mockResolvedValue({
        merchantName: "Test Business",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      });
      mockClient.generateDynamicQR.mockResolvedValue({
        ResponseCode: "00",
      });

      await handlers.catchAll(mockEvent as H3Event);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith(
        expect.objectContaining({ size: undefined }),
      );
    });

    it("should validate QR required fields", async () => {
      vi.mocked(getRequestURL).mockReturnValue(
        new URL("http://localhost:3000/api/mpesa/generate-qr"),
      );
      vi.mocked(readBody).mockResolvedValue({ merchantName: "Test" });

      await expect(
        handlers.catchAll(mockEvent as H3Event),
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });
});
