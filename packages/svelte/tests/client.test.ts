import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MpesaSvelteClient } from "../src/client";
import {
  mockSTKPushResponse,
  mockSTKQueryResponse,
  mockC2BSimulateResponse,
  mockB2CResponse,
  mockB2BResponse,
  mockAccountBalanceResponse,
  mockTransactionStatusResponse,
  mockReversalResponse,
  mockC2BRegisterResponse,
  mockDynamicQRResponse,
  mockErrorResponse,
  mockNetworkError,
} from "./mockData";

const createMockResponse = (data: any, ok = true): Response => {
  return {
    ok,
    status: ok ? 200 : 400,
    statusText: ok ? "OK" : "Bad Request",
    headers: new Headers(),
    redirected: false,
    type: "basic",
    url: "",
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn(),
  } as unknown as Response;
};

describe("MpesaSvelteClient", () => {
  let client: MpesaSvelteClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new MpesaSvelteClient({
      baseUrl: "https://api.example.com",
      fetcher: mockFetch as typeof fetch,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with default config", () => {
      const defaultClient = new MpesaSvelteClient();
      expect(defaultClient).toBeInstanceOf(MpesaSvelteClient);
    });

    it("should initialize with custom baseUrl", () => {
      const customClient = new MpesaSvelteClient({
        baseUrl: "https://custom.api.com",
      });
      expect(customClient).toBeInstanceOf(MpesaSvelteClient);
    });

    it("should strip trailing slash from baseUrl", async () => {
      const clientWithSlash = new MpesaSvelteClient({
        baseUrl: "https://api.example.com/",
        fetcher: mockFetch as typeof fetch,
      });

      mockFetch.mockResolvedValue(createMockResponse(mockSTKPushResponse));

      await clientWithSlash.stkPush({
        amount: 100,
        phoneNumber: "254712345678",
        accountReference: "TEST",
        transactionDesc: "Test",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/mpesa/stk-push",
        expect.any(Object),
      );
    });

    it("should use custom fetcher if provided", async () => {
      const customFetcher = vi.fn();

      customFetcher.mockResolvedValue(createMockResponse(mockSTKPushResponse));

      const customClient = new MpesaSvelteClient({
        fetcher: customFetcher as typeof fetch,
      });

      await customClient.stkPush({
        amount: 100,
        phoneNumber: "254712345678",
        accountReference: "TEST",
        transactionDesc: "Test",
      });

      expect(customFetcher).toHaveBeenCalled();
    });
  });

  describe("STK Push", () => {
    it("should successfully initiate STK push", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockSTKPushResponse));

      const result = await client.stkPush({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "INV-001",
        transactionDesc: "Payment for order",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/mpesa/stk-push",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: 1000,
            phoneNumber: "254712345678",
            accountReference: "INV-001",
            transactionDesc: "Payment for order",
          }),
        },
      );

      expect(result.data).toEqual(mockSTKPushResponse);
      expect(result.error).toBeUndefined();
    });

    it("should handle STK push with minimal fields", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockSTKPushResponse));

      const result = await client.stkPush({
        amount: 100,
        phoneNumber: "254712345678",
        accountReference: "TEST",
        transactionDesc: "Test payment",
      });

      expect(result.data).toEqual(mockSTKPushResponse);
    });

    it("should handle STK push API error", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockErrorResponse, false));

      const result = await client.stkPush({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "TEST",
        transactionDesc: "Test",
      });

      expect(result.error).toBe("Request failed");
      expect(result.data).toBeUndefined();
    });

    it("should handle STK push network error", async () => {
      mockFetch.mockRejectedValue(mockNetworkError);

      const result = await client.stkPush({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "TEST",
        transactionDesc: "Test",
      });

      expect(result.error).toBe("Network error");
      expect(result.data).toBeUndefined();
    });

    it("should handle STK push with errorMessage in response", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ errorMessage: "Invalid phone number" }, false),
      );

      const result = await client.stkPush({
        amount: 1000,
        phoneNumber: "invalid",
        accountReference: "TEST",
        transactionDesc: "Test",
      });

      expect(result.error).toBe("Invalid phone number");
    });
  });

  describe("STK Query", () => {
    it("should successfully query STK status", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockSTKQueryResponse));

      const result = await client.stkQuery({
        CheckoutRequestID: "ws_CO_123456789",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/mpesa/stk-query",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            CheckoutRequestID: "ws_CO_123456789",
          }),
        },
      );

      expect(result.data).toEqual(mockSTKQueryResponse);
    });

    it("should handle STK query error", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ error: "Transaction not found" }, false),
      );

      const result = await client.stkQuery({
        CheckoutRequestID: "invalid",
      });

      expect(result.error).toBe("Transaction not found");
    });

    it("should handle network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network failure"));

      const result = await client.stkQuery({
        CheckoutRequestID: "ws_CO_123456789",
      });

      expect(result.error).toBe("Network failure");
    });
  });

  describe("C2B Simulation", () => {
    it("should successfully simulate C2B transaction", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockC2BSimulateResponse));

      const result = await client.simulateC2B({
        shortCode: "600000",
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
        commandID: "CustomerPayBillOnline",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/mpesa/simulate-c2b",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            shortCode: "600000",
            amount: 1000,
            phoneNumber: "254712345678",
            billRefNumber: "INV-001",
            commandID: "CustomerPayBillOnline",
          }),
        }),
      );

      expect(result.data).toEqual(mockC2BSimulateResponse);
    });

    it("should handle C2B simulation without optional fields", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockC2BSimulateResponse));

      const result = await client.simulateC2B({
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
      });

      expect(result.data).toEqual(mockC2BSimulateResponse);
    });

    it("should handle C2B simulation error", async () => {
      mockFetch.mockRejectedValue(new Error("Simulation failed"));

      const result = await client.simulateC2B({
        shortCode: "600000",
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
      });

      expect(result.error).toBe("Simulation failed");
    });
  });

  describe("B2C Transaction", () => {
    it("should successfully initiate B2C payment", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockB2CResponse));

      const result = await client.b2c({
        amount: 5000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        remarks: "Salary payment",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/mpesa/b2c",
        expect.objectContaining({
          method: "POST",
        }),
      );

      expect(result.data).toEqual(mockB2CResponse);
    });

    it("should handle B2C with occasion parameter", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockB2CResponse));

      await client.b2c({
        amount: 5000,
        phoneNumber: "254712345678",
        commandID: "SalaryPayment",
        remarks: "Payment",
        occasion: "December Salary",
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.occasion).toBe("December Salary");
    });

    it("should handle B2C error", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ error: "Insufficient funds" }, false),
      );

      const result = await client.b2c({
        amount: 5000,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
        remarks: "Payment",
      });

      expect(result.error).toBe("Insufficient funds");
    });

    it("should handle different B2C command IDs", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockB2CResponse));

      await client.b2c({
        amount: 1000,
        phoneNumber: "254712345678",
        commandID: "PromotionPayment",
        remarks: "Promo",
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe("B2B Transaction", () => {
    it("should successfully initiate B2B payment", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockB2BResponse));

      const result = await client.b2b({
        amount: 10000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        senderIdentifierType: "4",
        receiverIdentifierType: "4",
        accountReference: "INV-001",
        remarks: "Payment for services",
      });

      expect(result.data).toEqual(mockB2BResponse);
    });

    it("should handle B2B with different identifier types", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockB2BResponse));

      await client.b2b({
        amount: 10000,
        partyB: "600000",
        commandID: "BusinessBuyGoods",
        senderIdentifierType: "2",
        receiverIdentifierType: "2",
        accountReference: "INV-001",
        remarks: "Payment",
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.senderIdentifierType).toBe("2");
      expect(body.receiverIdentifierType).toBe("2");
    });

    it("should handle B2B error", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ error: "Invalid receiver shortcode" }, false),
      );

      const result = await client.b2b({
        amount: 10000,
        partyB: "invalid",
        commandID: "BusinessPayBill",
        senderIdentifierType: "4",
        receiverIdentifierType: "4",
        accountReference: "INV-001",
        remarks: "Payment",
      });

      expect(result.error).toBe("Invalid receiver shortcode");
    });
  });

  describe("Account Balance", () => {
    it("should successfully query account balance", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(mockAccountBalanceResponse),
      );

      const result = await client.accountBalance({
        identifierType: "4",
        remarks: "Balance inquiry",
      });

      expect(result.data).toEqual(mockAccountBalanceResponse);
    });

    it("should handle balance query with minimal parameters", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(mockAccountBalanceResponse),
      );

      const result = await client.accountBalance({});

      expect(result.data).toEqual(mockAccountBalanceResponse);
    });

    it("should handle balance query error", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ error: "Authentication failed" }, false),
      );

      const result = await client.accountBalance({
        identifierType: "4",
      });

      expect(result.error).toBe("Authentication failed");
    });
  });

  describe("Transaction Status", () => {
    it("should successfully query transaction status", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(mockTransactionStatusResponse),
      );

      const result = await client.transactionStatus({
        transactionID: "ABC123XYZ",
        identifierType: "1",
        remarks: "Status check",
      });

      expect(result.data).toEqual(mockTransactionStatusResponse);
    });

    it("should handle transaction status with optional fields", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(mockTransactionStatusResponse),
      );

      const result = await client.transactionStatus({
        transactionID: "ABC123XYZ",
        occasion: "Payment verification",
      });

      expect(result.data).toEqual(mockTransactionStatusResponse);
    });

    it("should handle transaction status error", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ error: "Transaction not found" }, false),
      );

      const result = await client.transactionStatus({
        transactionID: "invalid",
        identifierType: "1",
      });

      expect(result.error).toBe("Transaction not found");
    });
  });

  describe("Reversal", () => {
    it("should successfully initiate reversal", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockReversalResponse));

      const result = await client.reversal({
        transactionID: "ABC123XYZ",
        amount: 1000,
        receiverParty: "600000",
        remarks: "Reversal request",
      });

      expect(result.data).toEqual(mockReversalResponse);
    });

    it("should handle reversal with optional occasion", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockReversalResponse));

      const result = await client.reversal({
        transactionID: "ABC123XYZ",
        amount: 1000,
        occasion: "Duplicate payment",
      });

      expect(result.data).toEqual(mockReversalResponse);
    });

    it("should handle reversal error", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ error: "Transaction cannot be reversed" }, false),
      );

      const result = await client.reversal({
        transactionID: "ABC123XYZ",
        amount: 1000,
        receiverParty: "600000",
      });

      expect(result.error).toBe("Transaction cannot be reversed");
    });
  });

  describe("C2B Registration", () => {
    it("should successfully register C2B URLs", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockC2BRegisterResponse));

      const result = await client.registerC2B({
        shortCode: "600000",
        responseType: "Completed",
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      });

      expect(result.data).toEqual(mockC2BRegisterResponse);
    });

    it("should handle C2B registration with Cancelled response type", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockC2BRegisterResponse));

      await client.registerC2B({
        shortCode: "600000",
        responseType: "Cancelled",
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it("should handle C2B registration error", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ error: "Invalid URLs" }, false),
      );

      const result = await client.registerC2B({
        shortCode: "600000",
        responseType: "Completed",
        confirmationURL: "invalid-url",
        validationURL: "invalid-url",
      });

      expect(result.error).toBe("Invalid URLs");
    });
  });

  describe("QR Code Generation", () => {
    it("should successfully generate QR code", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockDynamicQRResponse));

      const result = await client.generateQR({
        merchantName: "Test Store",
        refNo: "INV-12345",
        amount: 1500,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      });

      expect(result.data).toEqual(mockDynamicQRResponse);
    });

    it("should generate QR with size 300", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockDynamicQRResponse));

      await client.generateQR({
        merchantName: "Test Store",
        refNo: "INV-12345",
        amount: 1500,
        transactionType: "PB",
        creditPartyIdentifier: "600000",
        size: "300",
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.size).toBe("300");
    });

    it("should generate QR with size 500", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockDynamicQRResponse));

      await client.generateQR({
        merchantName: "Test Store",
        refNo: "INV-12345",
        amount: 1500,
        transactionType: "WA",
        creditPartyIdentifier: "600000",
        size: "500",
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.size).toBe("500");
    });

    it("should handle different transaction types", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockDynamicQRResponse));

      const transactionTypes: Array<"BG" | "WA" | "PB" | "SM"> = [
        "BG",
        "WA",
        "PB",
        "SM",
      ];

      for (const type of transactionTypes) {
        await client.generateQR({
          merchantName: "Test Store",
          refNo: "INV-12345",
          amount: 1500,
          transactionType: type,
          creditPartyIdentifier: "600000",
        });
      }

      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it("should handle QR generation error", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ error: "Invalid merchant details" }, false),
      );

      const result = await client.generateQR({
        merchantName: "",
        refNo: "INV-12345",
        amount: 1500,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      });

      expect(result.error).toBe("Invalid merchant details");
    });
  });

  describe("Error Handling", () => {
    it("should handle non-Error objects in catch block", async () => {
      mockFetch.mockRejectedValue("String error");

      const result = await client.stkPush({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "TEST",
        transactionDesc: "Test",
      });

      expect(result.error).toBe("Network error");
    });

    it("should handle response without error fields", async () => {
      mockFetch.mockResolvedValue(createMockResponse({}, false));

      const result = await client.stkPush({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "TEST",
        transactionDesc: "Test",
      });

      expect(result.error).toBe("Request failed");
    });

    it("should handle malformed JSON response", async () => {
      const badResponse = createMockResponse({});
      badResponse.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));
      mockFetch.mockResolvedValue(badResponse);

      const result = await client.stkPush({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "TEST",
        transactionDesc: "Test",
      });
      expect(result.error).toBe("Invalid JSON");
    });

    it("should handle null or undefined errors", async () => {
      mockFetch.mockRejectedValue(null);

      const result = await client.stkPush({
        amount: 1000,
        phoneNumber: "254712345678",
        accountReference: "TEST",
        transactionDesc: "Test",
      });

      expect(result.error).toBe("Network error");
    });
  });
});
