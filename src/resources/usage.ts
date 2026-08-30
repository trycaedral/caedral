import type { HttpClient } from "../http.js";
import type { UsageSummary } from "../types.js";

/**
 * Account usage endpoint (`GET /v1/usage`).
 */
export class UsageResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Fetch plan, included quota pools, and on-demand state
   * (`accountStatus`, `plan`, `pools`, `onDemand`).
   *
   * @returns The current `UsageSummary` for the account.
   * @throws {CaedralAPIError} If the API returns a non-2xx response.
   */
  async get(): Promise<UsageSummary> {
    return this.http.get<UsageSummary>("/v1/usage");
  }
}
