import { describe, it, expect, beforeEach, vi } from "vitest";
import { Elysia } from "elysia";
import { createMpesaHandlers } from "../src/handlers";
import { createMockMpesaClient } from "./mocks/mpesa-client.mock";

describe("M-Pesa Elysia Integration", () => {
  let app: any;
  let mockClient: ReturnType<typeof createMockMpesaClient>;
  let handlers: ReturnType<typeof createMpesaHandlers>;

  beforeEach(() => {
    // Create mock client and handlers
    mockClient = createMockMpesaClient();
    handlers = createMpesaHandlers(mockClient);

    // Create app with handlers directly (avoiding real MpesaClient initialization)
    app = new Elysia({ prefix: "/mpesa" })
      // Client API endpoints
      .post("/stk-push", handlers.stkPush)
      .post("/stk-query", handlers.stkQuery)
      .post("/b2c", handlers.b2c)
      .post("/b2b", handlers.b2b)
      .post("/balance", handlers.balance)
      .post("/transaction-status", handlers.transactionStatus)
      .post("/reversal", handlers.reversal)
      .post("/register-c2b", handlers.registerC2B)
      .post("/generate-qr", handlers.generateQR)
      .post("/simulate-c2b", handlers.simulateC2B)

      // Webhook endpoints
      .post("/callback", handlers.stkCallback)
      .post("/stk-callback", handlers.stkCallback)
      .post("/c2b-validation", handlers.c2bValidation)
      .post("/validation", handlers.c2bValidation)
      .post("/c2b-confirmation", handlers.c2bConfirmation)
      .post("/confirmation", handlers.c2bConfirmation)
      .post("/b2c-result", handlers.b2cResult)
      .post("/b2c-timeout", handlers.b2cTimeout)
      .post("/b2b-result", handlers.b2bResult)
      .post("/b2b-timeout", handlers.b2bTimeout)
      .post("/balance-result", handlers.balanceResult)
      .post("/balance-timeout", handlers.balanceTimeout)
      .post("/reversal-result", handlers.reversalResult)
      .post("/reversal-timeout", handlers.reversalTimeout)
      .post("/status-result", handlers.statusResult)
      .post("/status-timeout", handlers.statusTimeout);
  });

  describe("Route Registration", () => {
    it("should register all client API routes", async () => {
      const routes = [
        {
          path: "/mpesa/stk-push",
          body: { amount: 100, phoneNumber: "254712345678" },
        },
        { path: "/mpesa/stk-query", body: { CheckoutRequestID: "test" } },
        {
          path: "/mpesa/b2c",
          body: {
            amount: 100,
            phoneNumber: "254712345678",
            commandID: "BusinessPayment",
          },
        },
        {
          path: "/mpesa/b2b",
          body: {
            amount: 100,
            partyB: "600000",
            commandID: "BusinessPayBill",
            accountReference: "ACC",
          },
        },
        { path: "/mpesa/balance", body: { identifierType: "4" } },
        {
          path: "/mpesa/transaction-status",
          body: { transactionID: "TEST123" },
        },
        {
          path: "/mpesa/reversal",
          body: { transactionID: "TEST123", amount: 100 },
        },
        {
          path: "/mpesa/register-c2b",
          body: {
            confirmationURL: "https://example.com",
            validationURL: "https://example.com",
          },
        },
        {
          path: "/mpesa/generate-qr",
          body: {
            merchantName: "Test",
            refNo: "REF",
            amount: 100,
            transactionType: "BG",
            creditPartyIdentifier: "600000",
          },
        },
        {
          path: "/mpesa/simulate-c2b",
          body: {
            shortCode: "600000",
            amount: 100,
            phoneNumber: "254712345678",
            billRefNumber: "REF",
          },
        },
      ];

      for (const route of routes) {
        const response = await app.handle(
          new Request(`http://localhost${route.path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(route.body),
          }),
        );

        // Should not return 404
        expect(response.status).not.toBe(404);
      }
    });

    it("should register all webhook routes", async () => {
      const routes = [
        "/mpesa/callback",
        "/mpesa/stk-callback",
        "/mpesa/c2b-validation",
        "/mpesa/validation",
        "/mpesa/c2b-confirmation",
        "/mpesa/confirmation",
        "/mpesa/b2c-result",
        "/mpesa/b2c-timeout",
        "/mpesa/b2b-result",
        "/mpesa/b2b-timeout",
        "/mpesa/balance-result",
        "/mpesa/balance-timeout",
        "/mpesa/reversal-result",
        "/mpesa/reversal-timeout",
        "/mpesa/status-result",
        "/mpesa/status-timeout",
      ];

      for (const route of routes) {
        const response = await app.handle(
          new Request(`http://localhost${route}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }),
        );

        expect(response.status).not.toBe(404);
      }
    });
  });

  describe("STK Push Flow", () => {
    it("should handle STK push request", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/stk-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 100,
            phoneNumber: "254712345678",
            accountReference: "TEST001",
            transactionDesc: "Test payment",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("CheckoutRequestID");
      expect(data.ResponseCode).toBe("0");
    });

    it("should handle STK callback", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/stk-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Body: {
              stkCallback: {
                MerchantRequestID: "test-id",
                CheckoutRequestID: "test-checkout-id",
                ResultCode: 0,
                ResultDesc: "Success",
              },
            },
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResultCode).toBe(0);
    });

    it("should handle STK query", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/stk-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            CheckoutRequestID: "test-checkout-id",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("ResponseCode");
    });
  });

  describe("C2B Flow", () => {
    it("should handle C2B validation", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/c2b-validation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            TransactionType: "Pay Bill",
            TransID: "TEST123",
            TransAmount: "100",
            BillRefNumber: "ACCOUNT001",
            MSISDN: "254712345678",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResultCode).toBe(0);
    });

    it("should handle C2B confirmation", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/c2b-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            TransactionType: "Pay Bill",
            TransID: "TEST123",
            TransAmount: "100",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResultCode).toBe(0);
    });

    it("should handle C2B simulation", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/simulate-c2b", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shortCode: "600000",
            amount: 100,
            phoneNumber: "254712345678",
            billRefNumber: "INVOICE001",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResponseCode).toBe("0");
    });

    it("should register C2B URLs", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/register-c2b", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmationURL: "https://example.com/confirmation",
            validationURL: "https://example.com/validation",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResponseCode).toBe("0");
    });
  });

  describe("B2C Flow", () => {
    it("should handle B2C request", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/b2c", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 500,
            phoneNumber: "254712345678",
            commandID: "BusinessPayment",
            remarks: "Salary",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResponseCode).toBe("0");
    });

    it("should handle B2C result callback", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/b2c-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Result: {
              ResultCode: 0,
              ResultDesc: "Success",
            },
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResultCode).toBe(0);
    });

    it("should handle B2C timeout", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/b2c-timeout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("ResultCode");
    });
  });

  describe("B2B Flow", () => {
    it("should handle B2B request", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/b2b", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 1000,
            partyB: "600000",
            commandID: "BusinessPayBill",
            accountReference: "ACC123",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResponseCode).toBe("0");
    });

    it("should handle B2B result callback", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/b2b-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Result: {
              ResultCode: 0,
              ResultDesc: "Success",
            },
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResultCode).toBe(0);
    });
  });

  describe("Other Operations", () => {
    it("should handle account balance request", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifierType: "4",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResponseCode).toBe("0");
    });

    it("should handle transaction status request", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/transaction-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionID: "TEST123456",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResponseCode).toBe("0");
    });

    it("should handle reversal request", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/reversal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionID: "TEST123456",
            amount: 100,
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResponseCode).toBe("0");
    });

    it("should handle QR code generation", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/generate-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantName: "Test Shop",
            refNo: "INV001",
            amount: 500,
            transactionType: "BG",
            creditPartyIdentifier: "600000",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ResponseCode).toBe("00");
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for missing required fields in STK push", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/stk-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 100,
            // missing phoneNumber
          }),
        }),
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should return 400 for missing CheckoutRequestID in STK query", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/stk-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("CheckoutRequestID");
    });

    it("should return 400 for invalid QR size", async () => {
      const response = await app.handle(
        new Request("http://localhost/mpesa/generate-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantName: "Test",
            refNo: "REF",
            amount: 100,
            transactionType: "BG",
            creditPartyIdentifier: "600000",
            size: "400", // Invalid size
          }),
        }),
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Size must be");
    });
  });

  describe("Export Validation", () => {
    it("should have working handlers", () => {
      expect(handlers).toBeDefined();
      expect(handlers.stkPush).toBeTypeOf("function");
      expect(handlers.stkCallback).toBeTypeOf("function");
    });

    it("should have mock client methods", () => {
      expect(mockClient.stkPush).toBeDefined();
      expect(mockClient.handleSTKCallback).toBeDefined();
    });
  });
});
