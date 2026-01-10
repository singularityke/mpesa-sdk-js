import { describe, it, expect, vi } from "vitest";
import { MpesaCallbackHandler } from "../../utils/callback";
import {
  successfulSTKCallback,
  failedSTKCallback,
  cancelledSTKCallback,
  mockC2BCallback,
  mockB2CCallback,
} from "../fixtures/callbacks";

describe("MpesaCallbackHandler", () => {
  describe("STK Callback Parsing", () => {
    it("should parse successful STK callback correctly", () => {
      const handler = new MpesaCallbackHandler();
      const parsed = handler.parseCallback(successfulSTKCallback);

      expect(parsed.isSuccess).toBe(true);
      expect(parsed.resultCode).toBe(0);
      expect(parsed.amount).toBe(1000);
      expect(parsed.mpesaReceiptNumber).toBe("NLJ7RT61SV");
      expect(parsed.phoneNumber).toBe("254712345678");
      expect(parsed.transactionDate).toBe("2025-12-22T14:49:00");
      expect(parsed.errorMessage).toBeUndefined();
    });

    it("should parse failed STK callback correctly", () => {
      const handler = new MpesaCallbackHandler();
      const parsed = handler.parseCallback(failedSTKCallback);

      expect(parsed.isSuccess).toBe(false);
      expect(parsed.resultCode).toBe(1);
      expect(parsed.errorMessage).toContain("Insufficient funds");
      expect(parsed.amount).toBeUndefined();
    });

    it("should parse cancelled STK callback correctly", () => {
      const handler = new MpesaCallbackHandler();
      const parsed = handler.parseCallback(cancelledSTKCallback);

      expect(parsed.isSuccess).toBe(false);
      expect(parsed.resultCode).toBe(1032);
      expect(parsed.errorMessage).toContain("cancelled");
    });
  });

  describe("IP Validation", () => {
    it("should accept valid Safaricom IPs", () => {
      const handler = new MpesaCallbackHandler({ validateIp: true });

      const validIps = [
        "196.201.214.200",
        "196.201.214.206",
        "196.201.213.114",
      ];

      validIps.forEach((ip) => {
        expect(handler.validateCallbackIp(ip)).toBe(true);
      });
    });

    it("should reject invalid IPs", () => {
      const handler = new MpesaCallbackHandler({ validateIp: true });

      const invalidIps = ["192.168.1.1", "10.0.0.1", "172.16.0.1", "8.8.8.8"];

      invalidIps.forEach((ip) => {
        expect(handler.validateCallbackIp(ip)).toBe(false);
      });
    });

    it("should accept all IPs when validation is disabled", () => {
      const handler = new MpesaCallbackHandler({ validateIp: false });

      expect(handler.validateCallbackIp("192.168.1.1")).toBe(true);
      expect(handler.validateCallbackIp("10.0.0.1")).toBe(true);
    });

    it("should use custom allowed IPs", () => {
      const handler = new MpesaCallbackHandler({
        validateIp: true,
        allowedIps: ["192.168.1.1", "10.0.0.1"],
      });

      expect(handler.validateCallbackIp("192.168.1.1")).toBe(true);
      expect(handler.validateCallbackIp("196.201.214.200")).toBe(false);
    });
  });

  describe("Callback Handlers", () => {
    it("should call onSuccess handler for successful transaction", async () => {
      const onSuccess = vi.fn();
      const handler = new MpesaCallbackHandler({ onSuccess });

      await handler.handleCallback(successfulSTKCallback);

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ isSuccess: true }),
      );
    });

    it("should call onFailure handler for failed transaction", async () => {
      const onFailure = vi.fn();
      const handler = new MpesaCallbackHandler({ onFailure });

      await handler.handleCallback(failedSTKCallback);

      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(onFailure).toHaveBeenCalledWith(
        expect.objectContaining({ isSuccess: false }),
      );
    });

    it("should call onCallback handler for any transaction", async () => {
      const onCallback = vi.fn();
      const handler = new MpesaCallbackHandler({ onCallback });

      await handler.handleCallback(successfulSTKCallback);
      await handler.handleCallback(failedSTKCallback);

      expect(onCallback).toHaveBeenCalledTimes(2);
    });

    it("should check for duplicates if handler provided", async () => {
      const isDuplicate = vi.fn().mockResolvedValue(true);
      const onSuccess = vi.fn();

      const handler = new MpesaCallbackHandler({ isDuplicate, onSuccess });

      await handler.handleCallback(successfulSTKCallback);

      expect(isDuplicate).toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("should reject callback from invalid IP", async () => {
      const handler = new MpesaCallbackHandler({ validateIp: true });

      await expect(
        handler.handleCallback(successfulSTKCallback, "192.168.1.1"),
      ).rejects.toThrow("Invalid callback IP");
    });
  });

  describe("C2B Callbacks", () => {
    it("should parse C2B callback correctly", () => {
      const handler = new MpesaCallbackHandler();
      const parsed = handler.parseC2BCallback(mockC2BCallback);

      expect(parsed.transactionId).toBe("RI704KI9RW");
      expect(parsed.amount).toBe(1000);
      expect(parsed.msisdn).toBe("254708374149");
      expect(parsed.firstName).toBe("John");
      expect(parsed.lastName).toBe("Doe");
    });

    it("should handle C2B validation", async () => {
      const onC2BValidation = vi.fn().mockResolvedValue(true);
      const handler = new MpesaCallbackHandler({ onC2BValidation });

      const result = await handler.handleC2BValidation(mockC2BCallback);

      expect(result).toBe(true);
      expect(onC2BValidation).toHaveBeenCalled();
    });

    it("should default to accepting C2B transactions", async () => {
      const handler = new MpesaCallbackHandler();

      const result = await handler.handleC2BValidation(mockC2BCallback);

      expect(result).toBe(true);
    });
  });

  describe("B2C Callbacks", () => {
    it("should parse successful B2C callback", () => {
      const handler = new MpesaCallbackHandler();
      const parsed = handler.parseB2CCallback(mockB2CCallback);

      expect(parsed.isSuccess).toBe(true);
      expect(parsed.transactionId).toBe("NLJ7RT61SV");
      expect(parsed.amount).toBe(5000);
      expect(parsed.charges).toBe(50);
    });
  });

  describe("Error Messages", () => {
    it("should return correct error message for each error code", () => {
      const handler = new MpesaCallbackHandler();

      const testCases = [
        { code: 0, expected: "Success" },
        { code: 1, expected: "Insufficient funds" },
        { code: 17, expected: "cancelled" },
        { code: 1032, expected: "cancelled" },
        { code: 2001, expected: "Wrong PIN" },
      ];

      testCases.forEach(({ code, expected }) => {
        const message = handler.getErrorMessage(code);
        expect(message.toLowerCase()).toContain(expected.toLowerCase());
      });
    });
  });

  describe("Response Creation", () => {
    it("should create success response", () => {
      const handler = new MpesaCallbackHandler();
      const response = handler.createCallbackResponse(true);

      expect(response).toEqual({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    });

    it("should create failure response", () => {
      const handler = new MpesaCallbackHandler();
      const response = handler.createCallbackResponse(false, "Custom error");

      expect(response).toEqual({
        ResultCode: 1,
        ResultDesc: "Custom error",
      });
    });
  });
});
