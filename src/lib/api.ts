import type { ApiResponse } from "@/types";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new ApiError(json.error || "Request failed", res.status);
  }

  return json.data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),

  post: <T>(url: string, body?: unknown, extraHeaders?: Record<string, string>) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body), headers: extraHeaders }),

  put: <T>(url: string, body?: unknown, extraHeaders?: Record<string, string>) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body), headers: extraHeaders }),

  del: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "DELETE",
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),

  upload: <T>(url: string, formData: FormData) =>
    request<T>(url, {
      method: "POST",
      headers: {}, // let browser set content-type for FormData
      body: formData,
    }),
};

export { ApiError };
