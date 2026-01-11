import { describe, it, expect } from "vitest";
import { createMpesaClient, MpesaSvelteClient } from "../src/index";

describe("Package Exports", () => {
  it("should export createMpesaClient function", () => {
    expect(createMpesaClient).toBeDefined();
    expect(typeof createMpesaClient).toBe("function");
  });

  it("should export MpesaSvelteClient class", () => {
    expect(MpesaSvelteClient).toBeDefined();
    expect(typeof MpesaSvelteClient).toBe("function");
  });

  it("should create instance using createMpesaClient", () => {
    const client = createMpesaClient();
    expect(client).toBeInstanceOf(MpesaSvelteClient);
  });

  it("should create instance of MpesaSvelteClient directly", () => {
    const client = new MpesaSvelteClient();
    expect(client).toBeInstanceOf(MpesaSvelteClient);
  });

  it("should create instance with config", () => {
    const client = createMpesaClient({ baseUrl: "https://api.test.com" });
    expect(client).toBeInstanceOf(MpesaSvelteClient);
  });

  it("should create instance with custom fetcher", () => {
    const customFetcher = fetch;
    const client = createMpesaClient({ fetcher: customFetcher });
    expect(client).toBeInstanceOf(MpesaSvelteClient);
  });

  it("should have all required methods", () => {
    const client = createMpesaClient();
    expect(typeof client.stkPush).toBe("function");
    expect(typeof client.stkQuery).toBe("function");
    expect(typeof client.simulateC2B).toBe("function");
    expect(typeof client.b2c).toBe("function");
    expect(typeof client.b2b).toBe("function");
    expect(typeof client.accountBalance).toBe("function");
    expect(typeof client.transactionStatus).toBe("function");
    expect(typeof client.reversal).toBe("function");
    expect(typeof client.registerC2B).toBe("function");
    expect(typeof client.generateQR).toBe("function");
  });

  it("should export MpesaClientConfig type", () => {
    const config: import("../src/index").MpesaClientConfig = {
      baseUrl: "https://test.com",
    };
    expect(config).toBeDefined();
  });
});
