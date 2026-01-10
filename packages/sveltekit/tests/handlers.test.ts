import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMpesaHandlers } from "../src/handlers";
import type { RequestEvent } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
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

// Mock @sveltejs/kit
vi.mock("@sveltejs/kit", () => ({
  json: vi.fn((data, init) => {
    return new Response(JSON.stringify(data), {
      status: init?.status || 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
}));

describe("createMpesaHandlers", () => {
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

  describe("STK Callback Handler", () => {
    it("should handle successful STK callback", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(
        mockSTKCallbackSuccess,
      );
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.stkCallback.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockSTKCallbackSuccess,
        undefined,
      );
      expect(data.ResultCode).toBe(0);
      expect(response.status).toBe(200);
    });

    it("should handle failed STK callback", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(
        mockSTKCallbackFailure,
      );
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      const response = await handlers.stkCallback.POST(
        mockEvent as RequestEvent,
      );

      expect(mockClient.handleSTKCallback).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should handle errors in STK callback", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(
        mockSTKCallbackSuccess,
      );
      mockClient.handleSTKCallback.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await handlers.stkCallback.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultCode).toBe(1);
      expect(data.ResultDesc).toBe("Internal error processing callback");
      expect(response.status).toBe(200);
    });

    it("should extract IP from x-forwarded-for header", async () => {
      mockEvent.request!.headers.set("x-forwarded-for", "203.0.113.1");
      vi.mocked(mockEvent.request!.json).mockResolvedValue(
        mockSTKCallbackSuccess,
      );
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.stkCallback.POST(mockEvent as RequestEvent);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockSTKCallbackSuccess,
        "203.0.113.1",
      );
    });

    it("should extract IP from x-real-ip header", async () => {
      mockEvent.request!.headers.set("x-real-ip", "203.0.113.5");
      vi.mocked(mockEvent.request!.json).mockResolvedValue(
        mockSTKCallbackSuccess,
      );
      mockClient.handleSTKCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      await handlers.stkCallback.POST(mockEvent as RequestEvent);

      expect(mockClient.handleSTKCallback).toHaveBeenCalledWith(
        mockSTKCallbackSuccess,
        "203.0.113.5",
      );
    });
  });

  describe("C2B Validation Handler", () => {
    it("should handle C2B validation", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(mockC2BCallback);
      mockClient.handleC2BValidation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });

      const response = await handlers.c2bValidation.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(mockClient.handleC2BValidation).toHaveBeenCalledWith(
        mockC2BCallback,
      );
      expect(data.ResultCode).toBe(0);
      expect(response.status).toBe(200);
    });

    it("should handle C2B validation errors", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(mockC2BCallback);
      mockClient.handleC2BValidation.mockRejectedValue(
        new Error("Validation failed"),
      );

      const response = await handlers.c2bValidation.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultCode).toBe(1);
      expect(data.ResultDesc).toBe("Validation failed");
    });
  });

  describe("C2B Confirmation Handler", () => {
    it("should handle C2B confirmation", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(mockC2BCallback);
      mockClient.handleC2BConfirmation.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.c2bConfirmation.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(mockClient.handleC2BConfirmation).toHaveBeenCalledWith(
        mockC2BCallback,
      );
      expect(data.ResultCode).toBe(0);
    });

    it("should handle C2B confirmation errors", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(mockC2BCallback);
      mockClient.handleC2BConfirmation.mockRejectedValue(
        new Error("Processing failed"),
      );

      const response = await handlers.c2bConfirmation.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Processing failed");
    });
  });

  describe("B2C Handlers", () => {
    it("should handle B2C result callback", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(mockB2CCallback);
      mockClient.handleB2CCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.b2cResult.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(mockClient.handleB2CCallback).toHaveBeenCalledWith(
        mockB2CCallback,
      );
      expect(data.ResultCode).toBe(0);
    });

    it("should handle B2C timeout", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionID: "test-123",
      });

      const response = await handlers.b2cTimeout.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Timeout received");
    });

    it("should handle B2C errors", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(mockB2CCallback);
      mockClient.handleB2CCallback.mockRejectedValue(
        new Error("Processing error"),
      );

      const response = await handlers.b2cResult.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(data.ResultDesc).toBe("Processing failed");
    });

    it("should handle B2C timeout errors", async () => {
      vi.mocked(mockEvent.request!.json).mockRejectedValue(
        new Error("Read error"),
      );

      const response = await handlers.b2cTimeout.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Processing failed");
    });
  });

  describe("B2B Handlers", () => {
    it("should handle B2B result callback", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(mockB2BCallback);
      mockClient.handleB2BCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.b2bResult.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(mockClient.handleB2BCallback).toHaveBeenCalledWith(
        mockB2BCallback,
      );
      expect(data.ResultCode).toBe(0);
    });

    it("should handle B2B timeout", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionID: "test-123",
      });

      const response = await handlers.b2bTimeout.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Timeout received");
    });

    it("should handle B2B errors", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(mockB2BCallback);
      mockClient.handleB2BCallback.mockRejectedValue(
        new Error("Processing error"),
      );

      const response = await handlers.b2bResult.POST(mockEvent as RequestEvent);
      const data = await response.json();

      expect(data.ResultDesc).toBe("Processing failed");
    });

    it("should handle B2B timeout errors", async () => {
      vi.mocked(mockEvent.request!.json).mockRejectedValue(
        new Error("Read error"),
      );

      const response = await handlers.b2bTimeout.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Processing failed");
    });
  });

  describe("Balance Handlers", () => {
    it("should handle balance result callback", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(mockBalanceCallback);
      mockClient.handleAccountBalanceCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.balanceResult.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(mockClient.handleAccountBalanceCallback).toHaveBeenCalledWith(
        mockBalanceCallback,
      );
      expect(data.ResultCode).toBe(0);
    });

    it("should handle balance timeout", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionID: "test-123",
      });

      const response = await handlers.balanceTimeout.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Timeout received");
    });

    it("should handle balance errors", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(mockBalanceCallback);
      mockClient.handleAccountBalanceCallback.mockRejectedValue(
        new Error("Processing error"),
      );

      const response = await handlers.balanceResult.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Processing failed");
    });

    it("should handle balance timeout errors", async () => {
      vi.mocked(mockEvent.request!.json).mockRejectedValue(
        new Error("Read error"),
      );

      const response = await handlers.balanceTimeout.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Processing failed");
    });
  });

  describe("Transaction Status Handlers", () => {
    it("should handle status result callback", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(
        mockTransactionStatusCallback,
      );
      mockClient.handleTransactionStatusCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.transactionStatusResult.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(mockClient.handleTransactionStatusCallback).toHaveBeenCalledWith(
        mockTransactionStatusCallback,
      );
      expect(data.ResultCode).toBe(0);
    });

    it("should handle status timeout", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionID: "test-123",
      });

      const response = await handlers.transactionStatusTimeout.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Timeout received");
    });

    it("should handle status errors", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(
        mockTransactionStatusCallback,
      );
      mockClient.handleTransactionStatusCallback.mockRejectedValue(
        new Error("Processing error"),
      );

      const response = await handlers.transactionStatusResult.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Processing failed");
    });

    it("should handle status timeout errors", async () => {
      vi.mocked(mockEvent.request!.json).mockRejectedValue(
        new Error("Read error"),
      );

      const response = await handlers.transactionStatusTimeout.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Processing failed");
    });
  });

  describe("Reversal Handlers", () => {
    it("should handle reversal result callback", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(
        mockReversalCallback,
      );
      mockClient.handleReversalCallback.mockResolvedValue({
        ResultCode: 0,
        ResultDesc: "Success",
      });

      const response = await handlers.reversalResult.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(mockClient.handleReversalCallback).toHaveBeenCalledWith(
        mockReversalCallback,
      );
      expect(data.ResultCode).toBe(0);
    });

    it("should handle reversal timeout", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        TransactionID: "test-123",
      });

      const response = await handlers.reversalTimeout.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Timeout received");
    });

    it("should handle reversal errors", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue(
        mockReversalCallback,
      );
      mockClient.handleReversalCallback.mockRejectedValue(
        new Error("Processing error"),
      );

      const response = await handlers.reversalResult.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Processing failed");
    });

    it("should handle reversal timeout errors", async () => {
      vi.mocked(mockEvent.request!.json).mockRejectedValue(
        new Error("Read error"),
      );

      const response = await handlers.reversalTimeout.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(data.ResultDesc).toBe("Processing failed");
    });
  });

  describe("Simulate C2B Handler", () => {
    it("should handle C2B simulation", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
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

      const response = await handlers.simulateC2B.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(mockClient.simulateC2B).toHaveBeenCalled();
      expect(data.ResponseCode).toBe("0");
    });

    it("should validate required fields for C2B simulation", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue({ amount: 1000 });

      const response = await handlers.simulateC2B.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("should handle C2B simulation errors", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
      });
      mockClient.simulateC2B.mockRejectedValue(new Error("Simulation failed"));

      const response = await handlers.simulateC2B.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Simulation failed");
    });

    it("should handle C2B simulation errors without message", async () => {
      vi.mocked(mockEvent.request!.json).mockResolvedValue({
        amount: 1000,
        phoneNumber: "254712345678",
        billRefNumber: "INV-001",
      });
      mockClient.simulateC2B.mockRejectedValue({});

      const response = await handlers.simulateC2B.POST(
        mockEvent as RequestEvent,
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Request failed");
    });
  });
});
