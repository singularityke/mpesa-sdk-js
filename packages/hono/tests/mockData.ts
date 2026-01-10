import type {
  STKCallback,
  C2BCallback,
  B2CCallback,
  B2BCallback,
  AccountBalanceCallback,
  TransactionStatusCallback,
  ReversalCallback,
} from "@singularity-payments/core";

export const mockSTKCallbackSuccess: STKCallback = {
  Body: {
    stkCallback: {
      MerchantRequestID: "mock-merchant-123",
      CheckoutRequestID: "mock-checkout-456",
      ResultCode: 0,
      ResultDesc: "The service request is processed successfully.",
      CallbackMetadata: {
        Item: [
          { Name: "Amount", Value: 1000 },
          { Name: "MpesaReceiptNumber", Value: "ABC123XYZ" },
          { Name: "TransactionDate", Value: 20250110120000 },
          { Name: "PhoneNumber", Value: 254712345678 },
        ],
      },
    },
  },
};

export const mockSTKCallbackFailure: STKCallback = {
  Body: {
    stkCallback: {
      MerchantRequestID: "mock-merchant-123",
      CheckoutRequestID: "mock-checkout-456",
      ResultCode: 1032,
      ResultDesc: "Request cancelled by user",
    },
  },
};

export const mockC2BCallback: C2BCallback = {
  TransactionType: "Pay Bill",
  TransID: "RI704KI9RW",
  TransTime: "20250110102030",
  TransAmount: "500",
  BusinessShortCode: "600000",
  BillRefNumber: "INV-001",
  InvoiceNumber: "",
  OrgAccountBalance: "",
  ThirdPartyTransID: "",
  MSISDN: "254708374149",
  FirstName: "John",
  MiddleName: "",
  LastName: "Doe",
};

export const mockB2CCallback: B2CCallback = {
  Result: {
    ResultType: 0,
    ResultCode: 0,
    ResultDesc: "The service request is processed successfully.",
    OriginatorConversationID: "mock-originator-123",
    ConversationID: "mock-conversation-456",
    TransactionID: "mock-transaction-789",
    ResultParameters: {
      ResultParameter: [
        { Key: "TransactionAmount", Value: 1000 },
        { Key: "TransactionReceipt", Value: "ABC123" },
        { Key: "B2CRecipientIsRegisteredCustomer", Value: "Y" },
        { Key: "B2CChargesPaidAccountAvailableFunds", Value: 5000 },
        { Key: "ReceiverPartyPublicName", Value: "254712345678 - John Doe" },
        { Key: "TransactionCompletedDateTime", Value: "10.01.2025 12:00:00" },
        { Key: "B2CUtilityAccountAvailableFunds", Value: 10000 },
        { Key: "B2CWorkingAccountAvailableFunds", Value: 20000 },
      ],
    },
  },
};

export const mockB2BCallback: B2BCallback = {
  Result: {
    ResultType: 0,
    ResultCode: 0,
    ResultDesc: "The service request is processed successfully.",
    OriginatorConversationID: "mock-originator-123",
    ConversationID: "mock-conversation-456",
    TransactionID: "mock-transaction-789",
    ResultParameters: {
      ResultParameter: [
        { Key: "InitiatorAccountCurrentBalance", Value: "50000.00" },
        { Key: "DebitAccountCurrentBalance", Value: "45000.00" },
        { Key: "Amount", Value: 5000 },
        {
          Key: "DebitPartyAffectedAccountBalance",
          Value: "Working Account|KES|45000.00|45000.00|0.00|0.00",
        },
        { Key: "TransCompletedTime", Value: 20250110120000 },
        { Key: "DebitPartyCharges", Value: "" },
        { Key: "ReceiverPartyPublicName", Value: "600000 - Test Business" },
        { Key: "Currency", Value: "KES" },
      ],
    },
  },
};

