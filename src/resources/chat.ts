import { CaedralAPIError } from "../errors.js";
import { HttpClient, parseSseStream } from "../http.js";
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
} from "../types.js";

/**
 * Chat completions endpoint (`POST /v1/chat/completions`).
 *
 * Supports both buffered and Server-Sent Events (SSE) streaming
 * responses; the return type is chosen based on the `stream` flag
 * of the request.
 */
export class ChatCompletions {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a chat completion.
   *
   * When `stream` is falsy (default), the full `ChatCompletion` is
   * returned once the server finishes generating. When `stream` is
   * `true`, an async iterable of `ChatCompletionChunk` is returned
   * that yields incremental deltas as they arrive over SSE.
   *
   * @param params - Chat completion request parameters (model,
   *   messages, sampling options, etc.).
   * @returns Either a full `ChatCompletion` or an
   *   `AsyncIterable<ChatCompletionChunk>` depending on `params.stream`.
   * @throws {CaedralAPIError} If the API returns a non-2xx response.
   * @throws {CaedralNetworkError} If the request cannot reach the API.
   *
   * @example Non-streaming
   * ```ts
   * const completion = await client.chat.completions.create({
   *   model: "caedral-base",
   *   messages: [{ role: "user", content: "Hello!" }],
   * });
   * console.log(completion.choices[0].message.content);
   * ```
   *
   * @example Streaming
   * ```ts
   * const stream = await client.chat.completions.create({
   *   model: "caedral-base",
   *   messages: [{ role: "user", content: "Write a haiku." }],
   *   stream: true,
   * });
   * for await (const chunk of stream) {
   *   process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
   * }
   * ```
   */
  async create(
    params: ChatCompletionCreateParams & { stream?: false | undefined },
  ): Promise<ChatCompletion>;
  async create(
    params: ChatCompletionCreateParams & { stream: true },
  ): Promise<AsyncIterable<ChatCompletionChunk>>;
  async create(
    params: ChatCompletionCreateParams,
  ): Promise<ChatCompletion | AsyncIterable<ChatCompletionChunk>> {
    if (params.stream) {
      return this.createStreaming(params);
    }

    return this.http.postJson<ChatCompletion>("/v1/chat/completions", params);
  }

  private async createStreaming(
    params: ChatCompletionCreateParams,
  ): Promise<AsyncIterable<ChatCompletionChunk>> {
    const response = await this.http.postStream("/v1/chat/completions", params);

    if (!response.ok) {
      const text = await response.text();
      let body: unknown = text;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        // keep raw text
      }
      throw CaedralAPIError.fromResponse(response.status, body);
    }

    return parseSseStream<ChatCompletionChunk>(response);
  }
}

/**
 * Namespace grouping chat-related endpoints.
 *
 * Currently exposes `completions` for `POST /v1/chat/completions`.
 */
export class ChatResource {
  /** Chat completions sub-resource. */
  readonly completions: ChatCompletions;

  constructor(http: HttpClient) {
    this.completions = new ChatCompletions(http);
  }
}
