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

  it('deserializes response telemetry metadata V1 (base fields only)', () => {
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

  it('deserializes response telemetry metadata V2 (flat economy fields)', () => {
    const raw = JSON.parse(
      fs.readFileSync(path.join(FIXTURES, 'notre-response-telemetry-v2.json'), 'utf8'),
    ) as ChatCompletion;
    expect(raw.notre).toEqual({
      enabled: true,
      mode: 'auto',
      intervened: true,
      fallback_used: false,
      input_before: 1200,
      input_sent: 310,
      input_saved: 890,
      result: 'optimized',
      value_usd: 0.00267,
    });
    if (raw.notre?.input_saved != null && raw.notre.input_before != null && raw.notre.input_sent != null) {
      expect(raw.notre.input_saved).toBe(raw.notre.input_before - raw.notre.input_sent);
    }
  });

  it('deserializes response telemetry metadata V3 (shape + saved_breakdown)', () => {
    const raw = JSON.parse(
      fs.readFileSync(path.join(FIXTURES, 'notre-response-telemetry-v3.json'), 'utf8'),
    ) as ChatCompletion;
    expect(raw.notre?.shape).toBe('chat');
    expect(raw.notre?.contract_version).toBe(3);
    expect(raw.notre?.saved_breakdown).toEqual({
      cache_hit_tokens: 640,
      dedup_tokens: 20,
      prefilter_tokens: 0,
    });
    if (raw.notre?.input_saved != null && raw.notre.input_before != null && raw.notre.input_sent != null) {
      expect(raw.notre.input_saved).toBe(raw.notre.input_before - raw.notre.input_sent);
    }
  });
});
