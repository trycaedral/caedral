import type { ApiErrorBody, ApiErrorType } from "./types.js";

/**
 * Base error thrown by the Caedral SDK for any API-related failure.
 *
 * Carries the HTTP `statusCode` returned by the gateway, a normalized
 * `type` describing the error category, and the parsed `rawBody` for
 * further inspection when needed.
 */
export class CaedralAPIError extends Error {
  /** Normalized error category returned by the API, or `"unknown"`. */
  readonly type: ApiErrorType | "network_error" | "unknown";
  /** HTTP status code of the failing response, or `0` if unavailable. */
  readonly statusCode: number;
  /** Raw response body (parsed JSON when possible) for debugging. */
  readonly rawBody?: unknown;

  /**
   * Construct a new API error.
   *
   * @param message - Human-readable error message.
   * @param options - Optional error metadata (type, statusCode, rawBody).
   */
  constructor(
    message: string,
    options: {
      type?: ApiErrorType | "network_error" | "unknown";
      statusCode?: number;
      rawBody?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "CaedralAPIError";
    this.type = options.type ?? "unknown";
    this.statusCode = options.statusCode ?? 0;
    this.rawBody = options.rawBody;
  }

  /**
   * Build a `CaedralAPIError` from a raw HTTP response body.
   *
   * If the body matches the Caedral error envelope
   * (`{ error: { type, message, code } }`), its fields are used
   * directly. Otherwise a best-effort message is derived from the
   * body and the HTTP status.
   *
   * @param status - HTTP status code of the response.
   * @param body - Parsed response body (any shape).
   * @returns A populated `CaedralAPIError` instance.
   */
  static fromResponse(status: number, body: unknown): CaedralAPIError {
    if (isApiErrorBody(body)) {
      return new CaedralAPIError(body.error.message, {
        type: body.error.type,
        statusCode: body.error.code || status,
        rawBody: body,
      });
    }

    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed with status ${status}`;

    return new CaedralAPIError(message, {
      type: "unknown",
      statusCode: status,
      rawBody: body,
    });
  }
}

/**
 * Error raised when a request fails to reach the Caedral API — for
 * example due to DNS failure, connection reset, or fetch abort.
 *
 * Always has `type: "network_error"` and `statusCode: 0`. The
 * originating error (if any) is preserved on the `cause` property.
 */
export class CaedralNetworkError extends CaedralAPIError {
  /**
   * @param message - Human-readable description of the network failure.
   * @param cause - Optional underlying error, attached to `cause` when
   *   it is an `Error` instance.
   */
  constructor(message: string, cause?: unknown) {
    super(message, { type: "network_error", statusCode: 0 });
    this.name = "CaedralNetworkError";
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as ApiErrorBody).error === "object" &&
    (body as ApiErrorBody).error !== null &&
    typeof (body as ApiErrorBody).error.message === "string"
  );
}
