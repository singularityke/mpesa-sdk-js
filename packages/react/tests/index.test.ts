import { describe, it, expect } from "vitest";
import { MpesaReactClient } from "../src/index";

describe("Package Exports", () => {
  it("should export MpesaReactClient", () => {
    expect(MpesaReactClient).toBeDefined();
    expect(typeof MpesaReactClient).toBe("function");
  });

  it("should create instance of MpesaReactClient", () => {
    const client = new MpesaReactClient();
    expect(client).toBeInstanceOf(MpesaReactClient);
  });

  it("should have all required methods", () => {
    const client = new MpesaReactClient();

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
});
