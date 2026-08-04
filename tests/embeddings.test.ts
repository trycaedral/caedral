import { describe, expect, it, vi } from "vitest";
import { EmbeddingsResource } from "../src/resources/embeddings.js";
import type { HttpClient } from "../src/http.js";

function mockHttp(): HttpClient {
  return {
    postJson: vi.fn().mockResolvedValue({
      object: "list",
      model: "caedral-embed-e1-small-v1",
      data: [{ object: "embedding", index: 0, embedding: Array(384).fill(0.1) }],
      usage: { prompt_tokens: 1, total_tokens: 1, completion_tokens: 0 },
    }),
    getJson: vi.fn(),
    request: vi.fn(),
  } as unknown as HttpClient;
}

describe("EmbeddingsResource", () => {
  it("uses default model and dimensions", async () => {
    const http = mockHttp();
    const resource = new EmbeddingsResource(http);
    await resource.create({ input: "query: hello" });
    expect(http.postJson).toHaveBeenCalledWith("/v1/embeddings", {
      input: "query: hello",
      model: "caedral-embed-e1-small-v1",
      dimensions: 384,
    });
  });

  it("rejects unsupported model", async () => {
    const resource = new EmbeddingsResource(mockHttp());
    await expect(
      resource.create({
        input: "test",
        model: "BAAI/bge-m3" as "caedral-embed-e1-small-v1",
      }),
    ).rejects.toThrow(/unsupported embedding model/);
  });

  it("rejects unsupported dimensions", async () => {
    const resource = new EmbeddingsResource(mockHttp());
    await expect(
      resource.create({ input: "test", dimensions: 512 as 384 }),
    ).rejects.toThrow(/unsupported embedding dimensions/);
  });
});
