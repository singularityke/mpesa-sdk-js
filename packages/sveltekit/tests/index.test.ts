import { describe, it, expect, vi } from "vitest";
import { createMpesa } from "../src/index";

describe("createMpesa", () => {
  const mockConfig = {
    consumerKey: "test-key",
    consumerSecret: "test-secret",
    passkey: "test-passkey",
    shortcode: "600000",
    environment: "sandbox" as const,
    callbackUrl: "https://example.com/callback",
  };

  it("should create mpesa instance with client and handlers", () => {
    const mpesa = createMpesa(mockConfig);

    expect(mpesa).toHaveProperty("client");
    expect(mpesa).toHaveProperty("handlers");
    expect(mpesa.handlers).toHaveProperty("stkCallback");
    expect(mpesa.handlers).toHaveProperty("c2bValidation");
    expect(mpesa.handlers).toHaveProperty("c2bConfirmation");
    expect(mpesa.handlers).toHaveProperty("b2cResult");
    expect(mpesa.handlers).toHaveProperty("b2cTimeout");
    expect(mpesa.handlers).toHaveProperty("catchAll");
  });

  it("should accept callback options", () => {
    const callbackOptions = {
      onSuccess: vi.fn(),
      onFailure: vi.fn(),
    };

    const mpesa = createMpesa(mockConfig, { callbackOptions });

    expect(mpesa.client).toBeDefined();
    expect(mpesa.handlers).toBeDefined();
  });

  it("should create handlers with POST methods", () => {
    const mpesa = createMpesa(mockConfig);

    expect(mpesa.handlers.stkCallback).toHaveProperty("POST");
    expect(mpesa.handlers.c2bValidation).toHaveProperty("POST");
    expect(mpesa.handlers.c2bConfirmation).toHaveProperty("POST");
    expect(mpesa.handlers.b2cResult).toHaveProperty("POST");
    expect(mpesa.handlers.b2cTimeout).toHaveProperty("POST");
    expect(mpesa.handlers.catchAll).toHaveProperty("POST");

    expect(typeof mpesa.handlers.stkCallback.POST).toBe("function");
    expect(typeof mpesa.handlers.catchAll.POST).toBe("function");
  });
});
