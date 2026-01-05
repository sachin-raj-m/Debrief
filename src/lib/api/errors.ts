/**
 * API Error Handling Utilities
 * 
 * Standardized error responses for API routes.
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message, "FORBIDDEN");
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(404, message, "NOT_FOUND");
  }
}

export class RateLimitError extends ApiError {
  constructor(
    public retryAfter: number,
    message = "Too many requests"
  ) {
    super(429, message, "RATE_LIMITED");
  }
}

export class ValidationError extends ApiError {
  constructor(
    public errors: Record<string, string[]>,
    message = "Validation failed"
  ) {
    super(400, message, "VALIDATION_ERROR");
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(409, message, "CONFLICT");
  }
}

/**
 * Creates a standardized error response
 */
export function errorResponse(error: unknown): NextResponse {
  // Handle known API errors
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
        retryAfter: error.retryAfter,
      },
      {
        status: error.statusCode,
        headers: {
          "Retry-After": String(error.retryAfter),
        },
      }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
        errors: error.errors,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.code || "ERROR",
        message: error.message,
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }

    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Validation failed",
        errors,
      },
      { status: 400 }
    );
  }

  // Handle unknown errors
  console.error("Unhandled API error:", error);

  return NextResponse.json(
    {
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
    { status: 500 }
  );
}

/**
 * Creates a standardized success response
 * Returns data directly without extra wrapping
 */
export function successResponse<T>(
  responseBody: T,
  status = 200,
  headers?: HeadersInit
): NextResponse {
  return NextResponse.json(responseBody, { status, headers });
}

/**
 * Wraps an API handler with error handling.
 * Uses generics to preserve the original handler's type signature.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse<unknown> | Response>>(
  handler: T
): T {
  const wrapped = async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
  return wrapped as T;
}
