import { describe, expect, it } from "vitest";
import { Caedral, CaedralAPIError } from "../src/index.js";

describe("Caedral SDK smoke", () => {
  it("exports the client and error type", () => {
    expect(typeof Caedral).toBe("function");
    expect(CaedralAPIError.name).toBe("CaedralAPIError");
  });

  it("builds a client with required options", () => {
    const client = new Caedral({ apiKey: "sk-test", baseURL: "https://api.caedral.com" });
    expect(client).toBeInstanceOf(Caedral);
  });
});
