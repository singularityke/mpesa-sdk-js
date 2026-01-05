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
import type { FastifyRequest, FastifyReply } from "fastify";
import type { MpesaRouteHandlers } from "./types";

export function createMpesaHandlers(client: MpesaClient): MpesaRouteHandlers {
  const handlers: MpesaRouteHandlers = {
    stkCallback: async (req: FastifyRequest, reply: FastifyReply) => {
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
        reply.status(200).send(response);
      } catch (error: any) {
        console.error("STK Callback error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Internal error processing callback",
        });
      }
    },
    simulateC2B: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { amount, phoneNumber, billRefNumber, commandID } =
          req.body as C2BSimulateRequest;

        if (!amount || !phoneNumber || !billRefNumber) {
          reply.status(400).send({
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

        reply.send(response);
      } catch (error: any) {
        console.error("C2B Simulate error:", error);
        reply.status(500).send({ error: error.message || "Request failed" });
      }
    },

    c2bValidation: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body as C2BCallback;
        const response = await client.handleC2BValidation(body);
        reply.status(200).send(response);
      } catch (error: any) {
        console.error("C2B Validation error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Validation failed",
        });
      }
    },

    c2bConfirmation: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body as C2BCallback;
        const response = await client.handleC2BConfirmation(body);
        reply.status(200).send(response);
      } catch (error: any) {
        console.error("C2B Confirmation error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    b2cResult: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body as B2CCallback;
        const response = await client.handleB2CCallback(body);
        reply.status(200).send(response);
      } catch (error: any) {
        console.error("B2C Result error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    b2cTimeout: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body;
        console.log("B2C Timeout:", body);
        reply.status(200).send({
          ResultCode: 0,
          ResultDesc: "Timeout received",
        });
      } catch (error: any) {
        console.error("B2C Timeout error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    b2bResult: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body as B2BCallback;
        const response = await client.handleB2BCallback(body);
        reply.status(200).send(response);
      } catch (error: any) {
        console.error("B2B Result error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    b2bTimeout: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body;
        console.log("B2B Timeout:", body);
        reply.status(200).send({
          ResultCode: 0,
          ResultDesc: "Timeout received",
        });
      } catch (error: any) {
        console.error("B2B Timeout error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    balanceResult: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body as AccountBalanceCallback;
        const response = await client.handleAccountBalanceCallback(body);
        reply.status(200).send(response);
      } catch (error: any) {
        console.error("Balance Result error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    balanceTimeout: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body;
        console.log("Balance Timeout:", body);
        reply.status(200).send({
          ResultCode: 0,
          ResultDesc: "Timeout received",
        });
      } catch (error: any) {
        console.error("Balance Timeout error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    reversalResult: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body as ReversalCallback;
        const response = await client.handleReversalCallback(body);
        reply.status(200).send(response);
      } catch (error: any) {
        console.error("Reversal Result error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    reversalTimeout: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body;
        console.log("Reversal Timeout:", body);
        reply.status(200).send({
          ResultCode: 0,
          ResultDesc: "Timeout received",
        });
      } catch (error: any) {
        console.error("Reversal Timeout error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    statusResult: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body as TransactionStatusCallback;
        const response = await client.handleTransactionStatusCallback(body);
        reply.status(200).send(response);
      } catch (error: any) {
        console.error("Status Result error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    statusTimeout: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = req.body;
        console.log("Status Timeout:", body);
        reply.status(200).send({
          ResultCode: 0,
          ResultDesc: "Timeout received",
        });
      } catch (error: any) {
        console.error("Status Timeout error:", error);
        reply.status(200).send({
          ResultCode: 1,
          ResultDesc: "Processing failed",
        });
      }
    },

    stkPush: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const {
          amount,
          phoneNumber,
          accountReference,
          transactionDesc,
          callbackUrl,
        } = req.body as any;

        if (!amount || !phoneNumber) {
          reply
            .status(400)
            .send({ error: "Amount and phone number are required" });
          return;
        }

        const response = await client.stkPush({
          amount: Number(amount),
          phoneNumber: String(phoneNumber),
          accountReference: accountReference || "Payment",
          transactionDesc: transactionDesc || "Payment",
          callbackUrl,
        });

        reply.send(response);
      } catch (error: any) {
        console.error("STK Push error:", error);
        reply.status(500).send({ error: error.message || "Request failed" });
      }
    },

    stkQuery: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { CheckoutRequestID } = req.body as any;

        if (!CheckoutRequestID) {
          reply.status(400).send({ error: "CheckoutRequestID is required" });
          return;
        }

        const response = await client.stkQuery({ CheckoutRequestID });
        reply.send(response);
      } catch (error: any) {
        console.error("STK Query error:", error);
        reply.status(500).send({ error: error.message || "Request failed" });
      }
    },

    b2c: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const {
          amount,
          phoneNumber,
          commandID,
          remarks,
          occasion,
          resultUrl,
          timeoutUrl,
        } = req.body as any;

        if (!amount || !phoneNumber || !commandID) {
          reply.status(400).send({
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

        reply.send(response);
      } catch (error: any) {
        console.error("B2C error:", error);
        reply.status(500).send({ error: error.message || "Request failed" });
      }
    },

    b2b: async (req: FastifyRequest, reply: FastifyReply) => {
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
        } = req.body as any;

        if (!amount || !partyB || !commandID || !accountReference) {
          reply.status(400).send({
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

        reply.send(response);
      } catch (error: any) {
        console.error("B2B error:", error);
        reply.status(500).send({ error: error.message || "Request failed" });
      }
    },

    balance: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const response = await client.accountBalance(
          req.body as AccountBalanceRequest,
        );
        reply.send(response);
      } catch (error: any) {
        console.error("Balance error:", error);
        reply.status(500).send({ error: error.message || "Request failed" });
      }
    },

    transactionStatus: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { transactionID } = req.body as any;

        if (!transactionID) {
          reply.status(400).send({ error: "Transaction ID is required" });
          return;
        }

        const response = await client.transactionStatus(req.body as any);
        reply.send(response);
      } catch (error: any) {
        console.error("Transaction Status error:", error);
        reply.status(500).send({ error: error.message || "Request failed" });
      }
    },

    reversal: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { transactionID, amount } = req.body as any;

        if (!transactionID || !amount) {
          reply
            .status(400)
            .send({ error: "Transaction ID and amount are required" });
          return;
        }

        const response = await client.reversal(req.body as any);
        reply.send(response);
      } catch (error: any) {
        console.error("Reversal error:", error);
        reply.status(500).send({ error: error.message || "Request failed" });
      }
    },

    registerC2B: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { shortCode, responseType, confirmationURL, validationURL } =
          req.body as any;

        if (!confirmationURL || !validationURL) {
          reply.status(400).send({
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

        reply.send(response);
      } catch (error: any) {
        console.error("Register C2B error:", error);
        reply.status(500).send({ error: error.message || "Request failed" });
      }
    },

    generateQR: async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const {
          merchantName,
          refNo,
          amount,
          transactionType,
          creditPartyIdentifier,
          size,
        } = req.body as any;

        if (
          !merchantName ||
          !refNo ||
          !amount ||
          !transactionType ||
          !creditPartyIdentifier
        ) {
          reply.status(400).send({
            error:
              "Merchant name, reference number, amount, transaction type, and credit party identifier are required",
          });
          return;
        }

        let qrSize: "300" | "500" | undefined = undefined;
        if (size) {
          if (size !== "500" && size !== "300") {
            reply.status(400).send({
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

        reply.send(response);
      } catch (error: any) {
        console.error("Generate QR error:", error);
        reply.status(500).send({ error: error.message || "Request failed" });
      }
    },
  };

  return handlers;
}
