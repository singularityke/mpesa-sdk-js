import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMpesaHandlers } from "../src/handlers";
import { Context } from "hono";

describe("Handler Edge Cases and Error Paths", () => {
  let mockClient: any;
  let handlers: any;

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

  describe("STK Callback - Error Scenarios", () => {
    it("should handle errors without message property", async () => {
      const c = createMockContext({
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

      const response = await handlers.stkCallback(c);
      const jsonData = await response.json();

      expect(response.status).toBe(200);
      expect(jsonData).toEqual({
        ResultCode: 1,
        ResultDesc: "Internal error processing callback",
      });
    });

    it("should handle x-real-ip header", async () => {
      const c = createMockContext(
        {
          Body: {
            stkCallback: {
              MerchantRequestID: "123",
              CheckoutRequestID: "456",
              ResultCode: 0,
              ResultDesc: "Success",
            },
          },
        },
        { "x-real-ip": "203.0.113.5" },
      );

      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.stkCallback(c);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        expect.any(Object),
        "203.0.113.5",
      );
    });

    it("should handle array x-forwarded-for header", async () => {
      const headers = { "x-forwarded-for": "203.0.113.1, 203.0.113.2" };
      const c = createMockContext(
        {
          Body: {
            stkCallback: {
              MerchantRequestID: "123",
              CheckoutRequestID: "456",
              ResultCode: 0,
              ResultDesc: "Success",
            },
          },
        },
        headers,
      );

      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.stkCallback(c);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        expect.any(Object),
        "203.0.113.1, 203.0.113.2",
      );
    });
  });

  describe("C2B Validation - Error Paths", () => {
    it("should handle validation errors without message", async () => {
      const c = createMockContext({
        TransactionType: "Pay Bill",
        TransID: "ABC123",
      });

      mockClient.handleC2BValidation.mockRejectedValue(new Error());

      const response = await handlers.c2bValidation(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 1,
        ResultDesc: "Validation failed",
      });
    });
  });

  describe("C2B Confirmation - Error Paths", () => {
    it("should handle confirmation errors", async () => {
      const c = createMockContext({
        TransactionType: "Pay Bill",
        TransID: "ABC123",
      });

      mockClient.handleC2BConfirmation.mockRejectedValue(new Error("DB error"));

      const response = await handlers.c2bConfirmation(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
    });
  });

  describe("STK Push - Error Paths", () => {
    it("should handle STK push with only amount (missing phoneNumber)", async () => {
      const c = createMockContext({ amount: 1000 });

      const response = await handlers.stkPush(c);

      expect(response.status).toBe(400);
    });

    it("should handle STK push with only phoneNumber (missing amount)", async () => {
      const c = createMockContext({ phoneNumber: "254712345678" });

      const response = await handlers.stkPush(c);

      expect(response.status).toBe(400);
    });

    it("should handle STK push with custom callbackUrl", async () => {
      const c = createMockContext({
        amount: 1000,
        phoneNumber: "254712345678",
        callbackUrl: "https://custom.com/callback",
      });

      mockClient.stkPush.mockResolvedValue({ ResponseCode: "0" });

      await handlers.stkPush(c);

      expect(mockClient.stkPush).toHaveBeenCalledWith(
        expect.objectContaining({
          callbackUrl: "https://custom.com/callback",
        }),
      );
    });

    it("should handle STK push errors without message", async () => {
      const c = createMockContext({
        amount: 1000,
        phoneNumber: "254712345678",
      });

      mockClient.stkPush.mockRejectedValue({});

      const response = await handlers.stkPush(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({ error: "Request failed" });
    });
  });

  describe("STK Query - Error Paths", () => {
    it("should handle STK query errors without message", async () => {
      const c = createMockContext({ CheckoutRequestID: "test-123" });

      mockClient.stkQuery.mockRejectedValue({});

      const response = await handlers.stkQuery(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({ error: "Request failed" });
    });
  });

  describe("B2C Request - Error Paths", () => {
    it("should handle B2C with custom URLs", async () => {
      const c = createMockContext({
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        resultUrl: "https://custom.com/result",
        timeoutUrl: "https://custom.com/timeout",
      });

      mockClient.b2c.mockResolvedValue({ ResponseCode: "0" });

      await handlers.b2c(c);

      expect(mockClient.b2c).toHaveBeenCalledWith(
        expect.objectContaining({
          resultUrl: "https://custom.com/result",
          timeoutUrl: "https://custom.com/timeout",
        }),
      );
    });

    it("should handle B2C with occasion", async () => {
      const c = createMockContext({
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        occasion: "Salary Payment",
      });

      mockClient.b2c.mockResolvedValue({ ResponseCode: "0" });

      await handlers.b2c(c);

      expect(mockClient.b2c).toHaveBeenCalledWith(
        expect.objectContaining({
          occasion: "Salary Payment",
        }),
      );
    });

    it("should handle B2C errors without message", async () => {
      const c = createMockContext({
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
      });

      mockClient.b2c.mockRejectedValue({});

      const response = await handlers.b2c(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({ error: "Request failed" });
    });
  });

  describe("B2B Request - Error Paths", () => {
    it("should handle B2B with custom URLs", async () => {
      const c = createMockContext({
        amount: 5000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        accountReference: "INV-001",
        resultUrl: "https://custom.com/result",
        timeoutUrl: "https://custom.com/timeout",
      });

      mockClient.b2b.mockResolvedValue({ ResponseCode: "0" });

      await handlers.b2b(c);

      expect(mockClient.b2b).toHaveBeenCalledWith(
        expect.objectContaining({
          resultUrl: "https://custom.com/result",
          timeoutUrl: "https://custom.com/timeout",
        }),
      );
    });

    it("should handle B2B with identifier types", async () => {
      const c = createMockContext({
        amount: 5000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        accountReference: "INV-001",
        senderIdentifierType: "4",
        receiverIdentifierType: "4",
      });

      mockClient.b2b.mockResolvedValue({ ResponseCode: "0" });

      await handlers.b2b(c);

      expect(mockClient.b2b).toHaveBeenCalledWith(
        expect.objectContaining({
          senderIdentifierType: "4",
          receiverIdentifierType: "4",
        }),
      );
    });

    it("should handle B2B errors without message", async () => {
      const c = createMockContext({
        amount: 5000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        accountReference: "INV-001",
      });

      mockClient.b2b.mockRejectedValue({});

      const response = await handlers.b2b(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({ error: "Request failed" });
    });
  });

  describe("C2B Registration - Error Paths", () => {
    it("should handle C2B registration with shortCode and responseType", async () => {
      const c = createMockContext({
        shortCode: "600000",
        responseType: "Completed",
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      });

      mockClient.registerC2BUrl.mockResolvedValue({ ResponseCode: "0" });

      await handlers.registerC2B(c);

      expect(mockClient.registerC2BUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          shortCode: "600000",
          responseType: "Completed",
        }),
      );
    });

    it("should handle C2B registration errors without message", async () => {
      const c = createMockContext({
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      });

      mockClient.registerC2BUrl.mockRejectedValue({});

      const response = await handlers.registerC2B(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({ error: "Request failed" });
    });
  });

  describe("C2B Simulation - Error Paths", () => {
    it("should handle C2B simulation with all fields", async () => {
      const c = createMockContext({
        shortCode: "600000",
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
        commandID: "CustomerPayBillOnline",
      });

      mockClient.simulateC2B.mockResolvedValue({ ResponseCode: "0" });

      await handlers.simulateC2B(c);

      expect(mockClient.simulateC2B).toHaveBeenCalledWith({
        shortCode: "600000",
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
        commandID: "CustomerPayBillOnline",
      });
    });

    it("should handle C2B simulation errors without message", async () => {
      const c = createMockContext({
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
      });

      mockClient.simulateC2B.mockRejectedValue({});

      const response = await handlers.simulateC2B(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({ error: "Request failed" });
    });
  });

  describe("QR Code Generation - Error Paths", () => {
    it("should handle QR generation with size 300", async () => {
      const c = createMockContext({
        merchantName: "Test",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: "300",
      });

      mockClient.generateDynamicQR.mockResolvedValue({ ResponseCode: "00" });

      await handlers.generateQR(c);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith(
        expect.objectContaining({ size: "300" }),
      );
    });

    it("should handle QR generation with size 500", async () => {
      const c = createMockContext({
        merchantName: "Test",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
        size: "500",
      });

      mockClient.generateDynamicQR.mockResolvedValue({ ResponseCode: "00" });

      await handlers.generateQR(c);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith(
        expect.objectContaining({ size: "500" }),
      );
    });

    it("should handle QR generation without size", async () => {
      const c = createMockContext({
        merchantName: "Test",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      });

      mockClient.generateDynamicQR.mockResolvedValue({ ResponseCode: "00" });

      await handlers.generateQR(c);

      expect(mockClient.generateDynamicQR).toHaveBeenCalledWith(
        expect.objectContaining({ size: undefined }),
      );
    });

    it("should handle QR generation errors without message", async () => {
      const c = createMockContext({
        merchantName: "Test",
        refNo: "INV-001",
        amount: 1000,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      });

      mockClient.generateDynamicQR.mockRejectedValue({});

      const response = await handlers.generateQR(c);
      const jsonData = await response.json();

      expect(jsonData).toEqual({ error: "Request failed" });
    });
  });
});
