export type CaedralModelId =
  | "caedral-base"
  | "caedral-titan"
  | "caedral-olympus"
  | "caedral-primordial";

export type ChatCompletionRole = "system" | "user" | "assistant" | "tool";

export type ChatCompletionMessageParam = {
  role: ChatCompletionRole;
  content: string | null;
  name?: string;
};

export type NotrePublicMode = 'off' | 'auto';

export type NotreOptions = {
  mode?: NotrePublicMode;
  telemetry?: boolean;
};

export type NotrePublicMetadata = {
  enabled: boolean;
  mode: NotrePublicMode | 'shadow';
  intervened: boolean;
  fallback_used: boolean;
};

export type ChatCompletionCreateParams = {
  model: CaedralModelId | (string & {});
  messages: ChatCompletionMessageParam[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  user?: string;
  /** Optional Notre platform optimization (additive; omit for existing behavior). */
  notre?: NotreOptions;
};

export type ChatCompletionChoice = {
  index: number;
  message: {
    role: "assistant";
    content: string | null;
  };
  finish_reason: string | null;
};

export type CompletionUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

export type ChatCompletion = {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: CompletionUsage;
  /** Present when request included `notre.telemetry: true`. */
  notre?: NotrePublicMetadata;
};

export type ChatCompletionChunkChoice = {
  index: number;
  delta: {
    role?: "assistant";
    content?: string | null;
  };
  finish_reason: string | null;
};

export type ChatCompletionChunk = {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
};

export type Model = {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
  name: string;
  description: string;
  context_window: number;
  pricing_tier: string;
};

export type ModelListResponse = {
  object: "list";
  data: Model[];
};

export type UsagePool = {
  usedMilli: number;
  limitMilli: number;
  usedFormatted?: string;
  limitFormatted?: string;
  percentUsed: number;
  available: boolean;
};

export type UsageSummary = {
  accountStatus: string;
  plan: {
    id: string;
    name: string;
    interval: string;
    status: string;
    priceCents?: number;
  };
  billingPeriod?: {
    start: string | null;
    end: string | null;
  };
  pools: {
    caedral: UsagePool;
    external: UsagePool;
  };
  onDemand: {
    mode: string;
    allowed: boolean;
    blocked?: boolean;
    enabled?: boolean;
    accruedMilli: number;
    spentMilli?: number;
    accruedFormatted?: string;
    spentFormatted?: string;
  };
  quota?: {
    caedralRemainingMilli: number;
    externalRemainingMilli: number;
  };
};

export type CaedralClientOptions = {
  apiKey: string;
  /** API base URL. Defaults to `https://api.caedral.com`. Use `http://localhost:5001` for local dev. */
  baseURL?: string;
  /** Max retries for idempotent requests (GET). Default 3. */
  maxRetries?: number;
  /** Request timeout in milliseconds. Default 120_000. */
  timeout?: number;
  /** Custom fetch implementation (for testing or edge runtimes). */
  fetch?: typeof fetch;
};

export type ApiErrorType =
  | "invalid_api_key"
  | "insufficient_balance"
  | "quota_exceeded"
  | "account_suspended"
  | "invalid_request"
  | "rate_limit_exceeded"
  | "upstream_error"
  | "internal_error";

export type SpecializedModelId =
  | "caedral-vision"
  | "caedral-voice"
  | "caedral-rerank";

export type EmbeddingModel = "caedral-embed-e1-small-v1" | "caedral-embed";
export type EmbeddingDimensions = 384;
export type EmbeddingInputType =
  | "search_query"
  | "query"
  | "search_document"
  | "document"
  | "passage";
export type EmbeddingEncodingFormat = "float" | "base64";

export type EmbeddingCreateParams = {
  input: string | string[];
  model?: EmbeddingModel;
  dimensions?: EmbeddingDimensions;
  input_type?: EmbeddingInputType;
  encoding_format?: EmbeddingEncodingFormat;
};

export type EmbeddingCreateResponse = {
  object: string;
  model: string;
  data: Array<{ object: string; embedding: number[]; index: number }>;
  usage?: CompletionUsage;
};

export type ImageGenerateParams = {
  model?: SpecializedModelId | (string & {});
  prompt: string;
  n?: number;
  size?: string;
};

export type ImageGenerateResponse = {
  model: string;
  data: Array<{ url?: string; b64_json?: string }>;
  usage?: CompletionUsage;
};

export type AudioGenerateParams = {
  model?: SpecializedModelId | (string & {});
  input: string;
  voice?: string;
};

export type AudioGenerateResponse = {
  model: string;
  choices?: Array<{ message?: { content?: string; audio?: unknown } }>;
  usage?: CompletionUsage;
};

export type RerankCreateParams = {
  model?: SpecializedModelId | (string & {});
  query: string;
  documents: string[];
  top_n?: number;
};

export type RerankCreateResponse = {
  model: string;
  results: Array<{ index: number; relevance_score: number }>;
};

export type ApiErrorBody = {
  error: {
    type: ApiErrorType;
    message: string;
    code: number;
  };
};
