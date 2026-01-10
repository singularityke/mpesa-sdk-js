import { describe, it, expect } from "vitest";
import { createMpesa } from "../src/index";
import { Hono } from "hono";

describe("createMpesa", () => {
  const mockConfig = {
    consumerKey: "test-key",
    consumerSecret: "test-secret",
    passkey: "test-passkey",
    shortcode: "600000",
    environment: "sandbox" as const,
    callbackUrl: "https://example.com/callback",
  };

  it("should create mpesa instance with client, handlers, and app", () => {
    const mpesa = createMpesa(mockConfig);

    expect(mpesa).toHaveProperty("client");
    expect(mpesa).toHaveProperty("handlers");
    expect(mpesa).toHaveProperty("app");
    expect(mpesa.app).toBeInstanceOf(Hono);
  });

  it("should register all routes on the Hono app", () => {
    const mpesa = createMpesa(mockConfig);
    const app = mpesa.app;

    // Get all registered routes
    const routes = app.routes;

    // Check that routes are registered
    expect(routes.length).toBeGreaterThan(0);
  });

  it("should accept callback options", () => {
    const callbackOptions = {
      onSuccess: () => {},
      onFailure: () => {},
    };

    const mpesa = createMpesa(mockConfig, { callbackOptions });

    expect(mpesa.client).toBeDefined();
  });

  it("should create a Hono app instance", () => {
    const mpesa = createMpesa(mockConfig);

    expect(mpesa.app).toBeInstanceOf(Hono);
  });
});
