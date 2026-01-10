import { describe, it, expect, vi } from "vitest";
import { createMpesa } from "../src/index";

const createMockFastify = () => {
  const routes: Array<{ method: string; path: string; handler: any }> = [];

  return {
    post: vi.fn((path: string, handler: any) => {
      routes.push({ method: "POST", path, handler });
    }),
    _routes: routes,
  };
};

describe("createMpesa", () => {
  const mockConfig = {
    consumerKey: "test-key",
    consumerSecret: "test-secret",
    passkey: "test-passkey",
    shortcode: "600000",
    environment: "sandbox" as const,
    callbackUrl: "https://example.com/callback",
  };

  it("should create mpesa instance with client, handlers, and router", () => {
    const mpesa = createMpesa(mockConfig);

    expect(mpesa).toHaveProperty("client");
    expect(mpesa).toHaveProperty("handlers");
    expect(mpesa).toHaveProperty("router");
    expect(typeof mpesa.router).toBe("function");
  });

  it("should register all routes on the fastify instance", () => {
    const mpesa = createMpesa(mockConfig);
    const mockFastify = createMockFastify() as any;

    mpesa.router(mockFastify);

    // Client API endpoints
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/stk-push",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/stk-query",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith("/b2c", expect.any(Function));
    expect(mockFastify.post).toHaveBeenCalledWith("/b2b", expect.any(Function));
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/balance",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/transaction-status",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/reversal",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/register-c2b",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/generate-qr",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/simulate-c2b",
      expect.any(Function),
    );

    // Webhook endpoints
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/callback",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/c2b-validation",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/c2b-confirmation",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/b2c-result",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/b2c-timeout",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/b2b-result",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/b2b-timeout",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/balance-result",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/balance-timeout",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/reversal-result",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/reversal-timeout",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/status-result",
      expect.any(Function),
    );
    expect(mockFastify.post).toHaveBeenCalledWith(
      "/status-timeout",
      expect.any(Function),
    );

    expect(mockFastify.post).toHaveBeenCalledTimes(23);
  });

  it("should accept callback options", () => {
    const callbackOptions = {
      onSuccess: vi.fn(),
      onFailure: vi.fn(),
    };

    const mpesa = createMpesa(mockConfig, { callbackOptions });

    expect(mpesa.client).toBeDefined();
  });

  it("should return router function that returns the fastify instance", () => {
    const mpesa = createMpesa(mockConfig);
    const mockFastify = createMockFastify() as any;

    const result = mpesa.router(mockFastify);

    expect(result).toBe(mockFastify);
  });
});
