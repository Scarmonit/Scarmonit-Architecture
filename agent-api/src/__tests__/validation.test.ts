import { describe, it, expect } from 'vitest';
import app from '../index';

describe('input validation', () => {
  it('chat rejects invalid payload', async () => {
    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 123, content: true }] })
    });
    expect(res.status).toBe(400);
  });

  it('analyze rejects missing type', async () => {
    const res = await app.request('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: { foo: 'bar' } })
    });
    expect(res.status).toBe(400);
  });

  it('agents rejects invalid body', async () => {
    const res = await app.request('/api/agents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Missing ID', role: 'tester' })
    });
    expect(res.status).toBe(400);
  });

  it('artifacts rejects invalid body', async () => {
    const res = await app.request('/api/artifacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'report', content: 'x' })
    });
    expect(res.status).toBe(400);
  });
});
