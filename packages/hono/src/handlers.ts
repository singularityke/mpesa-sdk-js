import {
  MpesaClient,
  type STKCallback,
  type C2BCallback,
  type B2CCallback,
  type B2BCallback,
  type AccountBalanceCallback,
  type AccountBalanceRequest,
  type TransactionStatusCallback,
  type ReversalCallback,
} from "@singularity-payments/core";
import type { Context } from "hono";
import type { MpesaRouteHandlers } from "./types";

export function createMpesaHandlers(client: MpesaClient): MpesaRouteHandlers {
  const handlers: MpesaRouteHandlers = {
    stkCallback: async (c: Context) => {
      try {
        const body = await c.req.json<STKCallback>();
        const ipAddress =
          c.req.header("x-forwarded-for") ||
          c.req.header("x-real-ip") ||
          undefined;
        const response = await client.handleSTKCallback(body, ipAddress);
        return c.json(response, 200);
      } catch (error: any) {
        console.error("STK Callback error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Internal error processing callback",
          },
          200,
        );
      }
    },

    c2bValidation: async (c: Context) => {
      try {
        const body = await c.req.json<C2BCallback>();
        const response = await client.handleC2BValidation(body);
        return c.json(response, 200);
      } catch (error: any) {
        console.error("C2B Validation error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Validation failed",
          },
          200,
        );
      }
    },

    c2bConfirmation: async (c: Context) => {
      try {
        const body = await c.req.json<C2BCallback>();
        const response = await client.handleC2BConfirmation(body);
        return c.json(response, 200);
      } catch (error: any) {
        console.error("C2B Confirmation error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Processing failed",
          },
          200,
        );
      }
    },

    b2cResult: async (c: Context) => {
      try {
        const body = await c.req.json<B2CCallback>();
        const parsed = client.getCallbackHandler().parseB2CCallback(body);
        console.log("B2C Result:", parsed);
        return c.json(
          {
            ResultCode: 0,
            ResultDesc: "Accepted",
          },
          200,
        );
      } catch (error: any) {
        console.error("B2C Result error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Processing failed",
          },
          200,
        );
      }
    },

    b2cTimeout: async (c: Context) => {
      try {
        const body = await c.req.json();
        console.log("B2C Timeout:", body);
        return c.json(
          {
            ResultCode: 0,
            ResultDesc: "Timeout received",
          },
          200,
        );
      } catch (error: any) {
        console.error("B2C Timeout error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Processing failed",
          },
          200,
        );
      }
    },

    b2bResult: async (c: Context) => {
      try {
        const body = await c.req.json<B2BCallback>();
        const parsed = client.getCallbackHandler().parseB2BCallback(body);
        console.log("B2B Result:", parsed);
        return c.json(
          {
            ResultCode: 0,
            ResultDesc: "Accepted",
          },
          200,
        );
      } catch (error: any) {
        console.error("B2B Result error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Processing failed",
          },
          200,
        );
      }
    },

    b2bTimeout: async (c: Context) => {
      try {
        const body = await c.req.json();
        console.log("B2B Timeout:", body);
        return c.json(
          {
            ResultCode: 0,
            ResultDesc: "Timeout received",
          },
          200,
        );
      } catch (error: any) {
        console.error("B2B Timeout error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Processing failed",
          },
          200,
        );
      }
    },

    balanceResult: async (c: Context) => {
      try {
        const body = await c.req.json<AccountBalanceCallback>();
        const parsed = client
          .getCallbackHandler()
          .parseAccountBalanceCallback(body);
        console.log("Balance Result:", parsed);
        return c.json(
          {
            ResultCode: 0,
            ResultDesc: "Accepted",
          },
          200,
        );
      } catch (error: any) {
        console.error("Balance Result error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Processing failed",
          },
          200,
        );
      }
    },

    balanceTimeout: async (c: Context) => {
      try {
        const body = await c.req.json();
        console.log("Balance Timeout:", body);
        return c.json(
          {
            ResultCode: 0,
            ResultDesc: "Timeout received",
          },
          200,
        );
      } catch (error: any) {
        console.error("Balance Timeout error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Processing failed",
          },
          200,
        );
      }
    },

    reversalResult: async (c: Context) => {
      try {
        const body = await c.req.json<ReversalCallback>();
        const parsed = client.getCallbackHandler().parseReversalCallback(body);
        console.log("Reversal Result:", parsed);
        return c.json(
          {
            ResultCode: 0,
            ResultDesc: "Accepted",
          },
          200,
        );
      } catch (error: any) {
        console.error("Reversal Result error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Processing failed",
          },
          200,
        );
      }
    },

    reversalTimeout: async (c: Context) => {
      try {
        const body = await c.req.json();
        console.log("Reversal Timeout:", body);
        return c.json(
          {
            ResultCode: 0,
            ResultDesc: "Timeout received",
          },
          200,
        );
      } catch (error: any) {
        console.error("Reversal Timeout error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Processing failed",
          },
          200,
        );
      }
    },

    statusResult: async (c: Context) => {
      try {
        const body = await c.req.json<TransactionStatusCallback>();
        const parsed = client
          .getCallbackHandler()
          .parseTransactionStatusCallback(body);
        console.log("Status Result:", parsed);
        return c.json(
          {
            ResultCode: 0,
            ResultDesc: "Accepted",
          },
          200,
        );
      } catch (error: any) {
        console.error("Status Result error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Processing failed",
          },
          200,
        );
      }
    },

    statusTimeout: async (c: Context) => {
      try {
        const body = await c.req.json();
        console.log("Status Timeout:", body);
        return c.json(
          {
            ResultCode: 0,
            ResultDesc: "Timeout received",
          },
          200,
        );
      } catch (error: any) {
        console.error("Status Timeout error:", error);
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: "Processing failed",
          },
          200,
        );
      }
    },

    stkPush: async (c: Context) => {
      try {
        const {
          amount,
          phoneNumber,
          accountReference,
          transactionDesc,
          callbackUrl,
        } = await c.req.json();

        if (!amount || !phoneNumber) {
          return c.json({ error: "Amount and phone number are required" }, 400);
        }

        const response = await client.stkPush({
          amount: Number(amount),
          phoneNumber: String(phoneNumber),
          accountReference: accountReference || "Payment",
          transactionDesc: transactionDesc || "Payment",
          callbackUrl,
        });

        return c.json(response);
      } catch (error: any) {
        console.error("STK Push error:", error);
        return c.json({ error: error.message || "Request failed" }, 500);
      }
    },

    stkQuery: async (c: Context) => {
      try {
        const { CheckoutRequestID } = await c.req.json();

        if (!CheckoutRequestID) {
          return c.json({ error: "CheckoutRequestID is required" }, 400);
        }

        const response = await client.stkQuery({ CheckoutRequestID });
        return c.json(response);
      } catch (error: any) {
        console.error("STK Query error:", error);
        return c.json({ error: error.message || "Request failed" }, 500);
      }
    },

    b2c: async (c: Context) => {
      try {
        const {
          amount,
          phoneNumber,
          commandID,
          remarks,
          occasion,
          resultUrl,
          timeoutUrl,
        } = await c.req.json();

        if (!amount || !phoneNumber || !commandID) {
          return c.json(
            {
              error: "Amount, phone number, and command ID are required",
            },
            400,
          );
        }

        const response = await client.b2c({
          amount: Number(amount),
          phoneNumber: String(phoneNumber),
          commandID: commandID as any,
          remarks: remarks || "Payment",
          occasion,
          resultUrl,
          timeoutUrl,
        });

        return c.json(response);
      } catch (error: any) {
        console.error("B2C error:", error);
        return c.json({ error: error.message || "Request failed" }, 500);
      }
    },

    b2b: async (c: Context) => {
      try {
        const {
          amount,
          partyB,
          commandID,
          senderIdentifierType,
          receiverIdentifierType,
          accountReference,
          remarks,
          resultUrl,
          timeoutUrl,
        } = await c.req.json();

        console.log("B2B Request Parameters:", {
          amount,
          partyB,
          commandID,
          senderIdentifierType,
          receiverIdentifierType,
          accountReference,
          remarks,
        });

        if (!amount || !partyB || !commandID || !accountReference) {
          return c.json(
            {
              error:
                "Amount, partyB, commandID, and account reference are required",
            },
            400,
          );
        }

        const response = await client.b2b({
          amount: Number(amount),
          partyB: String(partyB),
          commandID: commandID as any,
          senderIdentifierType: senderIdentifierType as any,
          receiverIdentifierType: receiverIdentifierType as any,
          accountReference: String(accountReference),
          remarks: remarks || "Payment",
          resultUrl,
          timeoutUrl,
        });

        console.log("B2B Response:", response);
        return c.json(response);
      } catch (error: any) {
        console.error("B2B error:", error);
        return c.json({ error: error.message || "Request failed" }, 500);
      }
    },

    balance: async (c: Context) => {
      try {
        const body = await c.req.json<AccountBalanceRequest>();
        const response = await client.accountBalance(body);
        return c.json(response);
      } catch (error: any) {
        console.error("Balance error:", error);
        return c.json({ error: error.message || "Request failed" }, 500);
      }
    },

    transactionStatus: async (c: Context) => {
      try {
        const { transactionID } = await c.req.json();

        if (!transactionID) {
          return c.json({ error: "Transaction ID is required" }, 400);
        }

        const body = await c.req.json();
        const response = await client.transactionStatus(body as any);
        return c.json(response);
      } catch (error: any) {
        console.error("Transaction Status error:", error);
        return c.json({ error: error.message || "Request failed" }, 500);
      }
    },

    reversal: async (c: Context) => {
      try {
        const { transactionID, amount } = await c.req.json();

        if (!transactionID || !amount) {
          return c.json(
            { error: "Transaction ID and amount are required" },
            400,
          );
        }

        const body = await c.req.json();
        const response = await client.reversal(body as any);
        return c.json(response);
      } catch (error: any) {
        console.error("Reversal error:", error);
        return c.json({ error: error.message || "Request failed" }, 500);
      }
    },

    registerC2B: async (c: Context) => {
      try {
        const { shortCode, responseType, confirmationURL, validationURL } =
          await c.req.json();

        if (!confirmationURL || !validationURL) {
          return c.json(
            {
              error: "Confirmation URL and validation URL are required",
            },
            400,
          );
        }

        const response = await client.registerC2BUrl({
          shortCode: shortCode as any,
          responseType: responseType as any,
          confirmationURL,
          validationURL,
        });

        return c.json(response);
      } catch (error: any) {
        console.error("Register C2B error:", error);
        return c.json({ error: error.message || "Request failed" }, 500);
      }
    },

    generateQR: async (c: Context) => {
      try {
        const {
          merchantName,
          refNo,
          amount,
          transactionType,
          creditPartyIdentifier,
          size,
        } = await c.req.json();

        if (
          !merchantName ||
          !refNo ||
          !amount ||
          !transactionType ||
          !creditPartyIdentifier
        ) {
          return c.json(
            {
              error:
                "Merchant name, reference number, amount, transaction type, and credit party identifier are required",
              received: await c.req.json(),
            },
            400,
          );
        }

        let qrSize: "300" | "500" | undefined = undefined;
        if (size) {
          if (size !== "500" && size !== "300") {
            return c.json(
              {
                error: "Size must be either '300' or '500'",
              },
              400,
            );
          }
          qrSize = size;
        }

        const response = await client.generateDynamicQR({
          merchantName,
          refNo,
          amount: Number(amount),
          transactionType: transactionType as any,
          creditPartyIdentifier,
          size: qrSize,
        });

        return c.json(response);
      } catch (error: any) {
        console.error("Generate QR error:", error);
        return c.json({ error: error.message || "Request failed" }, 500);
      }
    },
  };

  return handlers;
}
