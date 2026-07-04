import bcrypt from "bcryptjs";
import postgres from "postgres";

const API_KEY_PREFIX = "cd_live_";

export function generateApiKeySecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const body = Buffer.from(bytes).toString("base64url");
  return `${API_KEY_PREFIX}${body}`;
}

export function keyPrefixFromRaw(rawKey: string): string {
  return rawKey.slice(0, 16);
}

export type TestKeyFixture = {
  userId: string;
  apiKeyId: string;
  rawKey: string;
  cleanup: () => Promise<void>;
};

export async function createTestApiKey(): Promise<TestKeyFixture> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to create a test API key");
  }

  const userId = crypto.randomUUID();
  const apiKeyId = crypto.randomUUID();
  const subId = crypto.randomUUID();
  const rawKey = generateApiKeySecret();
  const keyPrefix = keyPrefixFromRaw(rawKey);
  const keyHash = await bcrypt.hash(rawKey, 10);
  const email = `sdk-test-${userId}@example.com`;

  const sql = postgres(url, { prepare: false });

  await sql`
    INSERT INTO "user" (id, name, email, email_verified, balance_cents, account_status)
    VALUES (${userId}, ${"SDK Test"}, ${email}, ${true}, ${0}, ${"active"})
  `;

  await sql`
    INSERT INTO subscriptions (
      id, user_id, plan, status, weekly_pool_limit, weekly_pool_used,
      overage_enabled, overage_used_cents
    )
    VALUES (
      ${subId}, ${userId}, ${"pro"}, ${"active"}, ${1_000_000}, ${0},
      ${false}, ${0}
    )
  `;

  await sql`
    INSERT INTO api_keys (id, user_id, name, key_prefix, key_hash)
    VALUES (${apiKeyId}, ${userId}, ${"SDK test key"}, ${keyPrefix}, ${keyHash})
  `;

  const cleanup = async () => {
    await sql`DELETE FROM usage_logs WHERE user_id = ${userId}`;
    await sql`DELETE FROM api_keys WHERE id = ${apiKeyId}`;
    await sql`DELETE FROM subscriptions WHERE id = ${subId}`;
    await sql`DELETE FROM "user" WHERE id = ${userId}`;
    await sql.end();
  };

  return { userId, apiKeyId, rawKey, cleanup };
}
