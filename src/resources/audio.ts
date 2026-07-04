import { HttpClient } from "../http.js";
import type { AudioGenerateParams, AudioGenerateResponse } from "../types.js";

/**
 * Audio (text-to-speech) endpoint (`POST /v1/audio/speech`).
 */
export class Audio {
  constructor(private readonly http: HttpClient) {}

  /**
   * Synthesize speech audio from an input text string.
   *
   * @param params - Audio generation parameters (input text, optional
   *   model, and optional voice).
   * @returns The response containing the generated audio payload.
   * @throws {CaedralAPIError} If the API returns a non-2xx response.
   */
  generate(params: AudioGenerateParams): Promise<AudioGenerateResponse> {
    return this.http.postJson<AudioGenerateResponse>("/v1/audio/speech", params);
  }
}
