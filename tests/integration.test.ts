import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Caedral, CaedralAPIError } from "../src/index.js";
import { createTestApiKey, type TestKeyFixture } from "./helpers.js";
import { hasLiveOpenRouter } from "./setup.js";

const BASE_URL = process.env.CAEDRAL_BASE_URL ?? "http://localhost:5001";

describe("Caedral SDK integration", () => {
  let fixture: TestKeyFixture | undefined;
  let client: Caedral;

  beforeAll(async () => {
    if (process.env.CAEDRAL_TEST_API_KEY) {
      client = new Caedral({
        apiKey: process.env.CAEDRAL_TEST_API_KEY,
        baseURL: BASE_URL,
      });
      return;
    }

    fixture = await createTestApiKey();
    client = new Caedral({
      apiKey: fixture.rawKey,
      baseURL: BASE_URL,
    });
  }, 60_000);

  afterAll(async () => {
    await fixture?.cleanup();
  });

  it("lists available models", async () => {
    const models = await client.models.list();

    expect(models.object).toBe("list");
    expect(models.data.length).toBeGreaterThanOrEqual(4);
    expect(models.data.map((m) => m.id)).toEqual(
      expect.arrayContaining([
        "caedral-base",
        "caedral-titan",
        "caedral-olympus",
        "caedral-primordial",
      ]),
    );
    expect(models.data[0]).toMatchObject({
      object: "model",
      owned_by: "caedral",
      context_window: expect.any(Number),
      pricing_tier: expect.any(String),
    });
  });

  it.skipIf(!hasLiveOpenRouter)(
    "creates a non-streaming chat completion",
    async () => {
      const completion = await client.chat.completions.create({
        model: "caedral-base",
        messages: [{ role: "user", content: "Reply with exactly: SDK OK" }],
      });

      expect(completion.object).toBe("chat.completion");
      expect(completion.model).toBe("caedral-base");
      expect(completion.choices[0]?.message.content).toBeTruthy();
    },
    45_000,
  );

  it.skipIf(!hasLiveOpenRouter)(
    "streams chat completion chunks",
    async () => {
      const stream = await client.chat.completions.create({
        model: "caedral-base",
        messages: [{ role: "user", content: "Count to 3." }],
        stream: true,
      });

      const chunks: string[] = [];
      for await (const chunk of stream) {
        expect(chunk.object).toBe("chat.completion.chunk");
        const delta = chunk.choices[0]?.delta.content;
        if (delta) chunks.push(delta);
      }

      expect(chunks.join("").length).toBeGreaterThan(0);
    },
    45_000,
  );

  it.runIf(!hasLiveOpenRouter)(
    "surfaces upstream_error when OpenRouter key is invalid",
    async () => {
      await expect(
        client.chat.completions.create({
          model: "caedral-base",
          messages: [{ role: "user", content: "Hello" }],
        }),
      ).rejects.toMatchObject({
        name: "CaedralAPIError",
        type: "upstream_error",
        statusCode: 502,
      });
    },
  );

  it("returns usage summary with expected shape", async () => {
    const usage = await client.usage.get();

    expect(usage).toMatchObject({
      accountStatus: expect.any(String),
      plan: expect.any(String),
      planStatus: expect.any(String),
      balanceCents: expect.any(Number),
      weeklyPool: {
        limit: expect.any(Number),
        used: expect.any(Number),
        remaining: expect.any(Number),
      },
      overage: {
        enabled: expect.any(Boolean),
        usedCents: expect.any(Number),
      },
      balanceWeightedUnitsAffordable: expect.any(Number),
    });
  });

  it("throws CaedralAPIError for invalid API key", async () => {
    const badClient = new Caedral({
      apiKey: "cd_live_invalid_integration_test_key",
      baseURL: BASE_URL,
    });

    await expect(
      badClient.chat.completions.create({
        model: "caedral-base",
        messages: [{ role: "user", content: "Hello" }],
      }),
    ).rejects.toMatchObject({
      name: "CaedralAPIError",
      type: "invalid_api_key",
      statusCode: 401,
    });

    try {
      await badClient.usage.get();
      expect.fail("Expected usage.get to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(CaedralAPIError);
      expect((err as CaedralAPIError).type).toBe("invalid_api_key");
      expect((err as CaedralAPIError).statusCode).toBe(401);
    }
  });
});
