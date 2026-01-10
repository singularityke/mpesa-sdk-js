export const mockTokenResponse = {
  access_token: "mock_access_token_12345",
  expires_in: "3599",
};

export const mockSTKPushResponse = {
  MerchantRequestID: "29115-34620561-1",
  CheckoutRequestID: "ws_CO_191220191020363925",
  ResponseCode: "0",
  ResponseDescription: "Success. Request accepted for processing",
  CustomerMessage: "Success. Request accepted for processing",
};

export const mockSTKQueryResponse = {
  ResponseCode: "0",
  ResponseDescription: "The service request has been accepted successfully",
  MerchantRequestID: "29115-34620561-1",
  CheckoutRequestID: "ws_CO_191220191020363925",
  ResultCode: "0",
  ResultDesc: "The service request is processed successfully.",
};

export const mockB2CResponse = {
  ConversationID: "AG_20191219_00005797af5d7d75f652",
  OriginatorConversationID: "16740-34861180-1",
  ResponseCode: "0",
  ResponseDescription: "Accept the service request successfully.",
};
