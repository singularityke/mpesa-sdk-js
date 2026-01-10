import {
  MpesaClient,
  type STKCallback,
  type C2BCallback,
  type B2CCallback,
  type B2BCallback,
  type AccountBalanceCallback,
  type TransactionStatusCallback,
  type ReversalCallback,
  type AccountBalanceRequest,
  C2BSimulateRequest,
} from "@singularity-payments/core";
import {
  defineEventHandler,
  readBody,
  getRequestURL,
  getRequestHeader,
  createError,
} from "h3";
import type { MpesaEventHandlers } from "./types";

/**
 * Create Nuxt/Nitro event handlers for M-Pesa callbacks and client-side API requests
 */
export function createMpesaHandlers(client: MpesaClient): MpesaEventHandlers {
  const handlers = {
    /**
     * STK Push callback handler
     * Handles callbacks from M-Pesa after STK Push requests
     */
    stkCallback: defineEventHandler(async (event) => {
      try {
        const body = await readBody<STKCallback>(event);
        const ipAddress =
          getRequestHeader(event, "x-forwarded-for") ||
          getRequestHeader(event, "x-real-ip") ||
          undefined;
        const response = await client.handleSTKCallback(body, ipAddress);
        return response;
      } catch (error: any) {
        console.error("STK Callback error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Internal error processing callback",
        };
      }
    }),

    /**
     * C2B simulation handler (for testing)
     * Simulates a C2B payment transaction
     */
    simulateC2B: defineEventHandler(async (event) => {
      try {
        const body = await readBody<{
          shortCode?: string;
          amount?: number;
          phoneNumber?: string;
          billRefNumber?: string;
          commandID?: string;
        }>(event);

        const { shortCode, amount, phoneNumber, billRefNumber, commandID } =
          body as C2BSimulateRequest;

        if (!amount || !phoneNumber || !billRefNumber) {
          throw createError({
            statusCode: 400,
            message:
              "Amount, phone number, and bill reference number are required",
          });
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

        // If it's already an H3Error, rethrow it
        if (error.statusCode) {
          throw error;
        }

        throw createError({
          statusCode: 500,
          message: error.message || "Request failed",
        });
      }
    }),

    /**
     * C2B validation handler
     * Validates C2B transactions before they are processed
     */
    c2bValidation: defineEventHandler(async (event) => {
      try {
        const body = await readBody<C2BCallback>(event);
        const response = await client.handleC2BValidation(body);
        return response;
      } catch (error: any) {
        console.error("C2B Validation error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Validation failed",
        };
      }
    }),

    /**
     * C2B confirmation handler
     * Confirms C2B transactions after they are processed
     */
    c2bConfirmation: defineEventHandler(async (event) => {
      try {
        const body = await readBody<C2BCallback>(event);
        const response = await client.handleC2BConfirmation(body);
        return response;
      } catch (error: any) {
        console.error("C2B Confirmation error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    }),

    /**
     * B2C result handler
     * Handles callbacks from M-Pesa after B2C requests
     */
    b2cResult: defineEventHandler(async (event) => {
      try {
        const body = await readBody<B2CCallback>(event);
        const response = await client.handleB2CCallback(body);
        return response;
      } catch (error: any) {
        console.error("B2C Result error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    }),

    /**
     * B2C timeout handler
     * Handles timeout notifications from M-Pesa for B2C requests
     */
    b2cTimeout: defineEventHandler(async (event) => {
      try {
        const body = await readBody(event);
        console.log("B2C Timeout:", body);

        return {
          ResultCode: 0,
          ResultDesc: "Timeout received",
        };
      } catch (error: any) {
        console.error("B2C Timeout error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    }),

    /**
     * B2B result handler
     * Handles callbacks from M-Pesa after B2B requests
     */
    b2bResult: defineEventHandler(async (event) => {
      try {
        const body = await readBody<B2BCallback>(event);
        const response = await client.handleB2BCallback(body);
        return response;
      } catch (error: any) {
        console.error("B2B Result error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    }),

    /**
     * B2B timeout handler
     * Handles timeout notifications from M-Pesa for B2B requests
     */
    b2bTimeout: defineEventHandler(async (event) => {
      try {
        const body = await readBody(event);
        console.log("B2B Timeout:", body);

        return {
          ResultCode: 0,
          ResultDesc: "Timeout received",
        };
      } catch (error: any) {
        console.error("B2B Timeout error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    }),

    /**
     * Account balance result handler
     * Handles callbacks from M-Pesa after balance query requests
     */
    balanceResult: defineEventHandler(async (event) => {
      try {
        const body = await readBody<AccountBalanceCallback>(event);
        const response = await client.handleAccountBalanceCallback(body);
        return response;
      } catch (error: any) {
        console.error("Balance Result error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    }),

    /**
     * Account balance timeout handler
     * Handles timeout notifications from M-Pesa for balance queries
     */
    balanceTimeout: defineEventHandler(async (event) => {
      try {
        const body = await readBody(event);
        console.log("Balance Timeout:", body);

        return {
          ResultCode: 0,
          ResultDesc: "Timeout received",
        };
      } catch (error: any) {
        console.error("Balance Timeout error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    }),

    /**
     * Transaction status result handler
     * Handles callbacks from M-Pesa after status query requests
     */
    statusResult: defineEventHandler(async (event) => {
      try {
        const body = await readBody<TransactionStatusCallback>(event);
        const response = await client.handleTransactionStatusCallback(body);
        return response;
      } catch (error: any) {
        console.error("Status Result error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    }),

    /**
     * Transaction status timeout handler
     * Handles timeout notifications from M-Pesa for status queries
     */
    statusTimeout: defineEventHandler(async (event) => {
      try {
        const body = await readBody(event);
        console.log("Status Timeout:", body);

        return {
          ResultCode: 0,
          ResultDesc: "Timeout received",
        };
      } catch (error: any) {
        console.error("Status Timeout error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    }),

    /**
     * Reversal result handler
     * Handles callbacks from M-Pesa after reversal requests
     */
    reversalResult: defineEventHandler(async (event) => {
      try {
        const body = await readBody<ReversalCallback>(event);
        const response = await client.handleReversalCallback(body);
        return response;
      } catch (error: any) {
        console.error("Reversal Result error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    }),

    /**
     * Reversal timeout handler
     * Handles timeout notifications from M-Pesa for reversal requests
     */
    reversalTimeout: defineEventHandler(async (event) => {
      try {
        const body = await readBody(event);
        console.log("Reversal Timeout:", body);

        return {
          ResultCode: 0,
          ResultDesc: "Timeout received",
        };
      } catch (error: any) {
        console.error("Reversal Timeout error:", error);
        return {
          ResultCode: 1,
          ResultDesc: "Processing failed",
        };
      }
    }),

    /**
     * Catch-all handler for all M-Pesa webhooks and client-side API requests
     * Routes based on URL path segment
     */
    catchAll: defineEventHandler(async (event) => {
      const url = getRequestURL(event);
      const pathname = url.pathname;
      const segments = pathname.split("/").filter(Boolean);
      const lastSegment = segments[segments.length - 1];

      try {
        // STK Push callback from M-Pesa
        if (lastSegment === "callback" || lastSegment === "stk-callback") {
          const body = await readBody<STKCallback>(event);
          const ipAddress =
            getRequestHeader(event, "x-forwarded-for") ||
            getRequestHeader(event, "x-real-ip") ||
            undefined;
          const response = await client.handleSTKCallback(body, ipAddress);
          return response;
        }

        // C2B validation callback from M-Pesa
        if (lastSegment === "validation" || lastSegment === "c2b-validation") {
          const body = await readBody<C2BCallback>(event);
          const response = await client.handleC2BValidation(body);
          return response;
        }

        // C2B confirmation callback from M-Pesa
        if (
          lastSegment === "confirmation" ||
          lastSegment === "c2b-confirmation"
        ) {
          const body = await readBody<C2BCallback>(event);
          const response = await client.handleC2BConfirmation(body);
          return response;
        }

        // B2C callbacks
        if (lastSegment === "b2c-result") {
          const body = await readBody<B2CCallback>(event);
          const response = await client.handleB2CCallback(body);
          return response;
        }

        if (lastSegment === "b2c-timeout") {
          const body = await readBody(event);
          console.log("B2C Timeout:", body);
          return { ResultCode: 0, ResultDesc: "Timeout received" };
        }

        // B2B callbacks
        if (lastSegment === "b2b-result") {
          const body = await readBody<B2BCallback>(event);
          const response = await client.handleB2BCallback(body);
          return response;
        }

        if (lastSegment === "b2b-timeout") {
          const body = await readBody(event);
          console.log("B2B Timeout:", body);
          return { ResultCode: 0, ResultDesc: "Timeout received" };
        }

        // Account balance callbacks
        if (lastSegment === "balance-result") {
          const body = await readBody<AccountBalanceCallback>(event);
          const response = await client.handleAccountBalanceCallback(body);
          return response;
        }

        if (lastSegment === "balance-timeout") {
          const body = await readBody(event);
          console.log("Balance Timeout:", body);
          return { ResultCode: 0, ResultDesc: "Timeout received" };
        }

        // Transaction status callbacks
        if (lastSegment === "status-result") {
          const body = await readBody<TransactionStatusCallback>(event);
          const response = await client.handleTransactionStatusCallback(body);
          return response;
        }

        if (lastSegment === "status-timeout") {
          const body = await readBody(event);
          console.log("Status Timeout:", body);
          return { ResultCode: 0, ResultDesc: "Timeout received" };
        }

        // Reversal callbacks
        if (lastSegment === "reversal-result") {
          const body = await readBody<ReversalCallback>(event);
          const response = await client.handleReversalCallback(body);
          return response;
        }

        if (lastSegment === "reversal-timeout") {
          const body = await readBody(event);
          console.log("Reversal Timeout:", body);
          return { ResultCode: 0, ResultDesc: "Timeout received" };
        }

        // CLIENT API HANDLERS (FROM THE FRONTEND)

        // Initiate STK Push request to M-Pesa
        if (lastSegment === "stk-push") {
          const body = await readBody<{
            amount?: number;
            phoneNumber?: string;
            accountReference?: string;
            transactionDesc?: string;
            callbackUrl?: string;
          }>(event);

          const {
            amount,
            phoneNumber,
            accountReference,
            transactionDesc,
            callbackUrl,
          } = body;

          // Validate required fields
          if (!amount || !phoneNumber) {
            throw createError({
              statusCode: 400,
              message: "Amount and phone number are required",
            });
          }

          // Call M-Pesa STK Push API
          const response = await client.stkPush({
            amount: Number(amount),
            phoneNumber: String(phoneNumber),
            accountReference: accountReference || "Payment",
            transactionDesc: transactionDesc || "Payment",
            callbackUrl,
          });

          return response;
        }

        if (lastSegment === "simulate-c2b") {
          const body = await readBody<{
            shortCode?: string;
            amount?: number;
            phoneNumber?: string;
            billRefNumber?: string;
            commandID?: string;
          }>(event);
          const { shortCode, amount, phoneNumber, billRefNumber, commandID } =
            body as C2BSimulateRequest;

          // Validate required fields
          if (!amount || !phoneNumber || !billRefNumber) {
            throw createError({
              statusCode: 400,
              message:
                "Amount, phone number, and bill reference number are required",
            });
          }

          // Call M-Pesa C2B Simulate API
          const response = await client.simulateC2B({
            shortCode: String(shortCode),
            amount: Number(amount),
            phoneNumber: String(phoneNumber),
            billRefNumber,
            commandID,
          });

          return response;
        }

        // Query STK Push transaction status
        if (lastSegment === "stk-query") {
          const body = await readBody<{ CheckoutRequestID?: string }>(event);
          const { CheckoutRequestID } = body;

          // Validate required field
          if (!CheckoutRequestID) {
            throw createError({
              statusCode: 400,
              message: "CheckoutRequestID is required",
            });
          }

          // Call M-Pesa STK Query API
          const response = await client.stkQuery({ CheckoutRequestID });
          return response;
        }

        // B2C - Business to Customer payment
        if (lastSegment === "b2c") {
          const body = await readBody<{
            amount?: number;
            phoneNumber?: string;
            commandID?: string;
            remarks?: string;
            occasion?: string;
            resultUrl?: string;
            timeoutUrl?: string;
          }>(event);

          const {
            amount,
            phoneNumber,
            commandID,
            remarks,
            occasion,
            resultUrl,
            timeoutUrl,
          } = body;

          if (!amount || !phoneNumber || !commandID) {
            throw createError({
              statusCode: 400,
              message: "Amount, phone number, and command ID are required",
            });
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
        }

        // B2B - Business to Business payment
        if (lastSegment === "b2b") {
          const body = await readBody<{
            amount?: number;
            partyB?: string;
            commandID?: string;
            senderIdentifierType?: string;
            receiverIdentifierType?: string;
            accountReference?: string;
            remarks?: string;
            resultUrl?: string;
            timeoutUrl?: string;
          }>(event);

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
          } = body;

          if (!amount || !partyB || !commandID || !accountReference) {
            throw createError({
              statusCode: 400,
              message:
                "Amount, partyB, commandID, and account reference are required",
            });
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

          return response;
        }

        // Query account balance
        if (lastSegment === "balance") {
          const body = await readBody<AccountBalanceRequest>(event);
          const response = await client.accountBalance(body);
          return response;
        }

        // Query transaction status
        if (lastSegment === "transaction-status") {
          const body = await readBody<{
            transactionID?: string;
            partyA?: string;
            identifierType?: string;
            remarks?: string;
            occasion?: string;
            resultUrl?: string;
            timeoutUrl?: string;
          }>(event);

          const { transactionID } = body;

          if (!transactionID) {
            throw createError({
              statusCode: 400,
              message: "Transaction ID is required",
            });
          }

          const response = await client.transactionStatus(body as any);
          return response;
        }

        // Reverse a transaction
        if (lastSegment === "reversal") {
          const body = await readBody<{
            transactionID?: string;
            amount?: number;
            receiverParty?: string;
            receiverIdentifierType?: string;
            remarks?: string;
            occasion?: string;
            resultUrl?: string;
            timeoutUrl?: string;
          }>(event);

          const { transactionID, amount } = body;

          if (!transactionID || !amount) {
            throw createError({
              statusCode: 400,
              message: "Transaction ID and amount are required",
            });
          }

          const response = await client.reversal(body as any);
          return response;
        }

        // Register C2B URLs
        if (lastSegment === "register-c2b") {
          const body = await readBody<{
            shortCode?: string;
            responseType?: string;
            confirmationURL?: string;
            validationURL?: string;
          }>(event);

          const { shortCode, responseType, confirmationURL, validationURL } =
            body;

          if (!confirmationURL || !validationURL) {
            throw createError({
              statusCode: 400,
              message: "Confirmation URL and validation URL are required",
            });
          }

          const response = await client.registerC2BUrl({
            shortCode: shortCode as any,
            responseType: responseType as any,
            confirmationURL,
            validationURL,
          });

          return response;
        }

        // Generate dynamic QR code
        if (lastSegment === "generate-qr") {
          const body = await readBody<{
            merchantName?: string;
            refNo?: string;
            amount?: number;
            transactionType?: string;
            creditPartyIdentifier?: string;
            size?: string;
          }>(event);

          const {
            merchantName,
            refNo,
            amount,
            transactionType,
            creditPartyIdentifier,
            size,
          } = body;

          // Check required fields
          if (
            !merchantName ||
            !refNo ||
            !amount ||
            !transactionType ||
            !creditPartyIdentifier
          ) {
            throw createError({
              statusCode: 400,
              message:
                "Merchant name, reference number, amount, transaction type, and credit party identifier are required",
            });
          }

          // Make sure the size is valid
          let qrSize: "300" | "500" | undefined = undefined;
          if (size) {
            if (size !== "500" && size !== "300") {
              throw createError({
                statusCode: 400,
                message: "Size must be either '300' or '500'",
              });
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
        }

        throw createError({
          statusCode: 404,
          message: `Unknown endpoint: ${lastSegment}`,
        });
      } catch (error: any) {
        console.error(`M-Pesa ${lastSegment} error:`, error);

        // If it's already an H3Error, rethrow it
        if (error.statusCode) {
          throw error;
        }

        throw createError({
          statusCode: 500,
          message: error.message || "Request failed",
        });
      }
    }),
  };

  return handlers;
}
