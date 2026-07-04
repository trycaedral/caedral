import { HttpClient } from "./http.js";
import { Audio } from "./resources/audio.js";
import { ChatResource } from "./resources/chat.js";
import { EmbeddingsResource } from "./resources/embeddings.js";
import { Images } from "./resources/images.js";
import { ModelsResource } from "./resources/models.js";
import { Rerank } from "./resources/rerank.js";
import { UsageResource } from "./resources/usage.js";
import type { CaedralClientOptions } from "./types.js";

/**
 * Official client for the Caedral API.
 *
 * Exposes resource namespaces (`chat`, `models`, `usage`, `embeddings`,
 * `images`, `audio`, `rerank`) that mirror the HTTP endpoints at
 * `https://api.caedral.com`. All requests are authenticated with the
 * configured API key and share a single underlying HTTP client with
 * retry and timeout support.
 *
 * @example
 * ```ts
 * import { Caedral } from "@caedral/sdk";
 *
 * const client = new Caedral({ apiKey: process.env.CAEDRAL_API_KEY! });
 * const completion = await client.chat.completions.create({
 *   model: "caedral-base",
 *   messages: [{ role: "user", content: "Hello!" }],
 * });
 * ```
 */
export class Caedral {
  /** Chat completions namespace. */
  readonly chat: ChatResource;
  /** Model catalog namespace. */
  readonly models: ModelsResource;
  /** Account usage and billing pool namespace. */
  readonly usage: UsageResource;
  /** Text embeddings namespace. */
  readonly embeddings: EmbeddingsResource;
  /** Image generation namespace. */
  readonly images: Images;
  /** Audio (text-to-speech) namespace. */
  readonly audio: Audio;
  /** Document reranking namespace. */
  readonly rerank: Rerank;

  private readonly http: HttpClient;

  /**
   * Create a new Caedral client instance.
   *
   * @param options - Client configuration including the API key and
   *   optional overrides for base URL, retries, timeout, and fetch.
   * @throws {Error} If `options.apiKey` is missing or blank.
   */
  constructor(options: CaedralClientOptions) {
    if (!options.apiKey?.trim()) {
      throw new Error("Caedral: apiKey is required");
    }

    this.http = new HttpClient({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      maxRetries: options.maxRetries,
      timeout: options.timeout,
      fetch: options.fetch,
    });

    this.chat = new ChatResource(this.http);
    this.models = new ModelsResource(this.http);
    this.usage = new UsageResource(this.http);
    this.embeddings = new EmbeddingsResource(this.http);
    this.images = new Images(this.http);
    this.audio = new Audio(this.http);
    this.rerank = new Rerank(this.http);
  }
}
