import { describe, it, expect } from 'vitest';
import app from '../index';

describe('API Endpoints', () => {
  it('GET / returns operational status', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(expect.objectContaining({
      status: 'operational',
      agent: 'active',
      framework: 'Hono'
    }));
  });

  it('GET /health returns healthy status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'healthy' });
  });
});
