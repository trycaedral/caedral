import {
  assertEmbeddingDimensions,
  assertEmbeddingModel,
  DEFAULT_EMBEDDING_DIMENSIONS,
  DEFAULT_EMBEDDING_MODEL,
} from "../embeddings/constants.js";
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
   * Generate dense vector embeddings. Defaults to Caedral E1 Small (384D).
   */
  async create(
    params: EmbeddingCreateParams,
  ): Promise<EmbeddingCreateResponse> {
    const model = assertEmbeddingModel(params.model ?? DEFAULT_EMBEDDING_MODEL);
    const dimensions = assertEmbeddingDimensions(
      params.dimensions ?? DEFAULT_EMBEDDING_DIMENSIONS,
    );
    return this.http.postJson<EmbeddingCreateResponse>("/v1/embeddings", {
      ...params,
      model,
      dimensions,
    });
  }
}
