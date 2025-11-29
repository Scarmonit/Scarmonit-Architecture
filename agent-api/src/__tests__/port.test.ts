/**
 * Tests for port utility functions
 *
 * Test cases:
 * - getDefaultConfig returns correct defaults
 * - getLocalUrl constructs proper URL
 */

import { DEFAULT_DEV_PORT, getDefaultConfig, getLocalUrl } from '../utils/port'

// Simple assertion helper
function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`)
  }
}

// Test: DEFAULT_DEV_PORT is 8787
export function testDefaultPort(): boolean {
  assertEqual(DEFAULT_DEV_PORT, 8787, 'Default port should be 8787')
  return true
}

// Test: getDefaultConfig returns correct config
export function testGetDefaultConfig(): boolean {
  const config = getDefaultConfig()
  assertEqual(config.port, 8787, 'Port should be 8787')
  assertEqual(config.host, 'localhost', 'Host should be localhost')
  return true
}

// Test: getLocalUrl constructs URL correctly
export function testGetLocalUrl(): boolean {
  const url = getLocalUrl()
  assertEqual(url, 'http://localhost:8787', 'URL should be http://localhost:8787')

  const customUrl = getLocalUrl({ port: 3000, host: '0.0.0.0' })
  assertEqual(customUrl, 'http://0.0.0.0:3000', 'Custom URL should match')
  return true
}

// Run all tests
export function runTests(): void {
  console.log('Running port.test.ts...')
  testDefaultPort()
  testGetDefaultConfig()
  testGetLocalUrl()
  console.log('All port tests passed!')
}
