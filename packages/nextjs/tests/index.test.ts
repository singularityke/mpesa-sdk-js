import { describe, it, expect } from "vitest";
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
  });

  it("should have all required handlers", () => {
    const mpesa = createMpesa(mockConfig);

    expect(mpesa.handlers).toHaveProperty("stkCallback");
    expect(mpesa.handlers).toHaveProperty("c2bValidation");
    expect(mpesa.handlers).toHaveProperty("c2bConfirmation");
    expect(mpesa.handlers).toHaveProperty("b2cResult");
    expect(mpesa.handlers).toHaveProperty("b2cTimeout");
    expect(mpesa.handlers).toHaveProperty("b2bResult");
    expect(mpesa.handlers).toHaveProperty("b2bTimeout");
    expect(mpesa.handlers).toHaveProperty("balanceResult");
    expect(mpesa.handlers).toHaveProperty("balanceTimeout");
    expect(mpesa.handlers).toHaveProperty("transactionStatusResult");
    expect(mpesa.handlers).toHaveProperty("transactionStatusTimeout");
    expect(mpesa.handlers).toHaveProperty("reversalResult");
    expect(mpesa.handlers).toHaveProperty("reversalTimeout");
    expect(mpesa.handlers).toHaveProperty("simulateC2B");
    expect(mpesa.handlers).toHaveProperty("catchAll");
  });

  it("should accept callback options", () => {
    const callbackOptions = {
      onSuccess: () => {},
      onFailure: () => {},
    };

    const mpesa = createMpesa(mockConfig, { callbackOptions });

    expect(mpesa.client).toBeDefined();
  });

  it("should have POST method on each handler", () => {
    const mpesa = createMpesa(mockConfig);

    expect(mpesa.handlers.stkCallback).toHaveProperty("POST");
    expect(mpesa.handlers.c2bValidation).toHaveProperty("POST");
    expect(mpesa.handlers.catchAll).toHaveProperty("POST");
  });
});