export const mockBalanceCallback: AccountBalanceCallback = {
  Result: {
    ResultType: 0,
    ResultCode: 0,
    ResultDesc: "The service request is processed successfully.",
    OriginatorConversationID: "mock-originator-123",
    ConversationID: "mock-conversation-456",
    TransactionID: "mock-transaction-789",
    ResultParameters: {
      ResultParameter: [
        {
          Key: "AccountBalance",
          Value:
            "Working Account|KES|50000.00|50000.00|0.00|0.00&Float Account|KES|0.00|0.00|0.00|0.00",
        },
        { Key: "BOCompletedTime", Value: 20250110120000 },
      ],
    },
  },
};

export const mockTransactionStatusCallback: TransactionStatusCallback = {
  Result: {
    ResultType: 0,
    ResultCode: 0,
    ResultDesc: "The service request is processed successfully.",
    OriginatorConversationID: "mock-originator-123",
    ConversationID: "mock-conversation-456",
    TransactionID: "mock-transaction-789",
    ResultParameters: {
      ResultParameter: [
        { Key: "ReceiptNo", Value: "ABC123" },
        { Key: "Conversation ID", Value: "AG_20250110_00001234567890" },
        { Key: "FinalisedTime", Value: 20250110120000 },
        { Key: "Amount", Value: 1000 },
        { Key: "TransactionStatus", Value: "Completed" },
        { Key: "ReasonType", Value: "Payment received successfully" },
        { Key: "TransactionReason", Value: "" },
        { Key: "DebitPartyCharges", Value: "" },
        { Key: "DebitAccountType", Value: "Working Account" },
        { Key: "InitiatedTime", Value: 20250110115500 },
        { Key: "OriginatorConversationID", Value: "mock-originator-123" },
        { Key: "CreditPartyName", Value: "254712345678 - John Doe" },
        { Key: "DebitPartyName", Value: "600000 - Test Business" },
      ],
    },
  },
};

export const mockReversalCallback: ReversalCallback = {
  Result: {
    ResultType: 0,
    ResultCode: 0,
    ResultDesc: "The service request is processed successfully.",
    OriginatorConversationID: "mock-originator-123",
    ConversationID: "mock-conversation-456",
    TransactionID: "mock-transaction-789",
  },
};

// Failed callback examples
export const mockB2CCallbackFailure: B2CCallback = {
  Result: {
    ResultType: 0,
    ResultCode: 2001,
    ResultDesc: "The initiator information is invalid.",
    OriginatorConversationID: "mock-originator-123",
    ConversationID: "mock-conversation-456",
    TransactionID: "mock-transaction-789",
  },
};

export const mockB2BCallbackFailure: B2BCallback = {
  Result: {
    ResultType: 0,
    ResultCode: 1,
    ResultDesc: "Insufficient funds in the account.",
    OriginatorConversationID: "mock-originator-123",
    ConversationID: "mock-conversation-456",
    TransactionID: "mock-transaction-789",
  },
};

export const mockBalanceCallbackFailure: AccountBalanceCallback = {
  Result: {
    ResultType: 0,
    ResultCode: 2001,
    ResultDesc: "Invalid initiator credentials.",
    OriginatorConversationID: "mock-originator-123",
    ConversationID: "mock-conversation-456",
    TransactionID: "mock-transaction-789",
  },
};

export const mockTransactionStatusCallbackFailure: TransactionStatusCallback = {
  Result: {
    ResultType: 0,
    ResultCode: 1,
    ResultDesc: "Transaction not found.",
    OriginatorConversationID: "mock-originator-123",
    ConversationID: "mock-conversation-456",
    TransactionID: "mock-transaction-789",
  },
};

export const mockReversalCallbackFailure: ReversalCallback = {
  Result: {
    ResultType: 0,
    ResultCode: 1,
    ResultDesc: "Reversal failed - transaction cannot be reversed.",
    OriginatorConversationID: "mock-originator-123",
    ConversationID: "mock-conversation-456",
    TransactionID: "mock-transaction-789",
  },
};
