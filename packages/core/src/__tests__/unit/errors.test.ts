import { describe, it, expect } from "vitest";
import {
  MpesaError,
  MpesaAuthError,
  MpesaValidationError,
  MpesaNetworkError,
  MpesaTimeoutError,
  MpesaRateLimitError,
  MpesaApiError,
  parseMpesaApiError,
} from "../../utils/errors";

describe("MpesaErrors", () => {
  describe("MpesaError", () => {
    it("should create error with all properties", () => {
      const error = new MpesaError("Test error", "TEST_CODE", 400, {
        detail: "test",
      });

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ detail: "test" });
      expect(error.name).toBe("MpesaError");
    });
  });

  describe("MpesaAuthError", () => {
    it("should create auth error with 401 status", () => {
      const error = new MpesaAuthError("Invalid credentials");

      expect(error).toBeInstanceOf(MpesaError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("AUTH_ERROR");
      expect(error.name).toBe("MpesaAuthError");
    });
  });

  describe("MpesaValidationError", () => {
    it("should create validation error with 400 status", () => {
      const error = new MpesaValidationError("Invalid phone number");

      expect(error).toBeInstanceOf(MpesaError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.name).toBe("MpesaValidationError");
    });
  });

  describe("MpesaNetworkError", () => {
    it("should create network error with retryable flag", () => {
      const error = new MpesaNetworkError("Connection failed", true);

      expect(error).toBeInstanceOf(MpesaError);
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe("MpesaNetworkError");
    });
  });

  describe("MpesaTimeoutError", () => {
    it("should create timeout error with 408 status", () => {
      const error = new MpesaTimeoutError("Request timed out");

      expect(error).toBeInstanceOf(MpesaError);
      expect(error.statusCode).toBe(408);
      expect(error.code).toBe("TIMEOUT_ERROR");
      expect(error.name).toBe("MpesaTimeoutError");
    });
  });

  describe("MpesaRateLimitError", () => {
    it("should create rate limit error with retry after", () => {
      const error = new MpesaRateLimitError("Rate limit exceeded", 60);

      expect(error).toBeInstanceOf(MpesaError);
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe("RATE_LIMIT_ERROR");
      expect(error.retryAfter).toBe(60);
      expect(error.name).toBe("MpesaRateLimitError");
    });
  });

  describe("parseMpesaApiError", () => {
    it("should parse 401 as auth error", () => {
      const error = parseMpesaApiError(401, { errorMessage: "Unauthorized" });

      expect(error).toBeInstanceOf(MpesaAuthError);
      expect(error.message).toBe("Unauthorized");
    });

    it("should parse 400 as validation error", () => {
      const error = parseMpesaApiError(400, { errorMessage: "Bad request" });

      expect(error).toBeInstanceOf(MpesaValidationError);
      expect(error.message).toBe("Bad request");
    });

    it("should parse 429 as rate limit error", () => {
      const error = parseMpesaApiError(429, {
        errorMessage: "Too many requests",
        retryAfter: 30,
      });

      expect(error).toBeInstanceOf(MpesaRateLimitError);
      expect(error.message).toBe("Too many requests");
      expect((error as MpesaRateLimitError).retryAfter).toBe(30);
    });

    it("should parse 500+ as network error", () => {
      const error = parseMpesaApiError(503, {
        errorMessage: "Service unavailable",
      });

      expect(error).toBeInstanceOf(MpesaNetworkError);
      expect(error.message).toBe("Service unavailable");
      expect((error as MpesaNetworkError).isRetryable).toBe(true);
    });

    it("should handle missing error message", () => {
      const error = parseMpesaApiError(400, {});

      expect(error.message).toBe("Unknown API error");
    });

    it("should parse ResponseDescription field", () => {
      const error = parseMpesaApiError(400, {
        ResponseDescription: "Invalid request",
      });

      expect(error.message).toBe("Invalid request");
    });
  });
});
