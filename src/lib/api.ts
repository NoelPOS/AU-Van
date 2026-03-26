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
  const headers = new Headers(options?.headers);
  const isFormData = options?.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const raw = await res.text();
  let json: ApiResponse<T> | null = null;

  if (raw) {
    try {
      json = JSON.parse(raw) as ApiResponse<T>;
    } catch {
      const snippet = raw.slice(0, 180).replace(/\s+/g, " ").trim();
      throw new ApiError(
        snippet || `Server returned non-JSON response (HTTP ${res.status})`,
        res.status
      );
    }
  }

  if (!json) {
    if (res.ok) return null as T;
    throw new ApiError(`Empty server response (HTTP ${res.status})`, res.status);
  }

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
