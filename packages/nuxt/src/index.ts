import { MpesaClient } from "@singularity-payments/core";
import type {
  MpesaConfig,
  MpesaClientOptions,
} from "@singularity-payments/core";
import { createMpesaHandlers } from "./handlers";

export { createMpesaHandlers };
export * from "./types";
export type {
  MpesaConfig,
  MpesaClientOptions,
} from "@singularity-payments/core";

/**
 * Create M-Pesa instance for Nuxt
 *
 * @example
 * ```typescript
 * // utils/mpesa.ts
 * import { createMpesa } from "@singularity-payments/nuxt";
 *
 * export const mpesa = createMpesa({
 *   consumerKey: process.env.MPESA_CONSUMER_KEY!,
 *   consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
 *   passkey: process.env.MPESA_PASSKEY!,
 *   shortcode: process.env.MPESA_SHORTCODE!,
 *   environment: "sandbox",
 *   callbackUrl: `${process.env.NUXT_PUBLIC_APP_URL}/api/mpesa/callback`
 * }, {
 *   callbackOptions: {
 *     onSuccess: async (data) => {
 *       console.log("Payment successful:", data);
 *       // Save to database
 *     },
 *     onFailure: async (data) => {
 *       console.log("Payment failed:", data);
 *     }
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // server/api/mpesa/[...mpesa].ts
 * import { mpesa } from "~/utils/mpesa";
 *
 * export default mpesa.handlers.catchAll;
 * ```
 */
export function createMpesa(config: MpesaConfig, options?: MpesaClientOptions) {
  const client = new MpesaClient(config, options);
  const handlers = createMpesaHandlers(client);

  return {
    /**
     * M-Pesa client instance for making API calls
     */
    client,
    /**
     * Pre-configured Nuxt event handlers for M-Pesa callbacks
     */
    handlers,
  };
}

/**
 * Re-export core types and classes for convenience
 */
export {
  MpesaClient,
  type STKPushRequest,
  type STKPushResponse,
  type TransactionStatusRequest,
  type TransactionStatusResponse,
  type C2BRegisterRequest,
  type C2BRegisterResponse,
  type STKCallback,
  type C2BCallback,
  type ParsedCallbackData,
  type ParsedC2BCallback,
} from "@singularity-payments/core";
