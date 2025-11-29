/**
 * Worker Configuration Type Definitions
 * Defines all Cloudflare Workers bindings and environment types
 */

import { Ai } from '@cloudflare/ai';

// Environment bindings interface
interface Env {
  /** KV Namespace for caching agent data */
  AGENT_CACHE: KVNamespace
  /** Cloudflare Workers AI binding */
  AI: Ai
}

// Chat message type for AI interactions
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// AI chat response type
interface AIResponse {
  response?: string
  [key: string]: unknown
}

// Analysis request body type
interface AnalyzeRequestBody {
  data: unknown
  type: string
}

// Chat request body type
interface ChatRequestBody {
  messages?: ChatMessage[]
  prompt?: string
}

// Agent entity type
interface Agent {
  id?: string | number
  name?: string
  description?: string
  [key: string]: unknown
}

// Artifact entity type
interface Artifact {
  id?: string | number
  name?: string
  content?: unknown
  [key: string]: unknown
}

// API error response type
interface APIError {
  error: string
  details?: string
  code?: string
}

// API success response type
interface APISuccess<T = unknown> {
  success: boolean
  data?: T
  id?: string
}

export type {
  Env,
  ChatMessage,
  AIResponse,
  AnalyzeRequestBody,
  ChatRequestBody,
  Agent,
  Artifact,
  APIError,
  APISuccess
}