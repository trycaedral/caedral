import { CaedralAPIError, CaedralNetworkError } from "./errors.js";
import type { ApiErrorBody } from "./types.js";

const DEFAULT_BASE_URL = "https://api.caedral.com";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 120_000;

export type HttpClientOptions = {
  apiKey: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
  fetch?: typeof fetch;
};

export class HttpClient {
  readonly apiKey: string;
  readonly baseURL: string;
  readonly maxRetries: number;
  readonly timeout: number;
  readonly fetchFn: typeof fetch;

  constructor(options: HttpClientOptions) {
    this.apiKey = options.apiKey;
    this.baseURL = (options.baseURL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async get<T>(path: string): Promise<T> {
    return this.requestWithRetry<T>("GET", path);
  }

  async postJson<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async postStream(path: string, body: unknown): Promise<Response> {
    return this.requestRaw("POST", path, body);
  }

  private async requestWithRetry<T>(
    method: "GET",
    path: string,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.request<T>(method, path);
      } catch (err) {
        lastError = err;
        if (!this.shouldRetry(err, attempt)) {
          throw err;
        }
        await sleep(backoffMs(attempt));
      }
    }

    throw lastError;
  }

  private shouldRetry(err: unknown, attempt: number): boolean {
    if (attempt >= this.maxRetries) return false;
    if (err instanceof CaedralNetworkError) return true;
    if (err instanceof CaedralAPIError) {
      return err.statusCode === 502 || err.statusCode === 503;
    }
    return false;
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await this.requestRaw(method, path, body);
    const text = await response.text();
    const parsed = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      throw CaedralAPIError.fromResponse(response.status, parsed ?? text);
    }

    return parsed as T;
  }

  private async requestRaw(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
      }

      const response = await this.fetchFn(`${this.baseURL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      return response;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new CaedralNetworkError(
          `Request timed out after ${this.timeout}ms`,
          err,
        );
      }
      throw new CaedralNetworkError(
        err instanceof Error ? err.message : "Network request failed",
        err,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export async function* parseSseStream<T>(
  response: Response,
): AsyncGenerator<T> {
  if (!response.body) {
    throw new CaedralNetworkError("Streaming response has no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.slice("data:".length).trim();
        if (!data || data === "[DONE]") continue;

        yield JSON.parse(data) as T;
      }
    }

    const trailing = buffer.trim();
    if (trailing.startsWith("data:")) {
      const data = trailing.slice("data:".length).trim();
      if (data && data !== "[DONE]") {
        yield JSON.parse(data) as T;
      }
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new CaedralAPIError("Failed to parse streaming response chunk", {
        type: "upstream_error",
        statusCode: 502,
      });
    }
    throw err;
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function backoffMs(attempt: number): number {
  return 100 * 2 ** attempt;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as ApiErrorBody).error?.message === "string"
  );
}
