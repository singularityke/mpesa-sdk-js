import type { EventHandler } from "h3";

export type MpesaEventHandler = EventHandler;

export interface MpesaEventHandlers {
  stkCallback: MpesaEventHandler;
  c2bValidation: MpesaEventHandler;
  c2bConfirmation: MpesaEventHandler;
  b2cResult: MpesaEventHandler;
  b2cTimeout: MpesaEventHandler;
  b2bResult: MpesaEventHandler;
  b2bTimeout: MpesaEventHandler;
  balanceResult: MpesaEventHandler;
  balanceTimeout: MpesaEventHandler;
  statusResult: MpesaEventHandler;
  statusTimeout: MpesaEventHandler;
  reversalResult: MpesaEventHandler;
  reversalTimeout: MpesaEventHandler;
  catchAll: MpesaEventHandler;
  simulateC2B: MpesaEventHandler;
}
