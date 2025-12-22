export class MpesaError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any,
  ) {
    super(message);
    this.name = "MpesaError";
    Object.setPrototypeOf(this, MpesaError.prototype);
  }
}
export class MpesaAuthError extends MpesaError {
  constructor(message: string, details?: any) {
    super(message, "AUTH_ERROR", 401, details);
    this.name = "MpesaAuthError";
    Object.setPrototypeOf(this, MpesaAuthError.prototype);
  }
}
export class MpesaValidationError extends MpesaError {
  constructor(message: string, details?: any) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "MpesaValidationError";
    Object.setPrototypeOf(this, MpesaValidationError.prototype);
  }
}
export class MpesaNetworkError extends MpesaError {
  constructor(
    message: string,
    public isRetryable: boolean,
    details?: any,
  ) {
    super(message, "NETWORK_ERROR", 503, details);
    this.name = "MpesaNetworkError";
    Object.setPrototypeOf(this, MpesaNetworkError.prototype);
  }
}
export class MpesaTimeoutError extends MpesaError {
  constructor(message: string, details?: any) {
    super(message, "TIMEOUT_ERROR", 408, details);
    this.name = "MpesaTimeoutError";
    Object.setPrototypeOf(this, MpesaTimeoutError.prototype);
  }
}
export class MpesaRateLimitError extends MpesaError {
  constructor(
    message: string,
    public retryAfter?: number,
    details?: any,
  ) {
    super(message, "RATE_LIMIT_ERROR", 429, details);
    this.name = "MpesaRateLimitError";
    Object.setPrototypeOf(this, MpesaRateLimitError.prototype);
  }
}
export class MpesaApiError extends MpesaError {
  constructor(
    message: string,
    code: string,
    statusCode: number,
    public responseBody?: any,
  ) {
    super(message, code, statusCode, responseBody);
    this.name = "MpesaApiError";
    Object.setPrototypeOf(this, MpesaApiError.prototype);
  }
}
/**
 * Parse m-pesa API error response
 */
export function parseMpesaApiError(
  statusCode: number,
  responseBody: any,
): MpesaError {
  const errorMessage =
    responseBody?.errorMessage ||
    responseBody?.ResponseDescription ||
    responseBody?.message ||
    "Unknown API error";

  const errorCode =
    responseBody?.errorCode || responseBody?.ResponseCode || "UNKNOWN_ERROR";

  if (statusCode === 401 || statusCode === 403) {
    return new MpesaAuthError(errorMessage, responseBody);
  }

  if (statusCode === 400) {
    return new MpesaValidationError(errorMessage, responseBody);
  }

  if (statusCode === 429) {
    const retryAfter = responseBody?.retryAfter;
    return new MpesaRateLimitError(errorMessage, retryAfter, responseBody);
  }

  if (statusCode >= 500) {
    return new MpesaNetworkError(errorMessage, true, responseBody);
  }

  return new MpesaApiError(errorMessage, errorCode, statusCode, responseBody);
}
