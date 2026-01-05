import type { Context } from "elysia";

export interface MpesaRouteHandler {
  (ctx: Context): Promise<any>;
}

export interface MpesaRouteHandlers {
  stkCallback: MpesaRouteHandler;
  c2bValidation: MpesaRouteHandler;
  c2bConfirmation: MpesaRouteHandler;
  b2cResult: MpesaRouteHandler;
  b2cTimeout: MpesaRouteHandler;
  b2bResult: MpesaRouteHandler;
  b2bTimeout: MpesaRouteHandler;
  balanceResult: MpesaRouteHandler;
  balanceTimeout: MpesaRouteHandler;
  reversalResult: MpesaRouteHandler;
  reversalTimeout: MpesaRouteHandler;
  statusResult: MpesaRouteHandler;
  statusTimeout: MpesaRouteHandler;
  stkPush: MpesaRouteHandler;
  stkQuery: MpesaRouteHandler;
  b2c: MpesaRouteHandler;
  b2b: MpesaRouteHandler;
  balance: MpesaRouteHandler;
  transactionStatus: MpesaRouteHandler;
  reversal: MpesaRouteHandler;
  registerC2B: MpesaRouteHandler;
  generateQR: MpesaRouteHandler;
  simulateC2B: MpesaRouteHandler;
}
