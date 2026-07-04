import { HttpClient } from "../http.js";
import type { RerankCreateParams, RerankCreateResponse } from "../types.js";

/**
 * Document rerank endpoint (`POST /v1/rerank`).
 */
export class Rerank {
  constructor(private readonly http: HttpClient) {}

  /**
   * Reorder a list of documents by semantic relevance to a query.
   *
   * @param params - Rerank parameters: `query`, `documents`, optional
   *   `model`, and optional `top_n` to cap the number of results.
   * @returns The response containing relevance-scored results ordered
   *   from most to least relevant.
   * @throws {CaedralAPIError} If the API returns a non-2xx response.
   */
  create(params: RerankCreateParams): Promise<RerankCreateResponse> {
    return this.http.postJson<RerankCreateResponse>("/v1/rerank", params);
  }
}
