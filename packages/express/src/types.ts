import type { Request, Response, NextFunction } from "express";

export interface MpesaMiddleware {
  (req: Request, res: Response, next: NextFunction): Promise<void>;
}

export interface MpesaRouteHandlers {
  stkCallback: MpesaMiddleware;
  c2bValidation: MpesaMiddleware;
  c2bConfirmation: MpesaMiddleware;
  b2cResult: MpesaMiddleware;
  b2cTimeout: MpesaMiddleware;
  b2bResult: MpesaMiddleware;
  b2bTimeout: MpesaMiddleware;
  balanceResult: MpesaMiddleware;
  balanceTimeout: MpesaMiddleware;
  reversalResult: MpesaMiddleware;
  reversalTimeout: MpesaMiddleware;
  statusResult: MpesaMiddleware;
  statusTimeout: MpesaMiddleware;
  stkPush: MpesaMiddleware;
  stkQuery: MpesaMiddleware;
  b2c: MpesaMiddleware;
  b2b: MpesaMiddleware;
  balance: MpesaMiddleware;
  transactionStatus: MpesaMiddleware;
  reversal: MpesaMiddleware;
  registerC2B: MpesaMiddleware;
  generateQR: MpesaMiddleware;
  simulateC2B: MpesaMiddleware;
}
