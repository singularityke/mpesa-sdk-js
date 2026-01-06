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
  type C2BSimulateRequest,
} from "@singularity-payments/core";
import type { Context } from "elysia";
import type { MpesaRouteHandlers } from "./types";

export function createMpesaHandlers(client: MpesaClient): MpesaRouteHandlers {
  const handlers: MpesaRouteHandlers = {
    stkCallback: async (ctx: Context) => {
      try {
        const body = ctx.body as STKCallback;
        const ipAddress =
          ctx.request.headers.get("x-forwarded-for") ||
          ctx.request.headers.get("x-real-ip") ||
          undefined;
        const response = await client.handleSTKCallback(body, ipAddress);
        ctx.set.status = 200;
        return response;
      } catch (error: any) {
        console.error("STK Callback error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Internal error processing callback",
        };
      }
    },

    c2bValidation: async (ctx: Context) => {
      try {
        const body = ctx.body as C2BCallback;
        const response = await client.handleC2BValidation(body);
        ctx.set.status = 200;
        return response;
      } catch (error: any) {
        console.error("C2B Validation error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Validation failed",
        };
      }
    },

    c2bConfirmation: async (ctx: Context) => {
      try {
        const body = ctx.body as C2BCallback;
        const response = await client.handleC2BConfirmation(body);
        ctx.set.status = 200;
        return response;
      } catch (error: any) {
        console.error("C2B Confirmation error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    },
    simulateC2B: async (ctx: Context) => {
      try {
        const { shortCode, amount, phoneNumber, billRefNumber, commandID } =
          ctx.body as C2BSimulateRequest;

        if (!amount || !phoneNumber || !billRefNumber) {
          ctx.set.status = 400;
          return {
            error:
              "Amount, phone number, and bill reference number are required",
          };
        }

        const response = await client.simulateC2B({
          shortCode: String(shortCode),
          amount: Number(amount),
          phoneNumber: String(phoneNumber),
          billRefNumber: String(billRefNumber),
          commandID: commandID,
        });

        return response;
      } catch (error: any) {
        console.error("C2B Simulate error:", error);
        ctx.set.status = 500;
        return { error: error.message || "Request failed" };
      }
    },

    b2cResult: async (ctx: Context) => {
      try {
        const body = ctx.body as B2CCallback;
        const response = await client.handleB2CCallback(body);
        ctx.set.status = 200;
        return response;
      } catch (error: any) {
        console.error("B2C Result error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    },

    b2cTimeout: async (ctx: Context) => {
      try {
        const body = ctx.body;
        console.log("B2C Timeout:", body);
        ctx.set.status = 200;
        return {
          ResultCode: 0,
          ResultDesc: "Timeout received",
        };
      } catch (error: any) {
        console.error("B2C Timeout error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    },

    b2bResult: async (ctx: Context) => {
      try {
        const body = ctx.body as B2BCallback;
        const response = await client.handleB2BCallback(body);
        ctx.set.status = 200;
        return response;
      } catch (error: any) {
        console.error("B2B Result error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    },

    b2bTimeout: async (ctx: Context) => {
      try {
        const body = ctx.body;
        console.log("B2B Timeout:", body);
        ctx.set.status = 200;
        return {
          ResultCode: 0,
          ResultDesc: "Timeout received",
        };
      } catch (error: any) {
        console.error("B2B Timeout error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    },

    balanceResult: async (ctx: Context) => {
      try {
        const body = ctx.body as AccountBalanceCallback;
        const response = await client.handleAccountBalanceCallback(body);
        ctx.set.status = 200;
        return response;
      } catch (error: any) {
        console.error("Balance Result error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    },

    balanceTimeout: async (ctx: Context) => {
      try {
        const body = ctx.body;
        console.log("Balance Timeout:", body);
        ctx.set.status = 200;
        return {
          ResultCode: 0,
          ResultDesc: "Timeout received",
        };
      } catch (error: any) {
        console.error("Balance Timeout error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    },

    reversalResult: async (ctx: Context) => {
      try {
        const body = ctx.body as ReversalCallback;
        const response = await client.handleReversalCallback(body);
        ctx.set.status = 200;
        return response;
      } catch (error: any) {
        console.error("Reversal Result error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    },

    reversalTimeout: async (ctx: Context) => {
      try {
        const body = ctx.body;
        console.log("Reversal Timeout:", body);
        ctx.set.status = 200;
        return {
          ResultCode: 0,
          ResultDesc: "Timeout received",
        };
      } catch (error: any) {
        console.error("Reversal Timeout error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    },

    statusResult: async (ctx: Context) => {
      try {
        const body = ctx.body as TransactionStatusCallback;
        const response = await client.handleTransactionStatusCallback(body);
        ctx.set.status = 200;
        return response;
      } catch (error: any) {
        console.error("Status Result error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    },

    statusTimeout: async (ctx: Context) => {
      try {
        const body = ctx.body;
        console.log("Status Timeout:", body);
        ctx.set.status = 200;
        return {
          ResultCode: 0,
          ResultDesc: "Timeout received",
        };
      } catch (error: any) {
        console.error("Status Timeout error:", error);
        ctx.set.status = 200;
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    },

    stkPush: async (ctx: Context) => {
      try {
        const {
          amount,
          phoneNumber,
          accountReference,
          transactionDesc,
          callbackUrl,
        } = ctx.body as any;

        if (!amount || !phoneNumber) {
          ctx.set.status = 400;
          return { error: "Amount and phone number are required" };
        }

        const response = await client.stkPush({
          amount: Number(amount),
          phoneNumber: String(phoneNumber),
          accountReference: accountReference || "Payment",
          transactionDesc: transactionDesc || "Payment",
          callbackUrl,
        });

        return response;
      } catch (error: any) {
        console.error("STK Push error:", error);
        ctx.set.status = 500;
        return { error: error.message || "Request failed" };
      }
    },

    stkQuery: async (ctx: Context) => {
      try {
        const { CheckoutRequestID } = ctx.body as any;

        if (!CheckoutRequestID) {
          ctx.set.status = 400;
          return { error: "CheckoutRequestID is required" };
        }

        const response = await client.stkQuery({ CheckoutRequestID });
        return response;
      } catch (error: any) {
        console.error("STK Query error:", error);
        ctx.set.status = 500;
        return { error: error.message || "Request failed" };
      }
    },

    b2c: async (ctx: Context) => {
      try {
        const {
          amount,
          phoneNumber,
          commandID,
          remarks,
          occasion,
          resultUrl,
          timeoutUrl,
        } = ctx.body as any;

        if (!amount || !phoneNumber || !commandID) {
          ctx.set.status = 400;
          return {
            error: "Amount, phone number, and command ID are required",
          };
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

        return response;
      } catch (error: any) {
        console.error("B2C error:", error);
        ctx.set.status = 500;
        return { error: error.message || "Request failed" };
      }
    },

    b2b: async (ctx: Context) => {
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
        } = ctx.body as any;

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
          ctx.set.status = 400;
          return {
            error:
              "Amount, partyB, commandID, and account reference are required",
          };
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
        return response;
      } catch (error: any) {
        console.error("B2B error:", error);
        ctx.set.status = 500;
        return { error: error.message || "Request failed" };
      }
    },

    balance: async (ctx: Context) => {
      try {
        const response = await client.accountBalance(
          ctx.body as AccountBalanceRequest,
        );
        return response;
      } catch (error: any) {
        console.error("Balance error:", error);
        ctx.set.status = 500;
        return { error: error.message || "Request failed" };
      }
    },

    transactionStatus: async (ctx: Context) => {
      try {
        const { transactionID } = ctx.body as any;

        if (!transactionID) {
          ctx.set.status = 400;
          return { error: "Transaction ID is required" };
        }

        const response = await client.transactionStatus(ctx.body as any);
        return response;
      } catch (error: any) {
        console.error("Transaction Status error:", error);
        ctx.set.status = 500;
        return { error: error.message || "Request failed" };
      }
    },

    reversal: async (ctx: Context) => {
      try {
        const { transactionID, amount } = ctx.body as any;

        if (!transactionID || !amount) {
          ctx.set.status = 400;
          return { error: "Transaction ID and amount are required" };
        }

        const response = await client.reversal(ctx.body as any);
        return response;
      } catch (error: any) {
        console.error("Reversal error:", error);
        ctx.set.status = 500;
        return { error: error.message || "Request failed" };
      }
    },

    registerC2B: async (ctx: Context) => {
      try {
        const { shortCode, responseType, confirmationURL, validationURL } =
          ctx.body as any;

        if (!confirmationURL || !validationURL) {
          ctx.set.status = 400;
          return {
            error: "Confirmation URL and validation URL are required",
          };
        }

        const response = await client.registerC2BUrl({
          shortCode: shortCode as any,
          responseType: responseType as any,
          confirmationURL,
          validationURL,
        });

        return response;
      } catch (error: any) {
        console.error("Register C2B error:", error);
        ctx.set.status = 500;
        return { error: error.message || "Request failed" };
      }
    },

    generateQR: async (ctx: Context) => {
      try {
        const {
          merchantName,
          refNo,
          amount,
          transactionType,
          creditPartyIdentifier,
          size,
        } = ctx.body as any;

        if (
          !merchantName ||
          !refNo ||
          !amount ||
          !transactionType ||
          !creditPartyIdentifier
        ) {
          ctx.set.status = 400;
          return {
            error:
              "Merchant name, reference number, amount, transaction type, and credit party identifier are required",
            received: ctx.body,
          };
        }

        let qrSize: "300" | "500" | undefined = undefined;
        if (size) {
          if (size !== "500" && size !== "300") {
            ctx.set.status = 400;
            return {
              error: "Size must be either '300' or '500'",
            };
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

        return response;
      } catch (error: any) {
        console.error("Generate QR error:", error);
        ctx.set.status = 500;
        return { error: error.message || "Request failed" };
      }
    },
  };

  return handlers;
}
