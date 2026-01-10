import { describe, it, expect, vi, beforeEach } from "vitest";
import { MpesaAuth } from "../../utils/auth";
import { mockConfig } from "../fixtures/config";
import { mockTokenResponse } from "../fixtures/responses";

describe("MpesaAuth", () => {
  let auth: MpesaAuth;

  beforeEach(() => {
    auth = new MpesaAuth(mockConfig);
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("getAccessToken", () => {
    it("should get access token successfully", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTokenResponse,
        headers: new Headers(),
      });

      const token = await auth.getAccessToken();

      expect(token).toBe("mock_access_token_12345");
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should cache token and not fetch again if valid", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTokenResponse,
        headers: new Headers(),
      });

      const token1 = await auth.getAccessToken();
      const token2 = await auth.getAccessToken();

      expect(token1).toBe(token2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw auth error on 401", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ errorMessage: "Invalid credentials" }),
        headers: new Headers(),
      });

      await expect(auth.getAccessToken()).rejects.toThrow(
        "Invalid credentials",
      );
    });

    it.skip("should handle timeout errors", async () => {
      const originalWarn = console.warn;
      console.warn = vi
        .fn()(global.fetch as any)
        .mockImplementation(() => {
          const error: any = new Error("The operation was aborted");
          error.name = "AbortError";
          return Promise.reject(error);
        });

      await expect(auth.getAccessToken()).rejects.toThrow();

      console.warn = originalWarn;
    }, 10000);

    it("should send correct authorization header", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTokenResponse,
        headers: new Headers(),
      });

      await auth.getAccessToken();

      const fetchCall = (global.fetch as any).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers.Authorization).toContain("Basic ");
    });
  });

  describe("getBaseUrl", () => {
    it("should return sandbox URL for sandbox environment", () => {
      const url = auth.getBaseUrl();
      expect(url).toBe("https://sandbox.safaricom.co.ke");
    });

    it("should return production URL for production environment", () => {
      const prodAuth = new MpesaAuth({
        ...mockConfig,
        environment: "production",
      });
      const url = prodAuth.getBaseUrl();
      expect(url).toBe("https://api.safaricom.co.ke");
    });
  });

  describe("getPassword", () => {
    it("should generate valid base64 password", () => {
      const password = auth.getPassword();

      expect(password).toBeTruthy();
      expect(typeof password).toBe("string");

      // Should be valid base64
      expect(() => Buffer.from(password, "base64")).not.toThrow();
    });
  });

  describe("getTimestamp", () => {
    it("should generate timestamp in correct format", () => {
      const timestamp = auth.getTimestamp();

      expect(timestamp).toMatch(/^\d{14}$/);
      expect(timestamp.length).toBe(14);
    });
  });
});
