import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMpesaHandlers } from "../src/handlers";
import { createMockMpesaClient } from "./mocks/mpesa-client.mock";
import type { Context } from "elysia";

describe("M-Pesa Error Scenarios", () => {
  let handlers: ReturnType<typeof createMpesaHandlers>;
  let mockClient: ReturnType<typeof createMockMpesaClient>;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    mockClient = createMockMpesaClient();
    handlers = createMpesaHandlers(mockClient);
    mockContext = {
      body: {},
      set: {
        status: 200,
        headers: {},
      },
      request: {
        headers: new Headers(),
      } as any,
    };
  });

  describe("C2B Simulate Errors", () => {
    it("should handle C2B simulate errors", async () => {
      vi.mocked(mockClient.simulateC2B).mockRejectedValueOnce(
        new Error("Simulation failed"),
      );

      mockContext.body = {
        shortCode: "600000",
        amount: 100,
        phoneNumber: "254712345678",
        billRefNumber: "INVOICE001",
      };

      const result = await handlers.simulateC2B(mockContext as Context);

      expect(result.error).toBeDefined();
      expect(mockContext.set?.status).toBe(500);
    });
  });

  describe("B2C Timeout Errors", () => {
    it("should handle B2C timeout errors", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {
        throw new Error("Logging failed");
      });

      mockContext.body = { some: "data" };

      const result = await handlers.b2cTimeout(mockContext as Context);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
      expect(mockContext.set?.status).toBe(200);

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe("B2B Timeout Errors", () => {
    it("should handle B2B timeout errors", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {
        throw new Error("Logging failed");
      });

      mockContext.body = { some: "data" };

      const result = await handlers.b2bTimeout(mockContext as Context);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
      expect(mockContext.set?.status).toBe(200);

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe("Balance Timeout Errors", () => {
    it("should handle balance timeout errors", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {
        throw new Error("Logging failed");
      });

      mockContext.body = { some: "data" };

      const result = await handlers.balanceTimeout(mockContext as Context);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
      expect(mockContext.set?.status).toBe(200);

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe("Reversal Timeout Errors", () => {
    it("should handle reversal timeout errors", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {
        throw new Error("Logging failed");
      });

      mockContext.body = { some: "data" };

      const result = await handlers.reversalTimeout(mockContext as Context);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
      expect(mockContext.set?.status).toBe(200);

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe("Status Timeout Errors", () => {
    it("should handle status timeout errors", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {
        throw new Error("Logging failed");
      });

      mockContext.body = { some: "data" };

      const result = await handlers.statusTimeout(mockContext as Context);

      expect(result).toEqual({
        ResultCode: 1,
        ResultDesc: "Processing failed",
      });
      expect(mockContext.set?.status).toBe(200);

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe("STK Push Errors", () => {
    it("should handle STK push API errors", async () => {
      vi.mocked(mockClient.stkPush).mockRejectedValueOnce(
        new Error("API request failed"),
      );

      mockContext.body = {
        amount: 100,
        phoneNumber: "254712345678",
      };

      const result = await handlers.stkPush(mockContext as Context);

      expect(result.error).toBe("API request failed");
      expect(mockContext.set?.status).toBe(500);
    });

    it("should handle STK push errors without message", async () => {
      vi.mocked(mockClient.stkPush).mockRejectedValueOnce(new Error());

      mockContext.body = {
        amount: 100,
        phoneNumber: "254712345678",
      };

      const result = await handlers.stkPush(mockContext as Context);

      expect(result.error).toBe("Request failed");
      expect(mockContext.set?.status).toBe(500);
    });
  });

  describe("STK Query Errors", () => {
    it("should handle STK query API errors", async () => {
      vi.mocked(mockClient.stkQuery).mockRejectedValueOnce(
        new Error("Query failed"),
      );

      mockContext.body = {
        CheckoutRequestID: "test-id",
      };

      const result = await handlers.stkQuery(mockContext as Context);

      expect(result.error).toBe("Query failed");
      expect(mockContext.set?.status).toBe(500);
    });
  });

  describe("B2C Errors", () => {
    it("should handle B2C API errors", async () => {
      vi.mocked(mockClient.b2c).mockRejectedValueOnce(new Error("B2C failed"));

      mockContext.body = {
        amount: 500,
        phoneNumber: "254712345678",
        commandID: "BusinessPayment",
      };

      const result = await handlers.b2c(mockContext as Context);

      expect(result.error).toBe("B2C failed");
      expect(mockContext.set?.status).toBe(500);
    });
  });

  describe("B2B Errors", () => {
    it("should handle B2B API errors", async () => {
      vi.mocked(mockClient.b2b).mockRejectedValueOnce(new Error("B2B failed"));

      mockContext.body = {
        amount: 1000,
        partyB: "600000",
        commandID: "BusinessPayBill",
        accountReference: "ACC123",
      };

      const result = await handlers.b2b(mockContext as Context);

      expect(result.error).toBe("B2B failed");
      expect(mockContext.set?.status).toBe(500);
    });
  });

  describe("Balance Errors", () => {
    it("should handle balance API errors", async () => {
      vi.mocked(mockClient.accountBalance).mockRejectedValueOnce(
        new Error("Balance check failed"),
      );

      mockContext.body = {
        identifierType: "4",
      };

      const result = await handlers.balance(mockContext as Context);

      expect(result.error).toBe("Balance check failed");
      expect(mockContext.set?.status).toBe(500);
    });
  });

  describe("Transaction Status Errors", () => {
    it("should handle transaction status API errors", async () => {
      vi.mocked(mockClient.transactionStatus).mockRejectedValueOnce(
        new Error("Status check failed"),
      );

      mockContext.body = {
        transactionID: "TEST123",
      };

      const result = await handlers.transactionStatus(mockContext as Context);

      expect(result.error).toBe("Status check failed");
      expect(mockContext.set?.status).toBe(500);
    });
  });

  describe("Reversal Errors", () => {
    it("should handle reversal API errors", async () => {
      vi.mocked(mockClient.reversal).mockRejectedValueOnce(
        new Error("Reversal failed"),
      );

      mockContext.body = {
        transactionID: "TEST123",
        amount: 100,
      };

      const result = await handlers.reversal(mockContext as Context);

      expect(result.error).toBe("Reversal failed");
      expect(mockContext.set?.status).toBe(500);
    });
  });

  describe("Register C2B Errors", () => {
    it("should handle register C2B API errors", async () => {
      vi.mocked(mockClient.registerC2BUrl).mockRejectedValueOnce(
        new Error("Registration failed"),
      );

      mockContext.body = {
        confirmationURL: "https://example.com/confirmation",
        validationURL: "https://example.com/validation",
      };

      const result = await handlers.registerC2B(mockContext as Context);

      expect(result.error).toBe("Registration failed");
      expect(mockContext.set?.status).toBe(500);
    });
  });

  describe("Generate QR Errors", () => {
    it("should handle QR generation API errors", async () => {
      vi.mocked(mockClient.generateDynamicQR).mockRejectedValueOnce(
        new Error("QR generation failed"),
      );

      mockContext.body = {
        merchantName: "Test Shop",
        refNo: "INV001",
        amount: 500,
        transactionType: "BG",
        creditPartyIdentifier: "600000",
      };

      const result = await handlers.generateQR(mockContext as Context);

      expect(result.error).toBe("QR generation failed");
      expect(mockContext.set?.status).toBe(500);
    });
  });
});
