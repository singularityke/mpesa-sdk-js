import { vi, Mock } from "vitest";

export function mockFetchSuccess(data: any, status = 200): Mock {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    headers: new Headers(),
  }) as Mock;
}

export function mockFetchError(status: number, errorData: any): Mock {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => errorData,
    headers: new Headers(),
  }) as Mock;
}

export function mockFetchNetworkError(errorMessage = "Network error"): Mock {
  return vi.fn().mockRejectedValue(new Error(errorMessage)) as Mock;
}

export function mockFetchTimeout(): Mock {
  return vi.fn().mockImplementation(() => {
    const error: any = new Error("The operation was aborted");
    error.name = "AbortError";
    return Promise.reject(error);
  }) as Mock;
}
