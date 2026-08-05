export const DEFAULT_EMBEDDING_MODEL = "caedral-embed-e1-small-v1" as const;
/** Legacy prepaid API alias; maps to the same E1 Small inference backend. */
export const LEGACY_EMBEDDING_MODEL_ALIAS = "caedral-embed" as const;
export const DEFAULT_EMBEDDING_DIMENSIONS = 384 as const;

export type EmbeddingModel =
  | typeof DEFAULT_EMBEDDING_MODEL
  | typeof LEGACY_EMBEDDING_MODEL_ALIAS;
export type EmbeddingDimensions = typeof DEFAULT_EMBEDDING_DIMENSIONS;

const SUPPORTED_MODELS = new Set<string>([
  DEFAULT_EMBEDDING_MODEL,
  LEGACY_EMBEDDING_MODEL_ALIAS,
]);
const SUPPORTED_DIMENSIONS = new Set<number>([DEFAULT_EMBEDDING_DIMENSIONS]);

export function assertEmbeddingModel(model: string): EmbeddingModel {
  if (!SUPPORTED_MODELS.has(model)) {
    throw new Error(`unsupported embedding model: ${model}`);
  }
  return model as EmbeddingModel;
}

export function assertEmbeddingDimensions(dimensions: number): EmbeddingDimensions {
  if (!SUPPORTED_DIMENSIONS.has(dimensions)) {
    throw new Error(`unsupported embedding dimensions: ${dimensions}`);
  }
  return dimensions as EmbeddingDimensions;
}
