import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMpesaHandlers } from "../src/handlers";
import { NextRequest } from "next/server";
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

  // Helper function to create mock NextRequest
  const createMockRequest = (
    body: any = {},
    headers: Record<string, string> = {},
  ) => {
    return {
      json: vi.fn().mockResolvedValue(body),
      headers: new Headers(headers),
      nextUrl: {
        pathname: "/api/mpesa/test",
      },
    } as unknown as NextRequest;
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
      getCallbackHandler: vi.fn(() => ({
        parseB2CCallback: vi.fn((data) => data),
      })),
    };

    handlers = createMpesaHandlers(mockClient);
  });

  describe("STK Callback Handler", () => {
    it("should handle successful STK callback", async () => {
      const request = createMockRequest(mockSTKCallbackSuccess, {
        "x-forwarded-for": "196.201.214.200",
      });

      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.stkCallback.POST(request);
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
      const request = createMockRequest(mockSTKCallbackFailure);

      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      const response = await handlers.stkCallback.POST(request);

      expect(mockClient.handleSTKCallback).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle errors in STK callback", async () => {
      const request = createMockRequest(mockSTKCallbackSuccess);

      mockClient.handleSTKCallback.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await handlers.stkCallback.POST(request);
      const jsonData = await response.json();

      expect(response.status).toBe(200);
      expect(jsonData).toEqual({
        ResultCode: 1,
        ResultDesc: "Internal error processing callback",
      });
    });

    it("should extract IP from x-forwarded-for header", async () => {
      const request = createMockRequest(mockSTKCallbackSuccess, {
        "x-forwarded-for": "203.0.113.1",
      });

      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.stkCallback.POST(request);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockSTKCallbackSuccess,
        "203.0.113.1",
      );
    });
  });

  describe("C2B Validation Handler", () => {
    it("should handle C2B validation", async () => {
      const request = createMockRequest(mockC2BCallback);

      mockClient.handleC2BValidation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      const response = await handlers.c2bValidation.POST(request);

      expect(mockClient.handleC2BValidation).toHaveBeenCalledWith(
        mockC2BCallback,
      );
      expect(response.status).toBe(200);
    });

    it("should handle C2B validation errors", async () => {
      const request = createMockRequest(mockC2BCallback);

      mockClient.handleC2BValidation.mockRejectedValue(
        new Error("Validation failed"),
      );

      const response = await handlers.c2bValidation.POST(request);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 1,
        ResultDesc: "Validation failed",
      });
    });
  });

  describe("C2B Confirmation Handler", () => {
    it("should handle C2B confirmation", async () => {
      const request = createMockRequest(mockC2BCallback);

      mockClient.handleC2BConfirmation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.c2bConfirmation.POST(request);

      expect(mockClient.handleC2BConfirmation).toHaveBeenCalledWith(
        mockC2BCallback,
      );
      expect(response.status).toBe(200);
    });
  });

  describe("B2C Handlers", () => {
    it("should handle B2C result callback", async () => {
      const request = createMockRequest(mockB2CCallback);

      const response = await handlers.b2cResult.POST(request);

      expect(mockClient.getCallbackHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle B2C timeout", async () => {
      const request = createMockRequest({ TransactionID: "test-123" });

      const response = await handlers.b2cTimeout.POST(request);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });

    it("should handle B2C errors", async () => {
      const request = createMockRequest(mockB2CCallback);

      mockClient.getCallbackHandler.mockImplementation(() => {
        throw new Error("Processing error");
      });

      const response = await handlers.b2cResult.POST(request);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });
  });

  describe("B2B Handlers", () => {
    it("should handle B2B result callback", async () => {
      const request = createMockRequest(mockB2BCallback);

      mockClient.handleB2BCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.b2bResult.POST(request);

      expect(mockClient.handleB2BCallback).toHaveBeenCalledWith(
        mockB2BCallback,
      );
      expect(response.status).toBe(200);
    });

    it("should handle B2B timeout", async () => {
      const request = createMockRequest({ TransactionID: "test-123" });

      const response = await handlers.b2bTimeout.POST(request);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });
  });

  describe("Account Balance Handler", () => {
    it("should handle balance callback", async () => {
      const request = createMockRequest(mockBalanceCallback);

      mockClient.handleAccountBalanceCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.balanceResult.POST(request);

      expect(mockClient.handleAccountBalanceCallback).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle balance timeout", async () => {
      const request = createMockRequest({ TransactionID: "test-123" });

      const response = await handlers.balanceTimeout.POST(request);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });
  });

  describe("Transaction Status Handler", () => {
    it("should handle status callback", async () => {
      const request = createMockRequest(mockTransactionStatusCallback);

      mockClient.handleTransactionStatusCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.transactionStatusResult.POST(request);

      expect(mockClient.handleTransactionStatusCallback).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle status timeout", async () => {
      const request = createMockRequest({ TransactionID: "test-123" });

      const response = await handlers.transactionStatusTimeout.POST(request);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });
  });

  describe("Reversal Handler", () => {
    it("should handle reversal callback", async () => {
      const request = createMockRequest(mockReversalCallback);

      mockClient.handleReversalCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.reversalResult.POST(request);

      expect(mockClient.handleReversalCallback).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle reversal timeout", async () => {
      const request = createMockRequest({ TransactionID: "test-123" });

      const response = await handlers.reversalTimeout.POST(request);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });
  });

  describe("C2B Simulation Handler", () => {
    it("should handle C2B simulation", async () => {
      const request = createMockRequest({
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

      const response = await handlers.simulateC2B.POST(request);

      expect(mockClient.simulateC2B).toHaveBeenCalled();
    });

    it("should validate C2B simulation fields", async () => {
      const request = createMockRequest({ amount: 1000 });

      const response = await handlers.simulateC2B.POST(request);

      expect(response.status).toBe(400);
    });
  });
});
