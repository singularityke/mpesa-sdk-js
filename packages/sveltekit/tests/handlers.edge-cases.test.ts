import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMpesaHandlers } from "../src/handlers";
import type { RequestEvent } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

// Mock @sveltejs/kit
vi.mock("@sveltejs/kit", () => ({
  json: vi.fn((data, init) => {
    return new Response(JSON.stringify(data), {
      status: init?.status || 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
}));

describe("Handler Edge Cases and Error Paths", () => {
  let mockClient: any;
  let handlers: any;
  let mockEvent: Partial<RequestEvent>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEvent = {
      request: {
        json: vi.fn(),
        headers: new Headers(),
      } as any,
      url: new URL("http://localhost:5173/api/mpesa/callback"),
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
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        Body: {
          stkCallback: {
            MerchantRequestID: "123",
            CheckoutRequestID: "456",
            ResultCode: 0,
            ResultDesc: "Success",
          },
        },
      });
      mockClient.handleSTKCallback.mockRejectedValue({ code: "ERR_NETWORK" });

      const response = await handlers.stkCallback.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data).toEqual({
        ResultCode: 1,
        ResultDesc: "Internal error processing callback",
      });
    });
  });

  describe("CatchAll - STK Push", () => {
    it("should handle STK push with all optional fields", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/stk-push");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "INV-001",
        transactionDesc: "Payment for invoice",
        callbackUrl: "https://custom.com/callback",
      });
      mockClient.stkPush.mockResolvedValue({
        ResponseCode: "0",
        ResponseDescription: "Success",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(mockClient.stkPush).toHaveBeenCalledWith({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "INV-001",
        transactionDesc: "Payment for invoice",
        callbackUrl: "https://custom.com/callback",
      });
      expect(data.ResponseCode).toBe("0");
    });

    it("should validate required fields for STK push", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/stk-push");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({ amount: 1000 });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Amount and phone number are required");
    });
  });

  describe("CatchAll - STK Query", () => {
    it("should handle STK query request", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/stk-query");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        CheckoutRequestID: "test-456",
      });
      mockClient.stkQuery.mockResolvedValue({
        ResponseCode: "0",
        ResponseDescription: "Success",
        ResultCode: "0",
        ResultDesc: "Success",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(mockClient.stkQuery).toHaveBeenCalledWith({
        CheckoutRequestID: "test-456",
      });
      expect(data.ResponseCode).toBe("0");
    });

    it("should validate CheckoutRequestID", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/stk-query");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({});

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("CheckoutRequestID is required");
    });
  });

  describe("CatchAll - C2B Simulation", () => {
    it("should handle C2B simulation with all fields", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/simulate-c2b");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        shortCode: "600000",
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
        commandID: "CustomerPayBillOnline",
      });
      mockClient.simulateC2B.mockResolvedValue({ ResponseCode: "0" });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(mockClient.simulateC2B).toHaveBeenCalledWith({
        shortCode: "600000",
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
        commandID: "CustomerPayBillOnline",
      });
      expect(data.ResponseCode).toBe("0");
    });

    it("should validate C2B simulation required fields", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/simulate-c2b");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        amount: 1000,
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });
  });

  describe("CatchAll - B2C", () => {
    it("should handle B2C with custom URLs", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/b2c");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        remarks: "Salary payment",
        occasion: "Monthly salary",
        resultUrl: "https://custom.com/result",
        timeoutUrl: "https://custom.com/timeout",
      });
      mockClient.b2c.mockResolvedValue({ ResponseCode: "0" });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

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
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/b2c");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({ amount: 1000 });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });
  });

  describe("CatchAll - B2B", () => {
    it("should handle B2B with all fields", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/b2b");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
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
      mockClient.b2b.mockResolvedValue({ ResponseCode: "0" });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

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
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/b2b");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({ amount: 5000 });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });
  });

  describe("CatchAll - Balance", () => {
    it("should handle balance request", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/balance");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        identifierType: "4",
        remarks: "Balance check",
      });
      mockClient.accountBalance.mockResolvedValue({
        ResponseCode: "0",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.accountBalance).toHaveBeenCalled();
    });
  });

  describe("CatchAll - Transaction Status", () => {
    it("should handle transaction status request", async () => {
      mockEvent.url = new URL(
        "http://localhost:5173/api/mpesa/transaction-status",
      );
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        transactionID: "ABC123",
        partyA: "600000",
        identifierType: "4",
      });
      mockClient.transactionStatus.mockResolvedValue({
        ResponseCode: "0",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.transactionStatus).toHaveBeenCalled();
    });

    it("should validate transactionID", async () => {
      mockEvent.url = new URL(
        "http://localhost:5173/api/mpesa/transaction-status",
      );
      vi.mocked(mockEvent.request!.json).mockResolvedValue({});

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Transaction ID is required");
    });
  });

  describe("CatchAll - Reversal", () => {
    it("should handle reversal request", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/reversal");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        transactionID: "ABC123",
        amount: 1000,
        receiverParty: "600000",
      });
      mockClient.reversal.mockResolvedValue({
        ResponseCode: "0",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.reversal).toHaveBeenCalled();
    });

    it("should validate reversal required fields", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/reversal");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        transactionID: "ABC123",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Transaction ID and amount are required");
    });
  });

  describe("CatchAll - Register C2B", () => {
    it("should handle C2B URL registration", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/register-c2b");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        shortCode: "600000",
        responseType: "Completed",
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      });
      mockClient.registerC2BUrl.mockResolvedValue({
        ResponseCode: "0",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.registerC2BUrl).toHaveBeenCalled();
    });

    it("should validate URLs for C2B registration", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/register-c2b");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        confirmationURL: "https://example.com/confirmation",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });
  });

  describe("CatchAll - Generate QR", () => {
    it("should generate QR code with size 300", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/generate-qr");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        merchantName: "Test Business",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: "300",
      });
      mockClient.generateDynamicQR.mockResolvedValue({
        ResponseCode: "00",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith(
        expect.objectContaining({ size: "300" }),
      );
    });

    it("should generate QR code with size 500", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/generate-qr");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
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

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith(
        expect.objectContaining({ size: "500" }),
      );
    });

    it("should generate QR code without size", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/generate-qr");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        merchantName: "Test Business",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      });
      mockClient.generateDynamicQR.mockResolvedValue({
        ResponseCode: "00",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith(
        expect.objectContaining({ size: undefined }),
      );
    });

    it("should handle invalid QR size", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/generate-qr");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        merchantName: "Test",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: "400",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Size must be either '300' or '500'");
    });

    it("should validate QR required fields", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/generate-qr");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        merchantName: "Test",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });
  });

  describe("CatchAll - Webhook Routes", () => {
    it("should handle callback endpoint", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/callback");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
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

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(mockClient.handleSTKCallback).toHaveBeenCalled();
      expect(data.ResultCode).toBe(0);
    });

    it("should handle stk-callback endpoint", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/stk-callback");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
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

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.handleSTKCallback).toHaveBeenCalled();
    });

    it("should handle validation endpoint", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/validation");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionType: "Pay Bill",
        TransID: "ABC123",
      });
      mockClient.handleC2BValidation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.handleC2BValidation).toHaveBeenCalled();
    });

    it("should handle c2b-validation endpoint", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/c2b-validation");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionType: "Pay Bill",
        TransID: "ABC123",
      });
      mockClient.handleC2BValidation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.handleC2BValidation).toHaveBeenCalled();
    });

    it("should handle confirmation endpoint", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/confirmation");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionType: "Pay Bill",
        TransID: "ABC123",
      });
      mockClient.handleC2BConfirmation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.handleC2BConfirmation).toHaveBeenCalled();
    });

    it("should handle c2b-confirmation endpoint", async () => {
      mockEvent.url = new URL(
        "http://localhost:5173/api/mpesa/c2b-confirmation",
      );
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionType: "Pay Bill",
        TransID: "ABC123",
      });
      mockClient.handleC2BConfirmation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.handleC2BConfirmation).toHaveBeenCalled();
    });

    it("should handle b2c-result endpoint", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/b2c-result");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        Result: { ResultCode: 0 },
      });
      mockClient.handleB2CCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.handleB2CCallback).toHaveBeenCalled();
    });

    it("should handle b2c-timeout endpoint", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/b2c-timeout");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionID: "test-123",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(data.ResultDesc).toBe("Timeout received");
    });

    it("should handle b2b-result endpoint", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/b2b-result");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        Result: { ResultCode: 0 },
      });
      mockClient.handleB2BCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.handleB2BCallback).toHaveBeenCalled();
    });

    it("should handle b2b-timeout endpoint", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/b2b-timeout");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionID: "test-123",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(data.ResultDesc).toBe("Timeout received");
    });

    it("should handle balance-result endpoint", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/balance-result");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        Result: { ResultCode: 0 },
      });
      mockClient.handleAccountBalanceCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.handleAccountBalanceCallback).toHaveBeenCalled();
    });

    it("should handle balance-timeout endpoint", async () => {
      mockEvent.url = new URL(
        "http://localhost:5173/api/mpesa/balance-timeout",
      );
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionID: "test-123",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(data.ResultDesc).toBe("Timeout received");
    });

    it("should handle status-result endpoint", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/status-result");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        Result: { ResultCode: 0 },
      });
      mockClient.handleTransactionStatusCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.handleTransactionStatusCallback).toHaveBeenCalled();
    });

    it("should handle status-timeout endpoint", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/status-timeout");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionID: "test-123",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(data.ResultDesc).toBe("Timeout received");
    });

    it("should handle reversal-result endpoint", async () => {
      mockEvent.url = new URL(
        "http://localhost:5173/api/mpesa/reversal-result",
      );
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        Result: { ResultCode: 0 },
      });
      mockClient.handleReversalCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);

      expect(mockClient.handleReversalCallback).toHaveBeenCalled();
    });

    it("should handle reversal-timeout endpoint", async () => {
      mockEvent.url = new URL(
        "http://localhost:5173/api/mpesa/reversal-timeout",
      );
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionID: "test-123",
      });

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(data.ResultDesc).toBe("Timeout received");
    });
  });

  describe("CatchAll - Unknown Endpoint", () => {
    it("should handle unknown endpoints", async () => {
      mockEvent.url = new URL(
        "http://localhost:5173/api/mpesa/unknown-endpoint",
      );
      vi.mocked(mockEvent.request!.json).mockResolvedValue({});

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.ResultDesc).toContain("Unknown endpoint");
    });
  });

  describe("CatchAll - Error Handling", () => {
    it("should handle generic errors", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/stk-push");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        amount: 1000,
        phoneNumber: "254712345678",
      });
      mockClient.stkPush.mockRejectedValue(new Error("Network error"));

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Network error");
    });

    it("should handle errors without message", async () => {
      mockEvent.url = new URL("http://localhost:5173/api/mpesa/stk-push");
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        amount: 1000,
        phoneNumber: "254712345678",
      });
      mockClient.stkPush.mockRejectedValue({});

      const response = await handlers.catchAll.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Request failed");
    });
  });
});
