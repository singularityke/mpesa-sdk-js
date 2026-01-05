import type { Context } from "hono";

export interface MpesaHandler {
  (c: Context): Promise<Response>;
}

export interface MpesaRouteHandlers {
  stkCallback: MpesaHandler;
  c2bValidation: MpesaHandler;
  c2bConfirmation: MpesaHandler;
  b2cResult: MpesaHandler;
  b2cTimeout: MpesaHandler;
  b2bResult: MpesaHandler;
  b2bTimeout: MpesaHandler;
  balanceResult: MpesaHandler;
  balanceTimeout: MpesaHandler;
  reversalResult: MpesaHandler;
  reversalTimeout: MpesaHandler;
  statusResult: MpesaHandler;
  statusTimeout: MpesaHandler;
  stkPush: MpesaHandler;
  stkQuery: MpesaHandler;
  b2c: MpesaHandler;
  b2b: MpesaHandler;
  balance: MpesaHandler;
  transactionStatus: MpesaHandler;
  reversal: MpesaHandler;
  registerC2B: MpesaHandler;
  generateQR: MpesaHandler;
  simulateC2B: MpesaHandler;
}
