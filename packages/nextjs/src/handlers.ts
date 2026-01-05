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
  C2BSimulateRequest,
} from "@singularity-payments/core";
import { NextRequest, NextResponse } from "next/server";
import type { MpesaRouteHandlers } from "./types";

/**
 * Create Next.js route handlers for M-Pesa callbacks and client-side API requests
 */
export function createMpesaHandlers(client: MpesaClient): MpesaRouteHandlers {
  const handlers = {
    /**
     * STK Push callback handler
     * Handles callbacks from M-Pesa after STK Push requests
     */
    stkCallback: {
      POST: async (request: NextRequest) => {
        try {
          const body = (await request.json()) as STKCallback;
          const ipAddress =
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            undefined;
          const response = await client.handleSTKCallback(body, ipAddress);
          return NextResponse.json(response, { status: 200 });
        } catch (error: any) {
          console.error("STK Callback error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Internal error processing callback",
            },
            { status: 200 },
          );
        }
      },
    },
    /**
     * C2B simulation handler (for testing)
     * Simulates a C2B payment transaction
     */
    simulateC2B: {
      POST: async (request: NextRequest) => {
        try {
          const body = (await request.json()) as {
            amount?: number;
            phoneNumber?: string;
            billRefNumber?: string;
            commandID?: string;
          };

          const { amount, phoneNumber, billRefNumber, commandID } =
            body as C2BSimulateRequest;

          if (!amount || !phoneNumber || !billRefNumber) {
            return NextResponse.json(
              {
                error:
                  "Amount, phone number, and bill reference number are required",
              },
              { status: 400 },
            );
          }

          const response = await client.simulateC2B({
            amount: Number(amount),
            phoneNumber: String(phoneNumber),
            billRefNumber: String(billRefNumber),
            commandID: commandID,
          });

          return NextResponse.json(response);
        } catch (error: any) {
          console.error("C2B Simulate error:", error);
          return NextResponse.json(
            { error: error.message || "Request failed" },
            { status: 500 },
          );
        }
      },
    },

    /**
     * C2B validation handler
     * Validates C2B transactions before they are processed
     */
    c2bValidation: {
      POST: async (request: NextRequest) => {
        try {
          const body = (await request.json()) as C2BCallback;
          const response = await client.handleC2BValidation(body);
          return NextResponse.json(response, { status: 200 });
        } catch (error: any) {
          console.error("C2B Validation error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Validation failed",
            },
            { status: 200 },
          );
        }
      },
    },

    /**
     * C2B confirmation handler
     * Confirms C2B transactions after they are processed
     */
    c2bConfirmation: {
      POST: async (request: NextRequest) => {
        try {
          const body = (await request.json()) as C2BCallback;
          const response = await client.handleC2BConfirmation(body);
          return NextResponse.json(response, { status: 200 });
        } catch (error: any) {
          console.error("C2B Confirmation error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Processing failed",
            },
            { status: 200 },
          );
        }
      },
    },

    /**
     * B2C result handler
     * Handles callbacks from M-Pesa after B2C requests
     */
    b2cResult: {
      POST: async (request: NextRequest) => {
        try {
          const body = (await request.json()) as B2CCallback;
          const parsed = client.getCallbackHandler().parseB2CCallback(body);

          console.log("B2C Result:", parsed);

          return NextResponse.json(
            {
              ResultCode: 0,
              ResultDesc: "Accepted",
            },
            { status: 200 },
          );
        } catch (error: any) {
          console.error("B2C Result error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Processing failed",
            },
            { status: 200 },
          );
        }
      },
    },
    /**
     * B2B result handler
     * Handles callbacks from M-Pesa after B2B requests
     */
    b2bResult: {
      POST: async (request: NextRequest) => {
        try {
          const body = (await request.json()) as B2BCallback;
          const response = await client.handleB2BCallback(body);
          return NextResponse.json(response, { status: 200 });
        } catch (error: any) {
          console.error("B2B Result error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Processing failed",
            },
            { status: 200 },
          );
        }
      },
    },

    /**
     * B2B timeout handler
     * Handles timeout notifications from M-Pesa for B2B requests
     */
    b2bTimeout: {
      POST: async (request: NextRequest) => {
        try {
          const body = await request.json();
          console.log("B2B Timeout:", body);
          return NextResponse.json(
            {
              ResultCode: 0,
              ResultDesc: "Timeout received",
            },
            { status: 200 },
          );
        } catch (error: any) {
          console.error("B2B Timeout error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Processing failed",
            },
            { status: 200 },
          );
        }
      },
    },

    /**
     * Account Balance result handler
     * Handles callbacks from M-Pesa after balance query requests
     */
    balanceResult: {
      POST: async (request: NextRequest) => {
        try {
          const body = (await request.json()) as AccountBalanceCallback;
          const response = await client.handleAccountBalanceCallback(body);
          return NextResponse.json(response, { status: 200 });
        } catch (error: any) {
          console.error("Balance Result error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Processing failed",
            },
            { status: 200 },
          );
        }
      },
    },

    /**
     * Account Balance timeout handler
     * Handles timeout notifications from M-Pesa for balance queries
     */
    balanceTimeout: {
      POST: async (request: NextRequest) => {
        try {
          const body = await request.json();
          console.log("Balance Timeout:", body);
          return NextResponse.json(
            {
              ResultCode: 0,
              ResultDesc: "Timeout received",
            },
            { status: 200 },
          );
        } catch (error: any) {
          console.error("Balance Timeout error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Processing failed",
            },
            { status: 200 },
          );
        }
      },
    },

    /**
     * Transaction Status result handler
     * Handles callbacks from M-Pesa after transaction status queries
     */
    transactionStatusResult: {
      POST: async (request: NextRequest) => {
        try {
          const body = (await request.json()) as TransactionStatusCallback;
          const response = await client.handleTransactionStatusCallback(body);
          return NextResponse.json(response, { status: 200 });
        } catch (error: any) {
          console.error("Transaction Status Result error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Processing failed",
            },
            { status: 200 },
          );
        }
      },
    },

    /**
     * Transaction Status timeout handler
     * Handles timeout notifications from M-Pesa for status queries
     */
    transactionStatusTimeout: {
      POST: async (request: NextRequest) => {
        try {
          const body = await request.json();
          console.log("Transaction Status Timeout:", body);
          return NextResponse.json(
            {
              ResultCode: 0,
              ResultDesc: "Timeout received",
            },
            { status: 200 },
          );
        } catch (error: any) {
          console.error("Transaction Status Timeout error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Processing failed",
            },
            { status: 200 },
          );
        }
      },
    },

    /**
     * Reversal result handler
     * Handles callbacks from M-Pesa after reversal requests
     */
    reversalResult: {
      POST: async (request: NextRequest) => {
        try {
          const body = (await request.json()) as ReversalCallback;
          const response = await client.handleReversalCallback(body);
          return NextResponse.json(response, { status: 200 });
        } catch (error: any) {
          console.error("Reversal Result error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Processing failed",
            },
            { status: 200 },
          );
        }
      },
    },

    /**
     * Reversal timeout handler
     * Handles timeout notifications from M-Pesa for reversal requests
     */
    reversalTimeout: {
      POST: async (request: NextRequest) => {
        try {
          const body = await request.json();
          console.log("Reversal Timeout:", body);
          return NextResponse.json(
            {
              ResultCode: 0,
              ResultDesc: "Timeout received",
            },
            { status: 200 },
          );
        } catch (error: any) {
          console.error("Reversal Timeout error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Processing failed",
            },
            { status: 200 },
          );
        }
      },
    },

    /**
     * B2C timeout handler
     * Handles timeout notifications from M-Pesa for B2C requests
     */
    b2cTimeout: {
      POST: async (request: NextRequest) => {
        try {
          const body = await request.json();
          console.log("B2C Timeout:", body);

          return NextResponse.json(
            {
              ResultCode: 0,
              ResultDesc: "Timeout received",
            },
            { status: 200 },
          );
        } catch (error: any) {
          console.error("B2C Timeout error:", error);
          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: "Processing failed",
            },
            { status: 200 },
          );
        }
      },
    },

    /**
     * Catch-all handler for all M-Pesa webhooks and client-side API requests
     * Routes based on URL path segment
     *
     * Usage: app/api/mpesa/[...mpesa]/route.ts
     * export const { POST } = mpesa.handlers.catchAll;
     *
     * Supported endpoints:
     *
     * WEBHOOKS (from M-Pesa):
     * - /api/mpesa/callback or /api/mpesa/stk-callback - STK Push callbacks
     * - /api/mpesa/validation or /api/mpesa/c2b-validation - C2B validation
     * - /api/mpesa/confirmation or /api/mpesa/c2b-confirmation - C2B confirmation
     * - /api/mpesa/b2c-result - B2C result callback
     * - /api/mpesa/b2c-timeout - B2C timeout callback
     * - /api/mpesa/b2b-result - B2B result callback
     * - /api/mpesa/b2b-timeout - B2B timeout callback
     * - /api/mpesa/balance-result - Account balance result
     * - /api/mpesa/balance-timeout - Account balance timeout
     * - /api/mpesa/reversal-result - Reversal result
     * - /api/mpesa/reversal-timeout - Reversal timeout
     * - /api/mpesa/status-result - Transaction status result
     * - /api/mpesa/status-timeout - Transaction status timeout
     *
     * CLIENT APIs (from the frontend package, will recode react soon):
     * - /api/mpesa/stk-push - Initiate STK Push request
     * - /api/mpesa/stk-query - Query STK Push status
     * - /api/mpesa/b2c - Initiate B2C payment
     * - /api/mpesa/b2b - Initiate B2B payment
     * - /api/mpesa/balance - Query account balance
     * - /api/mpesa/transaction-status - Query transaction status
     * - /api/mpesa/reversal - Reverse a transaction
     * - /api/mpesa/register-c2b - Register C2B URLs
     * - /api/mpesa/generate-qr - Generate dynamic QR code
     */
    catchAll: {
      POST: async (request: NextRequest) => {
        const pathname = request.nextUrl.pathname;
        const segments = pathname.split("/").filter(Boolean);
        const lastSegment = segments[segments.length - 1];

        try {
          // STK Push callback from M-Pesa
          if (lastSegment === "callback" || lastSegment === "stk-callback") {
            return handlers.stkCallback.POST(request);
          }

          // C2B validation callback from M-Pesa
          if (
            lastSegment === "validation" ||
            lastSegment === "c2b-validation"
          ) {
            return handlers.c2bValidation.POST(request);
          }

          // C2B confirmation callback from M-Pesa
          if (
            lastSegment === "confirmation" ||
            lastSegment === "c2b-confirmation"
          ) {
            return handlers.c2bConfirmation.POST(request);
          }

          // B2C callbacks
          if (lastSegment === "b2c-result") {
            return handlers.b2cResult.POST(request);
          }

          if (lastSegment === "b2c-timeout") {
            return handlers.b2cTimeout.POST(request);
          }

          // B2B callbacks
          if (lastSegment === "b2b-result") {
            return handlers.b2bResult.POST(request);
          }

          if (lastSegment === "b2b-timeout") {
            return handlers.b2bTimeout.POST(request);
          }

          // Account balance callbacks
          if (lastSegment === "balance-result") {
            return handlers.balanceResult.POST(request);
          }

          if (lastSegment === "balance-timeout") {
            return handlers.balanceTimeout.POST(request);
          }

          // Transaction status callbacks
          if (lastSegment === "status-result") {
            return handlers.transactionStatusResult.POST(request);
          }

          if (lastSegment === "status-timeout") {
            return handlers.transactionStatusTimeout.POST(request);
          }

          // Reversal callbacks
          if (lastSegment === "reversal-result") {
            return handlers.reversalResult.POST(request);
          }

          if (lastSegment === "reversal-timeout") {
            return handlers.reversalTimeout.POST(request);
          }

          //CLIENT API HANDLERS (FROM THE FRONTEND PACKAGE)

          // Initiate STK Push request to M-Pesa
          if (lastSegment === "stk-push") {
            const body = (await request.json()) as {
              amount?: number;
              phoneNumber?: string;
              accountReference?: string;
              transactionDesc?: string;
              callbackUrl?: string;
            };

            const {
              amount,
              phoneNumber,
              accountReference,
              transactionDesc,
              callbackUrl,
            } = body;

            // Validate required fields
            if (!amount || !phoneNumber) {
              return NextResponse.json(
                { error: "Amount and phone number are required" },
                { status: 400 },
              );
            }

            // Call M-Pesa STK Push API
            const response = await client.stkPush({
              amount: Number(amount),
              phoneNumber: String(phoneNumber),
              accountReference: accountReference || "Payment",
              transactionDesc: transactionDesc || "Payment",
              callbackUrl,
            });

            return NextResponse.json(response);
          }
          if (lastSegment === "simulate-c2b") {
            const body = (await request.json()) as C2BSimulateRequest;
            const { amount, phoneNumber, billRefNumber, commandID } = body;

            // Validate required fields
            if (!amount || !phoneNumber || !billRefNumber) {
              return NextResponse.json(
                {
                  error:
                    "Amount, phone number, and bill reference number are required",
                },
                { status: 400 },
              );
            }

            // Call M-Pesa C2B Simulate API
            const response = await client.simulateC2B({
              amount: Number(amount),
              phoneNumber: String(phoneNumber),
              billRefNumber,
              commandID,
            });

            return NextResponse.json(response);
          }

          // Query STK Push transaction status
          if (lastSegment === "stk-query") {
            const body = (await request.json()) as {
              CheckoutRequestID?: string;
            };
            const { CheckoutRequestID } = body;

            // Validate required field
            if (!CheckoutRequestID) {
              return NextResponse.json(
                { error: "CheckoutRequestID is required" },
                { status: 400 },
              );
            }

            // Call M-Pesa STK Query API
            const response = await client.stkQuery({ CheckoutRequestID });
            return NextResponse.json(response);
          }

          // B2C - Business to Customer payment
          if (lastSegment === "b2c") {
            const body = (await request.json()) as {
              amount?: number;
              phoneNumber?: string;
              commandID?: string;
              remarks?: string;
              occasion?: string;
              resultUrl?: string;
              timeoutUrl?: string;
            };

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
              return NextResponse.json(
                { error: "Amount, phone number, and command ID are required" },
                { status: 400 },
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

            return NextResponse.json(response);
          }

          // B2B - Business to Business payment
          if (lastSegment === "b2b") {
            const body = (await request.json()) as {
              amount?: number;
              partyB?: string;
              commandID?: string;
              senderIdentifierType?: string;
              receiverIdentifierType?: string;
              accountReference?: string;
              remarks?: string;
              resultUrl?: string;
              timeoutUrl?: string;
            };

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
              return NextResponse.json(
                {
                  error:
                    "Amount, partyB, commandID, and account reference are required",
                },
                { status: 400 },
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

            return NextResponse.json(response);
          }

          // Query account balance
          if (lastSegment === "balance") {
            const body = (await request.json()) as {
              partyA?: string;
              identifierType?: string;
              remarks?: string;
              resultUrl?: string;
              timeoutUrl?: string;
            };

            const response = await client.accountBalance(
              body as AccountBalanceRequest,
            );
            return NextResponse.json(response);
          }

          // Query transaction status
          if (lastSegment === "transaction-status") {
            const body = (await request.json()) as {
              transactionID?: string;
              partyA?: string;
              identifierType?: string;
              remarks?: string;
              occasion?: string;
              resultUrl?: string;
              timeoutUrl?: string;
            };

            const { transactionID } = body;

            if (!transactionID) {
              return NextResponse.json(
                { error: "Transaction ID is required" },
                { status: 400 },
              );
            }

            const response = await client.transactionStatus(body as any);
            return NextResponse.json(response);
          }

          // Reverse a transaction
          if (lastSegment === "reversal") {
            const body = (await request.json()) as {
              transactionID?: string;
              amount?: number;
              receiverParty?: string;
              receiverIdentifierType?: string;
              remarks?: string;
              occasion?: string;
              resultUrl?: string;
              timeoutUrl?: string;
            };

            const { transactionID, amount } = body;

            if (!transactionID || !amount) {
              return NextResponse.json(
                { error: "Transaction ID and amount are required" },
                { status: 400 },
              );
            }

            const response = await client.reversal(body as any);
            return NextResponse.json(response);
          }

          // Register C2B URLs
          if (lastSegment === "register-c2b") {
            const body = (await request.json()) as {
              shortCode?: string;
              responseType?: string;
              confirmationURL?: string;
              validationURL?: string;
            };

            const { shortCode, responseType, confirmationURL, validationURL } =
              body;

            if (!confirmationURL || !validationURL) {
              return NextResponse.json(
                { error: "Confirmation URL and validation URL are required" },
                { status: 400 },
              );
            }

            const response = await client.registerC2BUrl({
              shortCode: shortCode as any,
              responseType: responseType as any,
              confirmationURL,
              validationURL,
            });

            return NextResponse.json(response);
          }

          // Generate dynamic QR code
          if (lastSegment === "generate-qr") {
            const body = (await request.json()) as {
              merchantName?: string;
              refNo?: string;
              amount?: number;
              transactionType?: string;
              creditPartyIdentifier?: string;
              size?: string;
            };

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
              return NextResponse.json(
                {
                  error:
                    "Merchant name, reference number, amount, transaction type, and credit party identifier are required",
                  received: body,
                },
                { status: 400 },
              );
            }

            // Make sure the size is the valid ones
            let qrSize: "300" | "500" | undefined = undefined;
            if (size) {
              if (size !== "500" && size !== "300") {
                return NextResponse.json(
                  {
                    error: "Size must be either '300' or '500'",
                  },
                  { status: 400 },
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

            return NextResponse.json(response);
          }

          return NextResponse.json(
            {
              ResultCode: 1,
              ResultDesc: `Unknown endpoint: ${lastSegment}`,
            },
            { status: 404 },
          );
        } catch (error: any) {
          console.error(`M-Pesa ${lastSegment} error:`, error);
          return NextResponse.json(
            { error: error.message || "Request failed" },
            { status: 500 },
          );
        }
      },
    },
  };

  return handlers;
}
