import type { EventHandler } from "h3";

export type MpesaEventHandler = EventHandler;

export interface MpesaEventHandlers {
  stkCallback: MpesaEventHandler;
  c2bValidation: MpesaEventHandler;
  c2bConfirmation: MpesaEventHandler;
  b2cResult: MpesaEventHandler;
  b2cTimeout: MpesaEventHandler;
  catchAll: MpesaEventHandler;
  simulateC2B: MpesaEventHandler;
}
