import { describe, expect, it, vi } from "vitest";
import { CaedralAPIError } from "../src/errors.js";
import { HttpClient } from "../src/http.js";
import { EmbeddingsResource } from "../src/resources/embeddings.js";
import type { HttpClient as HttpClientType } from "../src/http.js";
import type { ApiErrorBody } from "../src/types.js";

function mockHttp(): HttpClientType {
  return {
    postJson: vi.fn().mockResolvedValue({
      object: "list",
      model: "caedral-embed-e1-small-v1",
      data: [{ object: "embedding", index: 0, embedding: Array(384).fill(0.1) }],
      usage: { prompt_tokens: 1, total_tokens: 1, completion_tokens: 0 },
    }),
    getJson: vi.fn(),
    request: vi.fn(),
  } as unknown as HttpClientType;
}

function mockFetchResponse(status: number, body: unknown): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    body: null,
  } as Response);
}

function apiErrorBody(
  type: ApiErrorBody["error"]["type"],
  message: string,
  code: number,
): ApiErrorBody {
  return { error: { type, message, code } };
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

  it("accepts canonical model caedral-embed-e1-small-v1", async () => {
    const http = mockHttp();
    const resource = new EmbeddingsResource(http);
    await resource.create({
      input: "canonical model text",
      model: "caedral-embed-e1-small-v1",
    });
    expect(http.postJson).toHaveBeenCalledWith("/v1/embeddings", {
      input: "canonical model text",
      model: "caedral-embed-e1-small-v1",
      dimensions: 384,
    });
  });

  it("accepts legacy prepaid alias caedral-embed", async () => {
    const http = mockHttp();
    const resource = new EmbeddingsResource(http);
    await resource.create({
      input: "legacy alias text",
      model: "caedral-embed",
    });
    expect(http.postJson).toHaveBeenCalledWith("/v1/embeddings", {
      input: "legacy alias text",
      model: "caedral-embed",
      dimensions: 384,
    });
  });

  it("passes input_type search_query for query embeddings", async () => {
    const http = mockHttp();
    const resource = new EmbeddingsResource(http);
    await resource.create({
      input: "what is semantic search?",
      input_type: "search_query",
    });
    expect(http.postJson).toHaveBeenCalledWith("/v1/embeddings", {
      input: "what is semantic search?",
      model: "caedral-embed-e1-small-v1",
      dimensions: 384,
      input_type: "search_query",
    });
  });

  it("passes input_type query alias", async () => {
    const http = mockHttp();
    const resource = new EmbeddingsResource(http);
    await resource.create({
      input: "query alias",
      input_type: "query",
    });
    expect(http.postJson).toHaveBeenCalledWith(
      "/v1/embeddings",
      expect.objectContaining({ input_type: "query" }),
    );
  });

  it("passes input_type search_document for document embeddings", async () => {
    const http = mockHttp();
    const resource = new EmbeddingsResource(http);
    await resource.create({
      input: "document body for indexing",
      input_type: "search_document",
    });
    expect(http.postJson).toHaveBeenCalledWith("/v1/embeddings", {
      input: "document body for indexing",
      model: "caedral-embed-e1-small-v1",
      dimensions: 384,
      input_type: "search_document",
    });
  });

  it("passes input_type document and passage aliases", async () => {
    const http = mockHttp();
    const resource = new EmbeddingsResource(http);

    await resource.create({ input: "doc", input_type: "document" });
    expect(http.postJson).toHaveBeenLastCalledWith(
      "/v1/embeddings",
      expect.objectContaining({ input_type: "document" }),
    );

    await resource.create({ input: "passage", input_type: "passage" });
    expect(http.postJson).toHaveBeenLastCalledWith(
      "/v1/embeddings",
      expect.objectContaining({ input_type: "passage" }),
    );
  });

  it("passes encoding_format float", async () => {
    const http = mockHttp();
    const resource = new EmbeddingsResource(http);
    await resource.create({
      input: "float vectors",
      encoding_format: "float",
    });
    expect(http.postJson).toHaveBeenCalledWith("/v1/embeddings", {
      input: "float vectors",
      model: "caedral-embed-e1-small-v1",
      dimensions: 384,
      encoding_format: "float",
    });
  });

  it("passes encoding_format base64", async () => {
    const http = mockHttp();
    const resource = new EmbeddingsResource(http);
    await resource.create({
      input: "base64 vectors",
      encoding_format: "base64",
    });
    expect(http.postJson).toHaveBeenCalledWith("/v1/embeddings", {
      input: "base64 vectors",
      model: "caedral-embed-e1-small-v1",
      dimensions: 384,
      encoding_format: "base64",
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

  describe("API errors via HttpClient", () => {
    it("throws invalid_request (400)", async () => {
      const http = new HttpClient({
        apiKey: "test-key",
        baseURL: "https://api.example.com",
        fetch: mockFetchResponse(
          400,
          apiErrorBody("invalid_request", "invalid dimensions", 400),
        ),
      });
      const resource = new EmbeddingsResource(http);

      await expect(resource.create({ input: "test" })).rejects.toMatchObject({
        name: "CaedralAPIError",
        type: "invalid_request",
        statusCode: 400,
      });
    });

    it("throws invalid_api_key (401)", async () => {
      const http = new HttpClient({
        apiKey: "bad-key",
        baseURL: "https://api.example.com",
        fetch: mockFetchResponse(
          401,
          apiErrorBody("invalid_api_key", "invalid API key", 401),
        ),
      });
      const resource = new EmbeddingsResource(http);

      await expect(resource.create({ input: "test" })).rejects.toMatchObject({
        name: "CaedralAPIError",
        type: "invalid_api_key",
        statusCode: 401,
      });
    });

    it("throws insufficient_balance (402)", async () => {
      const http = new HttpClient({
        apiKey: "test-key",
        baseURL: "https://api.example.com",
        fetch: mockFetchResponse(
          402,
          apiErrorBody("insufficient_balance", "balance required", 402),
        ),
      });
      const resource = new EmbeddingsResource(http);

      await expect(resource.create({ input: "test" })).rejects.toMatchObject({
        name: "CaedralAPIError",
        type: "insufficient_balance",
        statusCode: 402,
      });
    });

    it("throws rate_limit_exceeded (429)", async () => {
      const http = new HttpClient({
        apiKey: "test-key",
        baseURL: "https://api.example.com",
        fetch: mockFetchResponse(
          429,
          apiErrorBody("rate_limit_exceeded", "too many requests", 429),
        ),
      });
      const resource = new EmbeddingsResource(http);

      const err = await resource
        .create({ input: "test" })
        .catch((e) => e as CaedralAPIError);

      expect(err).toBeInstanceOf(CaedralAPIError);
      expect(err.type).toBe("rate_limit_exceeded");
      expect(err.statusCode).toBe(429);
    });
  });
});
