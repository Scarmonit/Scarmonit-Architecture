/**
 * Application constants for agent-api
 */

// AI Model configuration
export const AI_MODEL = '@cf/meta/llama-3-8b-instruct'

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  AI_RESPONSE: 3600, // 1 hour
  AGENT_DATA: 7200, // 2 hours
  METRICS: 300, // 5 minutes
} as const

// Rate limiting configuration
export const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 60,
  WINDOW_SIZE_SECONDS: 60,
} as const

// Validation limits
export const VALIDATION_LIMITS = {
  MAX_PROMPT_LENGTH: 10000,
  MAX_MESSAGES: 50,
  MAX_CONTENT_LENGTH: 5000,
} as const

// Cache key prefixes
export const CACHE_PREFIXES = {
  AGENT: 'agent:',
  ARTIFACT: 'artifact:',
  LOG: 'log:',
  AI_RESPONSE: 'ai:',
  METRICS: 'metrics:',
} as const

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const
