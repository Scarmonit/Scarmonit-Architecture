// API constants for Scarmonit Agent API

export const API_VERSION = 'v1'

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const

export const AI_MODELS = {
  LLAMA_3_8B: '@cf/meta/llama-3-8b-instruct',
  LLAMA_2_7B: '@cf/meta/llama-2-7b-chat-int8',
} as const

export const CACHE_PREFIXES = {
  AGENT: 'agent:',
  ARTIFACT: 'artifact:',
  LOG: 'log:',
} as const

export const DEFAULT_CACHE_TTL = 3600 // 1 hour in seconds

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const
