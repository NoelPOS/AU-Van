import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function successResponse<T>(data: T, message?: string, status = 200) {
  const body: ApiResponse<T> = { success: true, data, message };
  return NextResponse.json(body, { status });
}

export function errorResponse(error: string, status = 400) {
  const body: ApiResponse = { success: false, error };
  return NextResponse.json(body, { status });
}

export function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = "Forbidden") {
  return errorResponse(message, 403);
}

export function notFoundResponse(resource = "Resource") {
  return errorResponse(`${resource} not found`, 404);
}

export function validationErrorResponse(errors: Record<string, string[] | undefined>) {
  const message = Object.entries(errors)
    .filter(([, v]) => v && v.length > 0)
    .map(([k, v]) => `${k}: ${v!.join(", ")}`)
    .join("; ");
  return errorResponse(message || "Validation failed", 422);
}

export function serverErrorResponse(error: unknown) {
  console.error("Server error:", error);
  return errorResponse("Internal server error", 500);
}
