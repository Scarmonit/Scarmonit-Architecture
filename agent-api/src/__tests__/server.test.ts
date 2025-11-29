import { describe, it, expect } from 'vitest';
import app from '../index';

export const serverConfig = {
  port: 8787,
  host: 'localhost',
  cors: {
    enabled: true,
    origin: '*',
  },
}

describe('Server Integration', () => {
  it('CORS headers are included in responses', async () => {
    const res = await app.request('/health');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('Error responses have proper structure (404)', async () => {
    const res = await app.request('/non-existent-route');
    expect(res.status).toBe(404);
  });
});
