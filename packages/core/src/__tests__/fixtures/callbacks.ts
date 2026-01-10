import { STKCallback, C2BCallback, B2CCallback } from "../../types/mpesa";

export const successfulSTKCallback: STKCallback = {
  Body: {
    stkCallback: {
      MerchantRequestID: "mock-merchant-123",
      CheckoutRequestID: "mock-checkout-456",
      ResultCode: 0,
      ResultDesc: "The service request is processed successfully.",
      CallbackMetadata: {
        Item: [
          { Name: "Amount", Value: 1000 },
          { Name: "MpesaReceiptNumber", Value: "NLJ7RT61SV" },
          { Name: "TransactionDate", Value: 20251222144900 },
          { Name: "PhoneNumber", Value: 254712345678 },
        ],
      },
    },
  },
};

export const failedSTKCallback: STKCallback = {
  Body: {
    stkCallback: {
      MerchantRequestID: "mock-merchant-789",
      CheckoutRequestID: "mock-checkout-012",
      ResultCode: 1,
      ResultDesc: "Insufficient funds in M-Pesa account",
    },
  },
};

export const cancelledSTKCallback: STKCallback = {
  Body: {
    stkCallback: {
      MerchantRequestID: "mock-merchant-345",
      CheckoutRequestID: "mock-checkout-678",
      ResultCode: 1032,
      ResultDesc: "Request cancelled by user",
    },
  },
};

export const mockC2BCallback: C2BCallback = {
  TransactionType: "Pay Bill",
  TransID: "RI704KI9RW",
  TransTime: "20190629102111",
  TransAmount: "1000",
  BusinessShortCode: "600000",
  BillRefNumber: "account123",
  MSISDN: "254708374149",
  FirstName: "John",
  MiddleName: "K",
  LastName: "Doe",
};

export const mockB2CCallback: B2CCallback = {
  Result: {
    ResultType: 0,
    ResultCode: 0,
    ResultDesc: "The service request is processed successfully.",
    OriginatorConversationID: "orig-123",
    ConversationID: "conv-456",
    TransactionID: "trans-789",
    ResultParameters: {
      ResultParameter: [
        { Key: "TransactionReceipt", Value: "NLJ7RT61SV" },
        { Key: "TransactionAmount", Value: 5000 },
        { Key: "ReceiverPartyPublicName", Value: "254712345678 - John Doe" },
        { Key: "B2CChargesPaidAccountAvailableFunds", Value: 50 },
      ],
    },
  },
};
