import { describe, it, expect } from 'vitest';
import app from '../index';

describe('chat and logs extra', () => {
  it('chat falls back to prompt if messages missing', async () => {
    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'Hello' })
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toBeDefined();
  });

  it('logs structure is an array', async () => {
    const res = await app.request('/api/logs');
    expect(res.status).toBe(200);
    const logs = await res.json();
    expect(Array.isArray(logs)).toBe(true);
  });
});
