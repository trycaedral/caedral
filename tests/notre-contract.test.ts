import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { ChatCompletion, ChatCompletionCreateParams } from '../src/types.js';

const FIXTURES = path.join(import.meta.dirname, 'fixtures/notre-contract');

describe('Notre contract parity (TypeScript SDK)', () => {
  it('serializes notre auto with telemetry', () => {
    const params: ChatCompletionCreateParams = {
      model: 'caedral-base',
      messages: [{ role: 'user', content: 'Hello' }],
      notre: { mode: 'auto', telemetry: true },
    };
    expect(JSON.parse(JSON.stringify(params))).toEqual(
      JSON.parse(fs.readFileSync(path.join(FIXTURES, 'notre-auto-telemetry.json'), 'utf8')),
    );
  });

  it('serializes notre off', () => {
    const params: ChatCompletionCreateParams = {
      model: 'caedral-base',
      messages: [{ role: 'user', content: 'Hello' }],
      notre: { mode: 'off' },
    };
    expect(JSON.parse(JSON.stringify(params))).toEqual(
      JSON.parse(fs.readFileSync(path.join(FIXTURES, 'notre-off.json'), 'utf8')),
    );
  });

  it('omits notre when unset (backward compatible)', () => {
    const params: ChatCompletionCreateParams = {
      model: 'caedral-base',
      messages: [{ role: 'user', content: 'Hello' }],
    };
    expect(JSON.parse(JSON.stringify(params))).toEqual(
      JSON.parse(fs.readFileSync(path.join(FIXTURES, 'notre-omitted.json'), 'utf8')),
    );
  });

  it('deserializes response telemetry metadata V1', () => {
    const raw = JSON.parse(
      fs.readFileSync(path.join(FIXTURES, 'notre-response-telemetry.json'), 'utf8'),
    ) as ChatCompletion;
    expect(raw.notre).toEqual({
      enabled: true,
      mode: 'auto',
      intervened: false,
      fallback_used: false,
    });
    expect(raw.notre).not.toHaveProperty('logical_tokens');
    expect(raw.notre).not.toHaveProperty('strategy_class');
  });
});
