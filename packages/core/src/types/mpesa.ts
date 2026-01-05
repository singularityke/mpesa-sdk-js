export interface STKPushRequest {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
  callbackUrl?: string;
}

export interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface TransactionStatusRequest {
  CheckoutRequestID: string;
}

export interface TransactionStatusResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

export interface C2BRegisterRequest {
  shortCode: string;
  responseType: "Completed" | "Cancelled";
  confirmationURL: string;
  validationURL: string;
}

export interface CallbackMetadata {
  Item: Array<{
    Name: string;
    Value: string | number;
  }>;
}

export interface STKCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: CallbackMetadata;
    };
  };
}
export interface C2BCallback {
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber: string;
  InvoiceNumber?: string;
  OrgAccountBalance?: string;
  ThirdPartyTransID?: string;
  MSISDN: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
}

export interface C2BRegisterResponse {
  OriginatorCoversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}
// B2C (Business to Customer) Types
export type B2CCommandID =
  | "BusinessPayment"
  | "SalaryPayment"
  | "PromotionPayment";

export interface B2CRequest {
  amount: number;
  phoneNumber: string;
  commandID: B2CCommandID;
  remarks: string;
  occasion?: string;
  resultUrl?: string;
  timeoutUrl?: string;
}

export interface B2CResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface B2CCallback {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters?: {
      ResultParameter: Array<{
        Key: string;
        Value: string | number;
      }>;
    };
    ReferenceData?: {
      ReferenceItem: {
        Key: string;
        Value: string;
      };
    };
  };
}

export type B2BCommandID =
  | "BusinessPayBill"
  | "BusinessBuyGoods"
  | "DisburseFundsToBusiness"
  | "BusinessToBusinessTransfer"
  | "MerchantToMerchantTransfer";

export interface B2BRequest {
  amount: number;
  partyB: string; // Receiving business shortcode
  commandID: B2BCommandID;
  senderIdentifierType: "1" | "2" | "4"; // 1=MSISDN, 2=Till, 4=Paybill
  receiverIdentifierType: "1" | "2" | "4";
  remarks: string;
  accountReference: string;
  resultUrl?: string;
  timeoutUrl?: string;
}

export interface B2BResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface B2BCallback {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters?: {
      ResultParameter: Array<{
        Key: string;
        Value: string | number;
      }>;
    };
  };
}

export type BalanceIdentifierType = "1" | "2" | "4"; // 1=MSISDN, 2=Till, 4=Paybill

export interface AccountBalanceRequest {
  partyA?: string; // Optional, defaults to config.shortcode
  identifierType?: BalanceIdentifierType; // Optional, defaults to "4"
  remarks?: string;
  resultUrl?: string;
  timeoutUrl?: string;
}

export interface AccountBalanceResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface AccountBalanceCallback {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters?: {
      ResultParameter: Array<{
        Key: string;
        Value: string | number;
      }>;
    };
  };
}

export interface GeneralTransactionStatusRequest {
  transactionID: string;
  partyA?: string; // Optional, defaults to config.shortcode
  identifierType?: "1" | "2" | "4";
  remarks?: string;
  occasion?: string;
  resultUrl?: string;
  timeoutUrl?: string;
}

export interface GeneralTransactionStatusResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface TransactionStatusCallback {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters?: {
      ResultParameter: Array<{
        Key: string;
        Value: string | number;
      }>;
    };
  };
}

export interface ReversalRequest {
  transactionID: string;
  amount: number;
  receiverParty?: string; // Optional, defaults to config.shortcode
  receiverIdentifierType?: "1" | "2" | "4" | "11"; // 11=Shortcode
  remarks?: string;
  occasion?: string;
  resultUrl?: string;
  timeoutUrl?: string;
}

export interface ReversalResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface ReversalCallback {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters?: {
      ResultParameter: Array<{
        Key: string;
        Value: string | number;
      }>;
    };
  };
}

export interface DynamicQRRequest {
  merchantName: string;
  refNo: string;
  amount: number;
  transactionType: "BG" | "WA" | "PB" | "SM"; // BuyGoods, Withdraw, Paybill, SendMoney
  creditPartyIdentifier: string; // Till or Paybill number
  size?: "300" | "500"; // QR code size in pixels
}

export interface DynamicQRResponse {
  ResponseCode: string;
  ResponseDescription: string;
  QRCode: string; // Base64 encoded image
}
export interface C2BSimulateRequest {
  amount: number;
  phoneNumber: string;
  billRefNumber: string;
  commandID?: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
}

export interface C2BSimulateResponse {
  ConversationID: string;
  OriginatorCoversationID: string;
  ResponseDescription: string;
}
