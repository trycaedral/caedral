import type { HttpClient } from "../http.js";
import type { ModelListResponse } from "../types.js";

/**
 * Model catalog endpoint (`GET /v1/models`).
 */
export class ModelsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List every model available to the authenticated account, along
   * with metadata such as context window and pricing tier.
   *
   * @returns The list response containing available `Model` entries.
   * @throws {CaedralAPIError} If the API returns a non-2xx response.
   */
  async list(): Promise<ModelListResponse> {
    return this.http.get<ModelListResponse>("/v1/models");
  }
}
