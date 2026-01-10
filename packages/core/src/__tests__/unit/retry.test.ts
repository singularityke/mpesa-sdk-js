import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { retryWithBackoff } from "../../utils/retry";
import { MpesaNetworkError, MpesaRateLimitError } from "../../utils/errors";

describe("retryWithBackoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should succeed on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("success");

    const result = await retryWithBackoff(fn);

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on retryable errors", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new MpesaNetworkError("Network error", true))
      .mockResolvedValue("success");

    const result = await retryWithBackoff(fn, { maxRetries: 3 });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should not retry on non-retryable errors", async () => {
    const error = new Error("Fatal error");
    const fn = vi.fn().mockRejectedValue(error);

    await expect(retryWithBackoff(fn)).rejects.toThrow("Fatal error");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry up to maxRetries", async () => {
    const error = new MpesaNetworkError("Network error", true);
    const fn = vi.fn().mockRejectedValue(error);

    await expect(retryWithBackoff(fn, { maxRetries: 2 })).rejects.toThrow(
      "Network error",
    );

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should call onRetry callback", async () => {
    const onRetry = vi.fn();
    const error = new MpesaNetworkError("Network error", true);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue("success");

    await retryWithBackoff(fn, { maxRetries: 2, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(error, 1);
  });

  it("should respect rate limit retry-after", async () => {
    vi.useFakeTimers();

    const error = new MpesaRateLimitError("Rate limited", 2);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue("success");

    const promise = retryWithBackoff(fn, { maxRetries: 2 });

    await vi.advanceTimersByTimeAsync(2000);

    const result = await promise;
    expect(result).toBe("success");

    vi.useRealTimers();
  });

  it("should retry on network errors", async () => {
    const error = new MpesaNetworkError("Service unavailable", true);

    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue("success");

    const result = await retryWithBackoff(fn, {
      maxRetries: 2,
    });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
