/**
 * Tests for artifacts and logs CRUD endpoints
 *
 * TODO: Set up KV mocking for integration tests
 *
 * Test cases to implement:
 * - GET /api/artifacts returns empty array when no artifacts exist
 * - POST /api/artifacts creates artifact with generated ID
 * - POST /api/artifacts uses provided ID if given
 * - GET /api/logs returns empty array when no logs exist
 */

// Mock data for testing
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
