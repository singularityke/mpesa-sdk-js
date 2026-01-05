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
import type { Request, Response } from "express";
import type { MpesaRouteHandlers } from "./types";

export function createMpesaHandlers(client: MpesaClient): MpesaRouteHandlers {
  const handlers: MpesaRouteHandlers = {
    stkCallback: async (req: Request, res: Response) => {
      try {
        const body = req.body as STKCallback;
        const ipAddress =
          req.headers["x-forwarded-for"] ||
          req.headers["x-real-ip"] ||
          req.ip ||
          undefined;
        const response = await client.handleSTKCallback(
          body,
          typeof ipAddress === "string" ? ipAddress : undefined,
        );
        res.status(200).json(response);
      } catch (error: any) {
        console.error("STK Callback error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Internal error processing callback",
        });
      }
    },

    c2bValidation: async (req: Request, res: Response) => {
      try {
        const body = req.body as C2BCallback;
        const response = await client.handleC2BValidation(body);
        res.status(200).json(response);
      } catch (error: any) {
        console.error("C2B Validation error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Validation failed",
        });
      }
    },
    simulateC2B: async (req: Request, res: Response) => {
      try {
        const { amount, phoneNumber, billRefNumber, commandID } =
          req.body as C2BSimulateRequest;

        if (!amount || !phoneNumber || !billRefNumber) {
          res.status(400).json({
            error:
              "Amount, phone number, and bill reference number are required",
          });
          return;
        }

        const response = await client.simulateC2B({
          amount: Number(amount),
          phoneNumber: String(phoneNumber),
          billRefNumber: String(billRefNumber),
          commandID: commandID as any,
        });

        res.json(response);
      } catch (error: any) {
        console.error("C2B Simulate error:", error);
        res.status(500).json({ error: error.message || "Request failed" });
      }
    },

    c2bConfirmation: async (req: Request, res: Response) => {
      try {
        const body = req.body as C2BCallback;
        const response = await client.handleC2BConfirmation(body);
        res.status(200).json(response);
      } catch (error: any) {
        console.error("C2B Confirmation error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    b2cResult: async (req: Request, res: Response) => {
      try {
        const body = req.body as B2CCallback;
        const response = await client.handleB2CCallback(body);
        res.status(200).json(response);
      } catch (error: any) {
        console.error("B2C Result error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    b2cTimeout: async (req: Request, res: Response) => {
      try {
        const body = req.body;
        console.log("B2C Timeout:", body);
        res.status(200).json({
          ResultCode: 0,
          ResultDesc: "Timeout received",
        });
      } catch (error: any) {
        console.error("B2C Timeout error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    b2bResult: async (req: Request, res: Response) => {
      try {
        const body = req.body as B2BCallback;
        const response = await client.handleB2BCallback(body);
        res.status(200).json(response);
      } catch (error: any) {
        console.error("B2B Result error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    b2bTimeout: async (req: Request, res: Response) => {
      try {
        const body = req.body;
        console.log("B2B Timeout:", body);
        res.status(200).json({
          ResultCode: 0,
          ResultDesc: "Timeout received",
        });
      } catch (error: any) {
        console.error("B2B Timeout error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    balanceResult: async (req: Request, res: Response) => {
      try {
        const body = req.body as AccountBalanceCallback;
        const response = await client.handleAccountBalanceCallback(body);
        res.status(200).json(response);
      } catch (error: any) {
        console.error("Balance Result error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    balanceTimeout: async (req: Request, res: Response) => {
      try {
        const body = req.body;
        console.log("Balance Timeout:", body);
        res.status(200).json({
          ResultCode: 0,
          ResultDesc: "Timeout received",
        });
      } catch (error: any) {
        console.error("Balance Timeout error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    reversalResult: async (req: Request, res: Response) => {
      try {
        const body = req.body as ReversalCallback;
        const response = await client.handleReversalCallback(body);
        res.status(200).json(response);
      } catch (error: any) {
        console.error("Reversal Result error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    reversalTimeout: async (req: Request, res: Response) => {
      try {
        const body = req.body;
        console.log("Reversal Timeout:", body);
        res.status(200).json({
          ResultCode: 0,
          ResultDesc: "Timeout received",
        });
      } catch (error: any) {
        console.error("Reversal Timeout error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    statusResult: async (req: Request, res: Response) => {
      try {
        const body = req.body as TransactionStatusCallback;
        const response = await client.handleTransactionStatusCallback(body);
        res.status(200).json(response);
      } catch (error: any) {
        console.error("Status Result error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    statusTimeout: async (req: Request, res: Response) => {
      try {
        const body = req.body;
        console.log("Status Timeout:", body);
        res.status(200).json({
          ResultCode: 0,
          ResultDesc: "Timeout received",
        });
      } catch (error: any) {
        console.error("Status Timeout error:", error);
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    stkPush: async (req: Request, res: Response) => {
      try {
        const {
          amount,
          phoneNumber,
          accountReference,
          transactionDesc,
          callbackUrl,
        } = req.body;

        if (!amount || !phoneNumber) {
          res
            .status(400)
            .json({ error: "Amount and phone number are required" });
          return;
        }

        const response = await client.stkPush({
          amount: Number(amount),
          phoneNumber: String(phoneNumber),
          accountReference: accountReference || "Payment",
          transactionDesc: transactionDesc || "Payment",
          callbackUrl,
        });

        res.json(response);
      } catch (error: any) {
        console.error("STK Push error:", error);
        res.status(500).json({ error: error.message || "Request failed" });
      }
    },

    stkQuery: async (req: Request, res: Response) => {
      try {
        const { CheckoutRequestID } = req.body;

        if (!CheckoutRequestID) {
          res.status(400).json({ error: "CheckoutRequestID is required" });
          return;
        }

        const response = await client.stkQuery({ CheckoutRequestID });
        res.json(response);
      } catch (error: any) {
        console.error("STK Query error:", error);
        res.status(500).json({ error: error.message || "Request failed" });
      }
    },

    b2c: async (req: Request, res: Response) => {
      try {
        const {
          amount,
          phoneNumber,
          commandID,
          remarks,
          occasion,
          resultUrl,
          timeoutUrl,
        } = req.body;

        if (!amount || !phoneNumber || !commandID) {
          res.status(400).json({
            error: "Amount, phone number, and command ID are required",
          });
          return;
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

        res.json(response);
      } catch (error: any) {
        console.error("B2C error:", error);
        res.status(500).json({ error: error.message || "Request failed" });
      }
    },

    b2b: async (req: Request, res: Response) => {
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
        } = req.body;

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
          res.status(400).json({
            error:
              "Amount, partyB, commandID, and account reference are required",
          });
          return;
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
        res.json(response);
      } catch (error: any) {
        console.error("B2B error:", error);
        res.status(500).json({ error: error.message || "Request failed" });
      }
    },

    balance: async (req: Request, res: Response) => {
      try {
        const response = await client.accountBalance(
          req.body as AccountBalanceRequest,
        );
        res.json(response);
      } catch (error: any) {
        console.error("Balance error:", error);
        res.status(500).json({ error: error.message || "Request failed" });
      }
    },

    transactionStatus: async (req: Request, res: Response) => {
      try {
        const { transactionID } = req.body;

        if (!transactionID) {
          res.status(400).json({ error: "Transaction ID is required" });
          return;
        }

        const response = await client.transactionStatus(req.body as any);
        res.json(response);
      } catch (error: any) {
        console.error("Transaction Status error:", error);
        res.status(500).json({ error: error.message || "Request failed" });
      }
    },

    reversal: async (req: Request, res: Response) => {
      try {
        const { transactionID, amount } = req.body;

        if (!transactionID || !amount) {
          res
            .status(400)
            .json({ error: "Transaction ID and amount are required" });
          return;
        }

        const response = await client.reversal(req.body as any);
        res.json(response);
      } catch (error: any) {
        console.error("Reversal error:", error);
        res.status(500).json({ error: error.message || "Request failed" });
      }
    },

    registerC2B: async (req: Request, res: Response) => {
      try {
        const { shortCode, responseType, confirmationURL, validationURL } =
          req.body;

        if (!confirmationURL || !validationURL) {
          res.status(400).json({
            error: "Confirmation URL and validation URL are required",
          });
          return;
        }

        const response = await client.registerC2BUrl({
          shortCode: shortCode as any,
          responseType: responseType as any,
          confirmationURL,
          validationURL,
        });

        res.json(response);
      } catch (error: any) {
        console.error("Register C2B error:", error);
        res.status(500).json({ error: error.message || "Request failed" });
      }
    },

    generateQR: async (req: Request, res: Response) => {
      try {
        const {
          merchantName,
          refNo,
          amount,
          transactionType,
          creditPartyIdentifier,
          size,
        } = req.body;

        if (
          !merchantName ||
          !refNo ||
          !amount ||
          !transactionType ||
          !creditPartyIdentifier
        ) {
          res.status(400).json({
            error:
              "Merchant name, reference number, amount, transaction type, and credit party identifier are required",
            received: req.body,
          });
          return;
        }

        let qrSize: "300" | "500" | undefined = undefined;
        if (size) {
          if (size !== "500" && size !== "300") {
            res.status(400).json({
              error: "Size must be either '300' or '500'",
            });
            return;
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

        res.json(response);
      } catch (error: any) {
        console.error("Generate QR error:", error);
        res.status(500).json({ error: error.message || "Request failed" });
      }
    },
  };

  return handlers;
}
