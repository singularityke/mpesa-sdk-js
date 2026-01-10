import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMpesa } from "../src/index";
import express, { Router } from "express";

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

  it("should register all routes on the express router", () => {
    const mpesa = createMpesa(mockConfig);
    const router = Router();

    const postSpy = vi.spyOn(router, "post");

    mpesa.router(router);

    // Client API endpoints
    expect(postSpy).toHaveBeenCalledWith("/stk-push", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith("/stk-query", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith("/b2c", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith("/b2b", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith("/balance", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith(
      "/transaction-status",
      expect.any(Function),
    );
    expect(postSpy).toHaveBeenCalledWith("/reversal", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith("/register-c2b", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith("/generate-qr", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith("/simulate-c2b", expect.any(Function));

    // Webhook endpoints
    expect(postSpy).toHaveBeenCalledWith("/callback", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith("/stk-callback", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith(
      "/c2b-validation",
      expect.any(Function),
    );
    expect(postSpy).toHaveBeenCalledWith("/validation", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith(
      "/c2b-confirmation",
      expect.any(Function),
    );
    expect(postSpy).toHaveBeenCalledWith("/confirmation", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith("/b2c-result", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith("/b2c-timeout", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith("/b2b-result", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith("/b2b-timeout", expect.any(Function));
    expect(postSpy).toHaveBeenCalledWith(
      "/balance-result",
      expect.any(Function),
    );
    expect(postSpy).toHaveBeenCalledWith(
      "/balance-timeout",
      expect.any(Function),
    );
    expect(postSpy).toHaveBeenCalledWith(
      "/reversal-result",
      expect.any(Function),
    );
    expect(postSpy).toHaveBeenCalledWith(
      "/reversal-timeout",
      expect.any(Function),
    );
    expect(postSpy).toHaveBeenCalledWith(
      "/status-result",
      expect.any(Function),
    );
    expect(postSpy).toHaveBeenCalledWith(
      "/status-timeout",
      expect.any(Function),
    );

    expect(postSpy).toHaveBeenCalledTimes(26);
  });

  it("should accept callback options", () => {
    const callbackOptions = {
      onSuccess: vi.fn(),
      onFailure: vi.fn(),
    };

    const mpesa = createMpesa(mockConfig, { callbackOptions });

    expect(mpesa.client).toBeDefined();
  });

  it("should return router function that returns the express router", () => {
    const mpesa = createMpesa(mockConfig);
    const router = Router();

    const result = mpesa.router(router);

    expect(result).toBe(router);
  });
});
