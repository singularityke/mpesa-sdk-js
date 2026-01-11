import type {
  STKPushResponse,
  TransactionStatusResponse,
  C2BSimulateResponse,
  B2CResponse,
  B2BResponse,
  AccountBalanceResponse,
  GeneralTransactionStatusResponse,
  ReversalResponse,
  C2BRegisterResponse,
  DynamicQRResponse,
} from "@singularity-payments/core";

export const mockSTKPushResponse: STKPushResponse = {
  MerchantRequestID: "mock-merchant-123",
  CheckoutRequestID: "mock-checkout-456",
  ResponseCode: "0",
  ResponseDescription: "Success. Request accepted for processing",
  CustomerMessage: "Success. Request accepted for processing",
};

export const mockSTKQueryResponse: TransactionStatusResponse = {
  ResponseCode: "0",
  ResponseDescription: "The service request has been accepted successfully",
  MerchantRequestID: "mock-merchant-123",
  CheckoutRequestID: "mock-checkout-456",
  ResultCode: "0",
  ResultDesc: "The service request is processed successfully.",
};

export const mockC2BSimulateResponse: C2BSimulateResponse = {
  ConversationID: "AG_20250111_00001234567890",
  OriginatorCoversationID: "mock-originator-123",
  ResponseDescription: "Accept the service request successfully.",
};

export const mockB2CResponse: B2CResponse = {
  ConversationID: "AG_20250111_00001234567890",
  OriginatorConversationID: "mock-originator-123",
  ResponseCode: "0",
  ResponseDescription: "Accept the service request successfully.",
};

export const mockB2BResponse: B2BResponse = {
  ConversationID: "AG_20250111_00001234567890",
  OriginatorConversationID: "mock-originator-123",
  ResponseCode: "0",
  ResponseDescription: "Accept the service request successfully.",
};

export const mockAccountBalanceResponse: AccountBalanceResponse = {
  ConversationID: "AG_20250111_00001234567890",
  OriginatorConversationID: "mock-originator-123",
  ResponseCode: "0",
  ResponseDescription: "Accept the service request successfully.",
};

export const mockTransactionStatusResponse: GeneralTransactionStatusResponse = {
  ConversationID: "AG_20250111_00001234567890",
  OriginatorConversationID: "mock-originator-123",
  ResponseCode: "0",
  ResponseDescription: "Accept the service request successfully.",
};

export const mockReversalResponse: ReversalResponse = {
  ConversationID: "AG_20250111_00001234567890",
  OriginatorConversationID: "mock-originator-123",
  ResponseCode: "0",
  ResponseDescription: "Accept the service request successfully.",
};

export const mockC2BRegisterResponse: C2BRegisterResponse = {
  OriginatorCoversationID: "mock-originator-123",
  ResponseCode: "0",
  ResponseDescription: "Success",
};

export const mockDynamicQRResponse: DynamicQRResponse = {
  ResponseCode: "00",
  ResponseDescription: "The service request is processed successfully.",
  QRCode: "iVBORw0KGgoAAAANSUhEUgAAASwAAAEsAQAAAABRBrPYAAAB",
};

export const mockErrorResponse = {
  error: "Request failed",
};

export const mockNetworkError = new Error("Network error");

export const mockAPIError = {
  error: "Invalid credentials",
};

export const mockSTKPushErrorResponse = {
  error: "Invalid phone number format",
};

export const mockInsufficientFundsError = {
  error: "Insufficient funds in the account",
};

export const mockAuthenticationError = {
  errorMessage: "Authentication failed - invalid credentials",
};

export const mockInvalidTransactionError = {
  error: "Transaction not found",
};

export const mockTimeoutError = {
  error: "Request timeout - please try again",
};
