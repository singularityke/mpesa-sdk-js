import { MpesaConfig } from "../types/config";
import {
  MpesaAuthError,
  MpesaNetworkError,
  MpesaTimeoutError,
  parseMpesaApiError,
} from "./errors";
import { retryWithBackoff } from "./retry";

const ENDPOINTS = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
};

interface TokenResponse {
  access_token: string;
  expires_in: string;
}

export class MpesaAuth {
  private config: MpesaConfig;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  constructor(config: MpesaConfig) {
    this.config = config;
  }

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    return retryWithBackoff(
      async () => {
        const baseUrl = ENDPOINTS[this.config.environment];
        const auth = Buffer.from(
          `${this.config.consumerKey}:${this.config.consumerSecret}`,
        ).toString("base64");

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.REQUEST_TIMEOUT,
        );

        try {
          const response = await fetch(
            `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
            {
              headers: {
                Authorization: `Basic ${auth}`,
              },
              signal: controller.signal,
            },
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw parseMpesaApiError(response.status, errorBody);
          }

          const data = (await response.json()) as TokenResponse;

          if (!data.access_token) {
            throw new MpesaAuthError("No access token in response", data);
          }

          this.token = data.access_token;
          // Token expires in 1 hour(3600 seconds), cache for 50 minutes to be safe
          this.tokenExpiry = Date.now() + 50 * 60 * 1000;

          return this.token;
        } catch (error: any) {
          clearTimeout(timeoutId);

          if (error.name === "AbortError") {
            throw new MpesaTimeoutError(
              "Request timed out while getting access token",
            );
          }

          if (error instanceof MpesaAuthError) {
            throw error;
          }

          // Network errors
          throw new MpesaNetworkError(
            `Failed to get access token: ${error.message}`,
            true,
            error,
          );
        }
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        onRetry: (error, attempt) => {
          console.warn(
            `Retrying authentication (attempt ${attempt}):`,
            error.message,
          );
        },
      },
    );
  }

  getBaseUrl(): string {
    return ENDPOINTS[this.config.environment];
  }

  getPassword(): string {
    const timestamp = this.getTimestamp();
    const password = Buffer.from(
      `${this.config.shortcode}${this.config.passkey}${timestamp}`,
    ).toString("base64");
    return password;
  }

  getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}
