import { HttpClient } from "../http.js";
import type {
  ImageGenerateParams,
  ImageGenerateResponse,
} from "../types.js";

/**
 * Image generation endpoint (`POST /v1/images/generations`).
 */
export class Images {
  constructor(private readonly http: HttpClient) {}

  /**
   * Generate one or more images from a text prompt.
   *
   * @param params - Image generation parameters (prompt, optional
   *   model, `n`, and `size`).
   * @returns The response containing generated images as URLs or
   *   base64-encoded data.
   * @throws {CaedralAPIError} If the API returns a non-2xx response.
   */
  generate(params: ImageGenerateParams): Promise<ImageGenerateResponse> {
    return this.http.postJson<ImageGenerateResponse>(
      "/v1/images/generations",
      params,
    );
  }
}
