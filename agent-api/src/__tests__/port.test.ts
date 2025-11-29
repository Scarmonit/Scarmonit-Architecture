import { describe, it, expect } from 'vitest';
import { DEFAULT_DEV_PORT, getDefaultConfig, getLocalUrl } from '../utils/port';

describe('Port Utils', () => {
  it('DEFAULT_DEV_PORT is 8787', () => {
    expect(DEFAULT_DEV_PORT).toBe(8787);
  });

  it('getDefaultConfig returns correct config', () => {
    const config = getDefaultConfig();
    expect(config.port).toBe(8787);
    expect(config.host).toBe('localhost');
  });

  it('getLocalUrl constructs URL correctly', () => {
    const url = getLocalUrl();
    expect(url).toBe('http://localhost:8787');

    const customUrl = getLocalUrl({ port: 3000, host: '0.0.0.0' });
    expect(customUrl).toBe('http://0.0.0.0:3000');
  });
});
