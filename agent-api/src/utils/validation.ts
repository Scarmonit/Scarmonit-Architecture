/**
 * Validation utilities for request/response validation
 * Improves accuracy by ensuring data integrity
 */

import { createLogger } from './logger'
import { VALIDATION_LIMITS } from '../config/constants'

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
 * Validates that a value is a non-empty string.
 * 
 * @param value - The value to check
 * @returns True if value is a non-empty string after trimming whitespace
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validates that a value is a valid chat message.
 * 
 * @param value - The value to check
 * @returns True if value is a valid ChatMessage with role and content
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
 * Calculates the approximate size of a JSON-serializable object.
 * Used for input size validation to prevent memory issues.
 * 
 * @param data - The data to measure
 * @returns The approximate size in bytes
 */
export function getDataSize(data: unknown): number {
  try {
    return JSON.stringify(data).length
  } catch {
    return 0
  }
}

/**
 * Validates a chat request.
 * 
 * @param body - The request body to validate
 * @returns ValidationResult with valid flag and any error messages
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
    } else if (request.messages.length > VALIDATION_LIMITS.MAX_MESSAGES) {
      errors.push(`"messages" array exceeds maximum length of ${VALIDATION_LIMITS.MAX_MESSAGES}`)
    } else {
      request.messages.forEach((msg, idx) => {
        if (!isValidChatMessage(msg)) {
          errors.push(`Invalid message at index ${idx}: must have valid role and content`)
        } else if (typeof msg.content === 'string' && msg.content.length > VALIDATION_LIMITS.MAX_CONTENT_LENGTH) {
          errors.push(`Message at index ${idx} exceeds maximum content length of ${VALIDATION_LIMITS.MAX_CONTENT_LENGTH}`)
        }
      })
    }
  }

  // Validate prompt if provided
  if (request.prompt !== undefined) {
    if (!isNonEmptyString(request.prompt)) {
      errors.push('"prompt" must be a non-empty string')
    } else if (typeof request.prompt === 'string' && request.prompt.length > VALIDATION_LIMITS.MAX_PROMPT_LENGTH) {
      errors.push(`"prompt" exceeds maximum length of ${VALIDATION_LIMITS.MAX_PROMPT_LENGTH}`)
    }
  }

  const result = { valid: errors.length === 0, errors }
  if (!result.valid) {
    logger.warn('Chat request validation failed', { errors })
  }
  return result
}

/**
 * Validates an analyze request with input size limits.
 * 
 * @param body - The request body to validate
 * @returns ValidationResult with valid flag and any error messages
 */
export function validateAnalyzeRequest(body: unknown): ValidationResult {
  const errors: string[] = []

  if (typeof body !== 'object' || body === null) {
    return { valid: false, errors: ['Request body must be an object'] }
  }

  const request = body as Record<string, unknown>

  if (request.data === undefined) {
    errors.push('"data" field is required')
  } else {
    // Validate data size to prevent oversized payloads
    const dataSize = getDataSize(request.data)
    if (dataSize > VALIDATION_LIMITS.MAX_CONTENT_LENGTH) {
      errors.push(`"data" field exceeds maximum size of ${VALIDATION_LIMITS.MAX_CONTENT_LENGTH} bytes`)
    }
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
 * Validates an agent request.
 * 
 * @param body - The request body to validate
 * @returns ValidationResult with valid flag and any error messages
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
 * Extracts error message from unknown error type.
 * Safely handles Error objects, strings, and other types.
 * 
 * @param error - The error to extract message from
 * @returns A string error message
 * 
 * @example
 * getErrorMessage(new Error('Something failed')) // 'Something failed'
 * getErrorMessage('Direct error string') // 'Direct error string'
 * getErrorMessage({ unexpected: 'object' }) // 'An unknown error occurred'
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
 * Creates a validation error response object for API responses.
 * 
 * @param result - The validation result containing errors
 * @returns A structured error response object
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
