import { beforeEach, vi } from "vitest";

global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});
