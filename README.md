# Caedral SDK

Official TypeScript/JavaScript client for the [Caedral API](https://caedral.com). OpenAI-compatible shape — point your existing code at Caedral with minimal changes.

## Installation

```bash
npm install caedral
```

## Quickstart

```typescript
import { Caedral } from "caedral";

const caedral = new Caedral({
  apiKey: process.env.CAEDRAL_API_KEY!,
  // baseURL: "http://localhost:5001", // local gateway
});

const completion = await caedral.chat.completions.create({
  model: "caedral-titan",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(completion.choices[0]?.message.content);
```

### Local development

When running the API gateway locally (port **5001**):

```typescript
const caedral = new Caedral({
  apiKey: "cd_live_...",
  baseURL: "http://localhost:5001",
});
```

Production default: `https://api.caedral.com`.

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `apiKey` | — | Required. Your `cd_live_...` API key |
| `baseURL` | `https://api.caedral.com` | API gateway base URL |
| `maxRetries` | `3` | Retries for idempotent GET requests (exponential backoff) |
| `timeout` | `120000` | Request timeout in ms |
| `fetch` | global `fetch` | Custom fetch implementation |

## Methods

### `caedral.chat.completions.create(params)`

OpenAI-compatible chat completions.

**Non-streaming:**

```typescript
const response = await caedral.chat.completions.create({
  model: "caedral-olympus",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Explain quantum computing briefly." },
  ],
  temperature: 0.7,
  max_tokens: 500,
});

console.log(response.choices[0].message.content);
console.log(response.usage?.total_tokens);
```

**Streaming** (async iterable):

```typescript
const stream = await caedral.chat.completions.create({
  model: "caedral-titan",
  messages: [{ role: "user", content: "Write a haiku about code." }],
  stream: true,
});

for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content;
  if (text) process.stdout.write(text);
}
```

Available models: `caedral-base`, `caedral-titan`, `caedral-olympus`, `caedral-primordial`.

### `caedral.models.list()`

Public model catalog (no auth required on the gateway, but the SDK sends your key if configured).

```typescript
const { data: models } = await caedral.models.list();

for (const model of models) {
  console.log(model.id, model.name, model.pricing_tier);
}
```

### `caedral.usage.get()`

Current account usage: weekly pool, balance, overage.

```typescript
const usage = await caedral.usage.get();

console.log("Pool remaining:", usage.weeklyPool.remaining);
console.log("Balance (cents):", usage.balanceCents);
console.log("Overage used:", usage.overage.usedCents);
```

### `caedral.embeddings.create(params)`

Generate vector embeddings (model `caedral-embed`).

```typescript
const result = await caedral.embeddings.create({
  model: "caedral-embed",
  input: ["Caedral routes frontier models through one API"],
});

console.log(result.data[0]?.embedding.length);
```

### `caedral.images.generate(params)`

Generate images (model `caedral-vision`).

```typescript
const result = await caedral.images.generate({
  model: "caedral-vision",
  prompt: "A minimalist logo for an AI infrastructure company",
  n: 1,
});

console.log(result.data[0]?.url ?? result.data[0]?.b64_json?.slice(0, 40));
```

### `caedral.audio.generate(params)`

Generate speech/audio (model `caedral-voice`).

```typescript
const result = await caedral.audio.generate({
  model: "caedral-voice",
  input: "Welcome to Caedral.",
  voice: "alloy",
});

console.log(result.choices?.[0]?.message);
```

### `caedral.rerank.create(params)`

Rerank documents by relevance (model `caedral-rerank`).

```typescript
const result = await caedral.rerank.create({
  model: "caedral-rerank",
  query: "How does Caedral billing work?",
  documents: [
    "Weekly pools apply to chat tiers.",
    "Specialized models bill from balance only.",
  ],
  top_n: 2,
});

console.log(result.results);
```

## Error handling

The SDK throws `CaedralAPIError` with structured fields from the gateway:

```typescript
import { Caedral, CaedralAPIError } from "caedral";

try {
  await caedral.chat.completions.create({
    model: "caedral-titan",
    messages: [{ role: "user", content: "Hello" }],
  });
} catch (err) {
  if (err instanceof CaedralAPIError) {
    console.error(err.type);       // e.g. "insufficient_balance"
    console.error(err.statusCode); // e.g. 402
    console.error(err.message);
  }
}
```

| Status | `type` |
|--------|--------|
| 401 | `invalid_api_key` |
| 402 | `insufficient_balance` |
| 400 | `invalid_request` |
| 429 | `rate_limit_exceeded` |
| 502 | `upstream_error` |

Network failures throw `CaedralNetworkError` (extends `CaedralAPIError`).

## Types

All request/response types are exported:

```typescript
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
  EmbeddingCreateParams,
  ImageGenerateParams,
  AudioGenerateParams,
  RerankCreateParams,
  ModelListResponse,
  UsageSummary,
} from "caedral";
```

## Publishing

See [PUBLISHING.md](./PUBLISHING.md) for npm publish steps and pre-release checklist.

## Development

```bash
cd sdk
npm install
npm run build    # ESM + CJS to dist/
npm test         # integration tests against localhost:5001
```

Integration tests require:

- Running API gateway (`../api-gateway`, port 5001) — started automatically if not already up
- `DATABASE_URL` (from `../site/.env`) to create ephemeral test keys
- `OPENROUTER_API_KEY` for real chat completion calls

Optional: set `CAEDRAL_TEST_API_KEY` to skip ephemeral key creation.

## Package output

- **ESM:** `dist/index.js`
- **CommonJS:** `dist/index.cjs`
- **Types:** `dist/index.d.ts`

Works in Node 18+ and bundlers (Vite, webpack, etc.).
