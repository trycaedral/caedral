# Changelog

## 2.1.0 — 2026-08-04

- Add OpenRouter-ready embedding options: `input_type` and `encoding_format` on `EmbeddingCreateParams`
- Export `EmbeddingInputType` and `EmbeddingEncodingFormat` types
- Support legacy prepaid model alias `caedral-embed` alongside canonical `caedral-embed-e1-small-v1`

## 2.0.0 — 2026-08-04

- Migrate default embedding model to `caedral-embed-e1-small-v1` with native 384 dimensions
- Add embedding model/dimension validation and defaults in the SDK

## 1.0.0 — 2026-07-29

First stable release of the official Caedral TypeScript/JavaScript SDK.

- OpenAI-compatible chat completions, embeddings, images, audio, and rerank
- Dual ESM/CJS builds with TypeScript types
- Prepaid API client defaults aimed at production agency workloads
