import type { RequestEvent } from "@sveltejs/kit";

export interface RouteHandler {
  POST: (event: RequestEvent) => Promise<Response>;
}

export interface MpesaRouteHandlers {
  stkCallback: RouteHandler;
  c2bValidation: RouteHandler;
  c2bConfirmation: RouteHandler;
  b2cResult: RouteHandler;
  b2cTimeout: RouteHandler;
  catchAll: RouteHandler;
}
