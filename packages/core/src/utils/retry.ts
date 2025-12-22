import { MpesaError, MpesaNetworkError, MpesaRateLimitError } from "./errors";

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  onRetry: () => {},
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableStatusCodes: number[]): boolean {
  if (error instanceof MpesaNetworkError) {
    return error.isRetryable;
  }

  if (error instanceof MpesaRateLimitError) {
    return true;
  }

  if (error instanceof MpesaError && error.statusCode) {
    return retryableStatusCodes.includes(error.statusCode);
  }

  // Network errors without status codes
  if (
    error.name === "FetchError" ||
    error.code === "ECONNREFUSED" ||
    error.code === "ETIMEDOUT"
  ) {
    return true;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  options: Required<RetryOptions>,
  error?: any,
): number {
  // If rate limited, use the retry-after header
  if (error instanceof MpesaRateLimitError && error.retryAfter) {
    return error.retryAfter * 1000; // Convert to ms
  }

  const delay = Math.min(
    options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt),
    options.maxDelayMs,
  );

  // Add jitter (±20%) to prevent retrying all at the same time
  const jitter = delay * 0.2 * (Math.random() - 0.5) * 2;
  return Math.floor(delay + jitter);
}

/**
 * Sleep for specified ms
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if not retryable or max retries reached
      if (
        !isRetryableError(error, opts.retryableStatusCodes) ||
        attempt === opts.maxRetries
      ) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts, error);
      opts.onRetry(error, attempt + 1);

      await sleep(delay);
    }
  }

  throw lastError!;
}
