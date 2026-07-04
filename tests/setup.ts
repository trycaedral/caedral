import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

process.env.CAEDRAL_BASE_URL ??= "http://localhost:5001";

export const hasLiveOpenRouter =
  !!process.env.OPENROUTER_API_KEY &&
  process.env.OPENROUTER_API_KEY !== "sk-or-test-mock-key" &&
  process.env.OPENROUTER_API_KEY.startsWith("sk-or-");
