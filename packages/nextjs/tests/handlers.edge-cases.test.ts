import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMpesaHandlers } from "../src/handlers";
import { NextRequest } from "next/server";

describe("CatchAll Handler", () => {
  let mockClient: any;
  let handlers: any;

  const createMockRequest = (
    path: string,
    body: any = {},
    headers: Record<string, string> = {},
  ) => {
    return {
      json: vi.fn().mockResolvedValue(body),
      headers: new Headers(headers),
      nextUrl: {
        pathname: path,
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

  describe("Webhook Routes", () => {
    it("should handle STK callback route", async () => {
      const request = createMockRequest("/api/mpesa/callback", {
        Body: {
          stkCallback: {
            MerchantRequestID: "123",
            CheckoutRequestID: "456",
            ResultCode: 0,
            ResultDesc: "Success",
          },
        },
      });

      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.catchAll.POST(request);

      expect(response.status).toBe(200);
      expect(mockClient.handleSTKCallback).toHaveBeenCalled();
    });

    it("should handle stk-callback route", async () => {
      const request = createMockRequest("/api/mpesa/stk-callback", {
        Body: { stkCallback: {} },
      });

      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.handleSTKCallback).toHaveBeenCalled();
    });

    it("should handle validation route", async () => {
      const request = createMockRequest("/api/mpesa/validation", {});

      mockClient.handleC2BValidation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.handleC2BValidation).toHaveBeenCalled();
    });

    it("should handle c2b-validation route", async () => {
      const request = createMockRequest("/api/mpesa/c2b-validation", {});

      mockClient.handleC2BValidation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
      await handlers.catchAll.POST(request);

      expect(mockClient.handleC2BValidation).toHaveBeenCalled();
    });

    it("should handle confirmation route", async () => {
      const request = createMockRequest("/api/mpesa/confirmation", {});

      mockClient.handleC2BConfirmation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.handleC2BConfirmation).toHaveBeenCalled();
    });

    it("should handle b2c-result route", async () => {
      const request = createMockRequest("/api/mpesa/b2c-result", {
        Result: {},
      });

      const response = await handlers.catchAll.POST(request);

      expect(response.status).toBe(200);
    });

    it("should handle b2c-timeout route", async () => {
      const request = createMockRequest("/api/mpesa/b2c-timeout", {});

      const response = await handlers.catchAll.POST(request);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 0,
        ResultDesc: "Timeout received",
      });
    });

    it("should handle b2b-result route", async () => {
      const request = createMockRequest("/api/mpesa/b2b-result", {
        Result: {},
      });

      mockClient.handleB2BCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.handleB2BCallback).toHaveBeenCalled();
    });

    it("should handle balance-result route", async () => {
      const request = createMockRequest("/api/mpesa/balance-result", {
        Result: {},
      });

      mockClient.handleAccountBalanceCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.handleAccountBalanceCallback).toHaveBeenCalled();
    });

    it("should handle status-result route", async () => {
      const request = createMockRequest("/api/mpesa/status-result", {
        Result: {},
      });

      mockClient.handleTransactionStatusCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.handleTransactionStatusCallback).toHaveBeenCalled();
    });

    it("should handle reversal-result route", async () => {
      const request = createMockRequest("/api/mpesa/reversal-result", {
        Result: {},
      });

      mockClient.handleReversalCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.handleReversalCallback).toHaveBeenCalled();
    });
  });
  describe("Client API Routes", () => {
    it("should handle stk-push route", async () => {
      const request = createMockRequest("/api/mpesa/stk-push", {
        amount: 1000,
        phoneNumber: "254712345678",
      });
      mockClient.stkPush.mockResolvedValue({
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      const response = await handlers.catchAll.POST(request);

      expect(mockClient.stkPush).toHaveBeenCalledWith({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "Payment",
        transactionDesc: "Payment",
        callbackUrl: undefined,
      });
      expect(response.status).toBe(200);
    });

    it("should validate stk-push required fields", async () => {
      const request = createMockRequest("/api/mpesa/stk-push", {
        amount: 1000,
      });

      const response = await handlers.catchAll.POST(request);
      const jsonData = await response.json();

      expect(response.status).toBe(400);
      expect(jsonData).toEqual({
        error: "Amount and phone number are required",
      });
    });

    it("should handle stk-query route", async () => {
      const request = createMockRequest("/api/mpesa/stk-query", {
        CheckoutRequestID: "test-123",
      });

      mockClient.stkQuery.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.stkQuery).toHaveBeenCalledWith({
        CheckoutRequestID: "test-123",
      });
    });

    it("should validate stk-query required fields", async () => {
      const request = createMockRequest("/api/mpesa/stk-query", {});

      const response = await handlers.catchAll.POST(request);

      expect(response.status).toBe(400);
    });

    it("should handle b2c route", async () => {
      const request = createMockRequest("/api/mpesa/b2c", {
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
      });

      mockClient.b2c.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.b2c).toHaveBeenCalled();
    });

    it("should validate b2c required fields", async () => {
      const request = createMockRequest("/api/mpesa/b2c", {
        amount: 1000,
      });

      const response = await handlers.catchAll.POST(request);

      expect(response.status).toBe(400);
    });

    it("should handle b2b route", async () => {
      const request = createMockRequest("/api/mpesa/b2b", {
        amount: 5000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        accountReference: "INV-001",
      });

      mockClient.b2b.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.b2b).toHaveBeenCalled();
    });

    it("should validate b2b required fields", async () => {
      const request = createMockRequest("/api/mpesa/b2b", {
        amount: 5000,
      });

      const response = await handlers.catchAll.POST(request);

      expect(response.status).toBe(400);
    });

    it("should handle balance route", async () => {
      const request = createMockRequest("/api/mpesa/balance", {
        identifierType: "4",
      });

      mockClient.accountBalance.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.accountBalance).toHaveBeenCalled();
    });

    it("should handle transaction-status route", async () => {
      const request = createMockRequest("/api/mpesa/transaction-status", {
        transactionID: "ABC123",
      });

      mockClient.transactionStatus.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.transactionStatus).toHaveBeenCalled();
    });

    it("should validate transaction-status required fields", async () => {
      const request = createMockRequest("/api/mpesa/transaction-status", {});

      const response = await handlers.catchAll.POST(request);

      expect(response.status).toBe(400);
    });

    it("should handle reversal route", async () => {
      const request = createMockRequest("/api/mpesa/reversal", {
        transactionID: "ABC123",
        amount: 1000,
      });

      mockClient.reversal.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.reversal).toHaveBeenCalled();
    });

    it("should validate reversal required fields", async () => {
      const request = createMockRequest("/api/mpesa/reversal", {
        transactionID: "ABC123",
      });

      const response = await handlers.catchAll.POST(request);

      expect(response.status).toBe(400);
    });

    it("should handle register-c2b route", async () => {
      const request = createMockRequest("/api/mpesa/register-c2b", {
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      });

      mockClient.registerC2BUrl.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.registerC2BUrl).toHaveBeenCalled();
    });

    it("should validate register-c2b required fields", async () => {
      const request = createMockRequest("/api/mpesa/register-c2b", {
        confirmationURL: "https://example.com/confirmation",
      });

      const response = await handlers.catchAll.POST(request);

      expect(response.status).toBe(400);
    });

    it("should handle generate-qr route", async () => {
      const request = createMockRequest("/api/mpesa/generate-qr", {
        merchantName: "Test",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      });

      mockClient.generateDynamicQR.mockResolvedValue({
        ResponseCode: "00",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.generateDynamicQR).toHaveBeenCalled();
    });

    it("should validate generate-qr size parameter", async () => {
      const request = createMockRequest("/api/mpesa/generate-qr", {
        merchantName: "Test",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: "400",
      });

      const response = await handlers.catchAll.POST(request);
      const jsonData = await response.json();

      expect(response.status).toBe(400);
      expect(jsonData).toEqual({
        error: "Size must be either '300' or '500'",
      });
    });

    it("should handle simulate-c2b route", async () => {
      const request = createMockRequest("/api/mpesa/simulate-c2b", {
        shortCode: "600000",
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
      });

      mockClient.simulateC2B.mockResolvedValue({
        ResponseCode: "0",
      });

      await handlers.catchAll.POST(request);

      expect(mockClient.simulateC2B).toHaveBeenCalled();
    });

    it("should return 404 for unknown routes", async () => {
      const request = createMockRequest("/api/mpesa/unknown-route", {});

      const response = await handlers.catchAll.POST(request);
      const jsonData = await response.json();

      expect(response.status).toBe(404);
      expect(jsonData.ResultDesc).toContain("Unknown endpoint");
    });

    it("should handle errors in catchAll", async () => {
      const request = createMockRequest("/api/mpesa/stk-push", {
        amount: 1000,
        phoneNumber: "254712345678",
      });

      mockClient.stkPush.mockRejectedValue(new Error("API Error"));

      const response = await handlers.catchAll.POST(request);
      const jsonData = await response.json();

      expect(response.status).toBe(500);
      expect(jsonData).toEqual({ error: "API Error" });
    });
  });
});
