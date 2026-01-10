import type { RequestEvent } from "@sveltejs/kit";

export interface RouteHandler {
  POST: (event: RequestEvent) => Promise<Response>;
}

export interface MpesaRouteHandlers {
  stkCallback: RouteHandler;
  simulateC2B: RouteHandler;
  c2bValidation: RouteHandler;
  c2bConfirmation: RouteHandler;
  b2cResult: RouteHandler;
  b2cTimeout: RouteHandler;
  b2bResult: RouteHandler;
  b2bTimeout: RouteHandler;
  balanceResult: RouteHandler;
  balanceTimeout: RouteHandler;
  transactionStatusResult: RouteHandler;
  transactionStatusTimeout: RouteHandler;
  reversalResult: RouteHandler;
  reversalTimeout: RouteHandler;
  catchAll: RouteHandler;
}
