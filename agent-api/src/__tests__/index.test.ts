import { describe, it, expect } from 'vitest';
import app from '../index';

describe('Main API Endpoints', () => {
  it('GET / returns operational status', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      status: 'operational',
      agent: 'active',
      framework: 'Hono'
    });
  });

  it('GET /health returns healthy status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'healthy' });
  });

  it('POST /api/chat with valid body returns response', async () => {
    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('response');
  });

  it('POST /api/chat with invalid JSON returns 400', async () => {
    const res = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ invalid json '
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/analyze with missing type returns 400', async () => {
    const res = await app.request('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: { some: 'data' } })
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/agents creates new agent', async () => {
    const agentData = { id: 'test-agent', name: 'Test Agent', role: 'Tester' };
    const res = await app.request('/api/agents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(agentData)
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('id', 'agent:test-agent');
  });

  it('GET /api/agents returns list of agents', async () => {
    const res = await app.request('/api/agents');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    const found = (body as any[]).find((a: any) => a.id === 'test-agent');
    expect(found).toBeTruthy();
  });
});
