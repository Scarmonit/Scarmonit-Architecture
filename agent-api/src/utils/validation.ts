/**
 * Validation utilities for request/response validation
 * Improves accuracy by ensuring data integrity
 */

import { createLogger } from './logger'

const logger = createLogger('Validation')

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  messages?: ChatMessage[]
  prompt?: string
}

export interface AnalyzeRequest {
  data: unknown
  type: string
}

export interface AgentRequest {
  id?: string
  name: string
  type: string
  config?: Record<string, unknown>
}

/**
 * Validates that a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validates that a value is a valid chat message
 */
export function isValidChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const obj = value as Record<string, unknown>
  const validRoles = ['user', 'assistant', 'system']
  return (
    typeof obj.role === 'string' &&
    validRoles.includes(obj.role) &&
    isNonEmptyString(obj.content)
  )
}

/**
 * Validates a chat request
 */
export function validateChatRequest(body: unknown): ValidationResult {
  const errors: string[] = []

  if (typeof body !== 'object' || body === null) {
    return { valid: false, errors: ['Request body must be an object'] }
  }

  const request = body as Record<string, unknown>

  // Must have either messages or prompt
  if (!request.messages && !request.prompt) {
    errors.push('Request must include either "messages" array or "prompt" string')
  }

  // Validate messages if provided
  if (request.messages !== undefined) {
    if (!Array.isArray(request.messages)) {
      errors.push('"messages" must be an array')
    } else if (request.messages.length === 0) {
      errors.push('"messages" array cannot be empty')
    } else {
      request.messages.forEach((msg, idx) => {
        if (!isValidChatMessage(msg)) {
          errors.push(`Invalid message at index ${idx}: must have valid role and content`)
        }
      })
    }
  }

  // Validate prompt if provided
  if (request.prompt !== undefined && !isNonEmptyString(request.prompt)) {
    errors.push('"prompt" must be a non-empty string')
  }

  const result = { valid: errors.length === 0, errors }
  if (!result.valid) {
    logger.warn('Chat request validation failed', { errors })
  }
  return result
}

/**
 * Validates an analyze request
 */
export function validateAnalyzeRequest(body: unknown): ValidationResult {
  const errors: string[] = []

  if (typeof body !== 'object' || body === null) {
    return { valid: false, errors: ['Request body must be an object'] }
  }

  const request = body as Record<string, unknown>

  if (request.data === undefined) {
    errors.push('"data" field is required')
  }

  if (!isNonEmptyString(request.type)) {
    errors.push('"type" must be a non-empty string')
  }

  const result = { valid: errors.length === 0, errors }
  if (!result.valid) {
    logger.warn('Analyze request validation failed', { errors })
  }
  return result
}

/**
 * Validates an agent request
 */
export function validateAgentRequest(body: unknown): ValidationResult {
  const errors: string[] = []

  if (typeof body !== 'object' || body === null) {
    return { valid: false, errors: ['Request body must be an object'] }
  }

  const request = body as Record<string, unknown>

  if (!isNonEmptyString(request.name)) {
    errors.push('"name" must be a non-empty string')
  }

  if (!isNonEmptyString(request.type)) {
    errors.push('"type" must be a non-empty string')
  }

  const result = { valid: errors.length === 0, errors }
  if (!result.valid) {
    logger.warn('Agent request validation failed', { errors })
  }
  return result
}

/**
 * Extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

/**
 * Creates a validation error response
 */
export function createValidationErrorResponse(result: ValidationResult): {
  error: string
  details: string[]
} {
  return {
    error: 'Validation Error',
    details: result.errors,
  }
}
