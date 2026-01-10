import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RateLimiter } from "../../utils/ratelimiter";
import { MpesaRateLimitError } from "../../utils/errors";

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    rateLimiter?.destroy();
  });

  it("should allow requests within limit", async () => {
    rateLimiter = new RateLimiter({
      maxRequests: 3,
      windowMs: 1000,
    });

    await expect(rateLimiter.checkLimit("test")).resolves.toBeUndefined();
    await expect(rateLimiter.checkLimit("test")).resolves.toBeUndefined();
    await expect(rateLimiter.checkLimit("test")).resolves.toBeUndefined();
  });

  it("should throw error when limit exceeded", async () => {
    rateLimiter = new RateLimiter({
      maxRequests: 2,
      windowMs: 1000,
    });

    await rateLimiter.checkLimit("test");
    await rateLimiter.checkLimit("test");

    await expect(rateLimiter.checkLimit("test")).rejects.toThrow(
      MpesaRateLimitError,
    );
  });

  it("should reset after window expires", async () => {
    vi.useFakeTimers();

    rateLimiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 1000,
    });

    await rateLimiter.checkLimit("test");

    await expect(rateLimiter.checkLimit("test")).rejects.toThrow();

    vi.advanceTimersByTime(1001);

    await expect(rateLimiter.checkLimit("test")).resolves.toBeUndefined();

    vi.useRealTimers();
  });

  it("should track usage correctly", async () => {
    rateLimiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
    });

    await rateLimiter.checkLimit("test");
    await rateLimiter.checkLimit("test");

    const usage = rateLimiter.getUsage("test");

    expect(usage.count).toBe(2);
    expect(usage.remaining).toBe(3);
  });

  it("should handle different keys independently", async () => {
    rateLimiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 1000,
    });

    await rateLimiter.checkLimit("key1");
    await rateLimiter.checkLimit("key2");

    expect(rateLimiter.getUsage("key1").count).toBe(1);
    expect(rateLimiter.getUsage("key2").count).toBe(1);
  });

  it("should reset specific key", async () => {
    rateLimiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 1000,
    });

    await rateLimiter.checkLimit("test");
    rateLimiter.reset("test");

    await expect(rateLimiter.checkLimit("test")).resolves.toBeUndefined();
  });

  it("should reset all keys", async () => {
    rateLimiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 1000,
    });

    await rateLimiter.checkLimit("key1");
    await rateLimiter.checkLimit("key2");

    rateLimiter.resetAll();

    await expect(rateLimiter.checkLimit("key1")).resolves.toBeUndefined();
    await expect(rateLimiter.checkLimit("key2")).resolves.toBeUndefined();
  });
});
