import { HttpClient } from "../http.js";
import type {
  EmbeddingCreateParams,
  EmbeddingCreateResponse,
} from "../types.js";

/**
 * Text embeddings endpoint (`POST /v1/embeddings`).
 */
export class EmbeddingsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Generate dense vector embeddings for one or more input strings.
   *
   * @param params - Embedding request specifying the model and input
   *   text(s). `input` can be a single string or an array of strings
   *   to batch multiple inputs in one request.
   * @returns The response containing an array of embedding vectors
   *   in the same order as the inputs, plus token usage.
   * @throws {CaedralAPIError} If the API returns a non-2xx response.
   */
  async create(params: EmbeddingCreateParams): Promise<EmbeddingCreateResponse> {
    return this.http.postJson<EmbeddingCreateResponse>("/v1/embeddings", params);
  }
}
