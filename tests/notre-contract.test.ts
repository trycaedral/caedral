import { describe, expect, it } from 'vitest';
import type { ChatCompletionCreateParams } from '../src/types.js';

describe('Notre contract parity (TypeScript SDK)', () => {
  it('serializes notre auto with telemetry', () => {
    const params: ChatCompletionCreateParams = {
      model: 'caedral-base',
      messages: [{ role: 'user', content: 'Hello' }],
      notre: { mode: 'auto', telemetry: true },
    };
    expect(JSON.parse(JSON.stringify(params))).toEqual({
      model: 'caedral-base',
      messages: [{ role: 'user', content: 'Hello' }],
      notre: { mode: 'auto', telemetry: true },
    });
  });

  it('omits notre when unset (backward compatible)', () => {
    const params: ChatCompletionCreateParams = {
      model: 'm',
      messages: [{ role: 'user', content: 'x' }],
    };
    expect(JSON.parse(JSON.stringify(params))).not.toHaveProperty('notre');
  });
});
