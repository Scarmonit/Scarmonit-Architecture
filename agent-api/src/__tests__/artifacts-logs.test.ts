import { describe, it, expect } from 'vitest';
import app from '../index';

export const mockArtifact = {
  id: 'test-artifact-1',
  name: 'Test Artifact',
  type: 'code',
  content: '// test code',
}

export const mockLog = {
  id: 'test-log-1',
  level: 'info',
  message: 'Test log message',
  timestamp: new Date().toISOString(),
}

describe('Artifacts and Logs', () => {
  it('GET /api/artifacts returns array', async () => {
    const res = await app.request('/api/artifacts');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('POST /api/artifacts creates artifact', async () => {
    const artifact = { id: 'generated-test-id', type: 'code', content: 'console.log("hello")' };
    const res = await app.request('/api/artifacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(artifact)
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('id', 'artifact:generated-test-id');
  });

  it('POST /api/artifacts uses provided ID', async () => {
    const artifact = { id: 'custom-id', type: 'text', content: 'hello' };
    const res = await app.request('/api/artifacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(artifact)
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id', 'artifact:custom-id');
  });

  it('GET /api/logs returns array', async () => {
    const res = await app.request('/api/logs');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
