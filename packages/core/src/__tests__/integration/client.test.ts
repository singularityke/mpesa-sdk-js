import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MpesaClient } from "../../client/mpesa-client";
import { mockConfig } from "../fixtures/config";
import {
  mockTokenResponse,
  mockSTKPushResponse,
  mockSTKQueryResponse,
  mockB2CResponse,
} from "../fixtures/responses";
import { successfulSTKCallback, mockC2BCallback } from "../fixtures/callbacks";

describe("MpesaClient Integration", () => {
  let client: MpesaClient;

  beforeEach(() => {
    client = new MpesaClient(mockConfig);
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    client.destroy();
  });

  describe("stkPush", () => {
    it("should initiate STK push successfully", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSTKPushResponse,
        });

      const result = await client.stkPush({
        amount: 100,
        phoneNumber: "0712345678",
        accountReference: "TEST123",
        transactionDesc: "Test payment",
      });

      expect(result.ResponseCode).toBe("0");
      expect(result.CheckoutRequestID).toBeTruthy();
    });

    it("should validate phone number format", async () => {
      await expect(
        client.stkPush({
          amount: 100,
          phoneNumber: "12345",
          accountReference: "TEST",
          transactionDesc: "Test",
        }),
      ).rejects.toThrow("Invalid phone number");
    });

    it("should validate minimum amount", async () => {
      await expect(
        client.stkPush({
          amount: 0,
          phoneNumber: "0712345678",
          accountReference: "TEST",
          transactionDesc: "Test",
        }),
      ).rejects.toThrow("Amount must be at least 1 KES");
    });

    it("should validate account reference length", async () => {
      await expect(
        client.stkPush({
          amount: 100,
          phoneNumber: "0712345678",
          accountReference: "VERYLONGACCOUNTREFERENCE123456",
          transactionDesc: "Test",
        }),
      ).rejects.toThrow("13 characters or less");
    });

    it("should validate transaction description", async () => {
      await expect(
        client.stkPush({
          amount: 100,
          phoneNumber: "0712345678",
          accountReference: "TEST",
          transactionDesc: "",
        }),
      ).rejects.toThrow("Transaction description is required");
    });

    it("should format phone number correctly", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSTKPushResponse,
        });

      await client.stkPush({
        amount: 100,
        phoneNumber: "0712345678",
        accountReference: "TEST",
        transactionDesc: "Test",
      });

      const stkCall = (global.fetch as any).mock.calls[1];
      const payload = JSON.parse(stkCall[1].body);

      expect(payload.PhoneNumber).toBe("254712345678");
    });
  });

  describe("stkQuery", () => {
    it("should query STK push status", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSTKQueryResponse,
        });

      const result = await client.stkQuery({
        CheckoutRequestID: "ws_CO_191220191020363925",
      });

      expect(result.ResultCode).toBe("0");
    });

    it("should validate CheckoutRequestID", async () => {
      await expect(client.stkQuery({ CheckoutRequestID: "" })).rejects.toThrow(
        "CheckoutRequestID is required",
      );
    });
  });

  describe("b2c", () => {
    it("should send B2C payment successfully", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockB2CResponse,
        });

      const result = await client.b2c({
        amount: 100,
        phoneNumber: "0712345678",
        commandID: "BusinessPayment",
        remarks: "Test payment",
      });

      expect(result.ResponseCode).toBe("0");
    });

    it("should validate minimum B2C amount", async () => {
      await expect(
        client.b2c({
          amount: 5,
          phoneNumber: "0712345678",
          commandID: "BusinessPayment",
          remarks: "Test",
        }),
      ).rejects.toThrow("must be greater than 10");
    });

    it("should validate B2C remarks length", async () => {
      await expect(
        client.b2c({
          amount: 100,
          phoneNumber: "0712345678",
          commandID: "BusinessPayment",
          remarks: "A".repeat(101),
        }),
      ).rejects.toThrow("between 1 and 100 characters");
    });
  });

  describe("b2b", () => {
    it("should send B2B payment successfully", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockB2CResponse,
        });

      const result = await client.b2b({
        amount: 100,
        partyB: "600000",
        commandID: "BusinessPayBill",
        senderIdentifierType: "4",
        receiverIdentifierType: "4",
        remarks: "Test payment",
        accountReference: "TEST",
      });

      expect(result.ResponseCode).toBe("0");
    });

    it("should validate B2B amount", async () => {
      await expect(
        client.b2b({
          amount: 0,
          partyB: "600000",
          commandID: "BusinessPayBill",
          senderIdentifierType: "4",
          receiverIdentifierType: "4",
          remarks: "Test",
          accountReference: "TEST",
        }),
      ).rejects.toThrow("must be greater than 0");
    });
  });

  describe("accountBalance", () => {
    it("should query account balance", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockB2CResponse,
        });

      const result = await client.accountBalance();

      expect(result.ResponseCode).toBe("0");
    });
  });

  describe("transactionStatus", () => {
    it("should query transaction status", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockB2CResponse,
        });

      const result = await client.transactionStatus({
        transactionID: "NLJ7RT61SV",
      });

      expect(result.ResponseCode).toBe("0");
    });

    it("should validate transaction ID", async () => {
      await expect(
        client.transactionStatus({ transactionID: "" }),
      ).rejects.toThrow("Transaction ID is required");
    });
  });

  describe("reversal", () => {
    it("should reverse transaction", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockB2CResponse,
        });

      const result = await client.reversal({
        transactionID: "NLJ7RT61SV",
        amount: 100,
      });

      expect(result.ResponseCode).toBe("0");
    });

    it("should validate reversal transaction ID", async () => {
      await expect(
        client.reversal({ transactionID: "", amount: 100 }),
      ).rejects.toThrow("Transaction ID is required");
    });

    it("should validate reversal amount", async () => {
      await expect(
        client.reversal({ transactionID: "NLJ7RT61SV", amount: 0 }),
      ).rejects.toThrow("must be greater than 0");
    });
  });

  describe("generateDynamicQR", () => {
    it("should generate QR code", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            ResponseCode: "0",
            ResponseDescription: "Success",
            QRCode: "base64encodedstring",
          }),
        });

      const result = await client.generateDynamicQR({
        merchantName: "Test Shop",
        refNo: "REF123",
        amount: 100,
        transactionType: "BG",
        creditPartyIdentifier: "174379",
      });

      expect(result.ResponseCode).toBe("0");
      expect(result.QRCode).toBeTruthy();
    });

    it("should validate merchant name length", async () => {
      await expect(
        client.generateDynamicQR({
          merchantName: "A".repeat(27),
          refNo: "REF",
          amount: 100,
          transactionType: "BG",
          creditPartyIdentifier: "174379",
        }),
      ).rejects.toThrow("26 characters or less");
    });

    it("should validate QR amount range", async () => {
      await expect(
        client.generateDynamicQR({
          merchantName: "Test",
          refNo: "REF",
          amount: 1000000,
          transactionType: "BG",
          creditPartyIdentifier: "174379",
        }),
      ).rejects.toThrow("between 1 and 999999");
    });
  });

  describe("Callback Handlers", () => {
    it("should handle STK callback", async () => {
      const response = await client.handleSTKCallback(successfulSTKCallback);

      expect(response).toEqual({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    });

    it("should handle C2B validation", async () => {
      const response = await client.handleC2BValidation(mockC2BCallback);

      expect(response).toEqual({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    });

    it("should handle C2B confirmation", async () => {
      const response = await client.handleC2BConfirmation(mockC2BCallback);

      expect(response).toEqual({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    });

    it("should parse STK callback", () => {
      const parsed = client.parseSTKCallback(successfulSTKCallback);

      expect(parsed.isSuccess).toBe(true);
      expect(parsed.amount).toBe(1000);
    });

    it("should parse C2B callback", () => {
      const parsed = client.parseC2BCallback(mockC2BCallback);

      expect(parsed.transactionId).toBe("RI704KI9RW");
      expect(parsed.amount).toBe(1000);
    });
  });

  describe("Configuration", () => {
    it("should return config", () => {
      const config = client.getConfig();

      expect(config.shortcode).toBe(mockConfig.shortcode);
    });

    it("should get callback handler", () => {
      const handler = client.getCallbackHandler();

      expect(handler).toBeDefined();
    });
  });
  describe("Callback Handler Methods", () => {
    it("should handle B2C callback", async () => {
      const callback: any = {
        Result: {
          ResultType: 0,
          ResultCode: 0,
          ResultDesc: "Success",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
          ResultParameters: {
            ResultParameter: [
              { Key: "TransactionReceipt", Value: "NLJ7RT61SV" },
              { Key: "TransactionAmount", Value: 5000 },
            ],
          },
        },
      };

      const response = await client.handleB2CCallback(callback);
      expect(response).toHaveProperty("ResultCode");
    });

    it("should handle B2B callback", async () => {
      const callback: any = {
        Result: {
          ResultType: 0,
          ResultCode: 0,
          ResultDesc: "Success",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
          ResultParameters: {
            ResultParameter: [{ Key: "Amount", Value: 1000 }],
          },
        },
      };

      const response = await client.handleB2BCallback(callback);
      expect(response).toHaveProperty("ResultCode");
    });

    it("should handle account balance callback", async () => {
      const callback: any = {
        Result: {
          ResultType: 0,
          ResultCode: 0,
          ResultDesc: "Success",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
          ResultParameters: {
            ResultParameter: [
              { Key: "WorkingAccountAvailableFunds", Value: 10000 },
            ],
          },
        },
      };

      const response = await client.handleAccountBalanceCallback(callback);
      expect(response).toHaveProperty("ResultCode");
    });

    it("should handle transaction status callback", async () => {
      const callback: any = {
        Result: {
          ResultType: 0,
          ResultCode: 0,
          ResultDesc: "Success",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
          ResultParameters: {
            ResultParameter: [{ Key: "ReceiptNo", Value: "NLJ7RT61SV" }],
          },
        },
      };

      const response = await client.handleTransactionStatusCallback(callback);
      expect(response).toHaveProperty("ResultCode");
    });

    it("should handle reversal callback", async () => {
      const callback: any = {
        Result: {
          ResultType: 0,
          ResultCode: 0,
          ResultDesc: "Success",
          OriginatorConversationID: "orig-123",
          ConversationID: "conv-456",
          TransactionID: "trans-789",
        },
      };

      const response = await client.handleReversalCallback(callback);
      expect(response).toHaveProperty("ResultCode");
    });
  });

  describe("C2B Simulate", () => {
    it("should simulate C2B in sandbox", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            ConversationID: "AG_20191219_00005797af5d7d75f652",
            OriginatorCoversationID: "16740-34861180-1",
            ResponseDescription: "Accept the service request successfully.",
          }),
        });

      const result = await client.simulateC2B({
        amount: 100,
        phoneNumber: "0712345678",
        billRefNumber: "TEST123",
      });

      expect(result.ResponseDescription).toBeTruthy();
    });

    it("should not allow C2B simulation in production", async () => {
      const prodClient = new MpesaClient({
        ...mockConfig,
        environment: "production",
      });

      await expect(
        prodClient.simulateC2B({
          amount: 100,
          phoneNumber: "0712345678",
          billRefNumber: "TEST123",
        }),
      ).rejects.toThrow("only available in sandbox");

      prodClient.destroy();
    });
  });
  describe("Error Handling", () => {
    it.skip("should handle network errors", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ errorMessage: "Service unavailable" }),
        });

      await expect(
        client.stkPush({
          amount: 100,
          phoneNumber: "0712345678",
          accountReference: "TEST",
          transactionDesc: "Test",
        }),
      ).rejects.toThrow();
    });

    it("should handle callback errors gracefully", async () => {
      const badCallback: any = {
        Body: {
          stkCallback: {
            MerchantRequestID: "123",
            CheckoutRequestID: "456",
            ResultCode: 1,
            ResultDesc: "Failed",
          },
        },
      };

      const response = await client.handleSTKCallback(badCallback);
      expect(response).toHaveProperty("ResultCode", 0);
    });
  });
});
