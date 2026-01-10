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
    expect(mpesa.handlers).toHaveProperty("simulateC2B");
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

  it("should create handlers as event handlers", () => {
    const mpesa = createMpesa(mockConfig);

    expect(typeof mpesa.handlers.stkCallback).toBe("function");
    expect(typeof mpesa.handlers.c2bValidation).toBe("function");
    expect(typeof mpesa.handlers.c2bConfirmation).toBe("function");
    expect(typeof mpesa.handlers.b2cResult).toBe("function");
    expect(typeof mpesa.handlers.b2cTimeout).toBe("function");
    expect(typeof mpesa.handlers.catchAll).toBe("function");
    expect(typeof mpesa.handlers.simulateC2B).toBe("function");
  });
});
