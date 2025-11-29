/**
 * Logger utility for operational metrics and debugging
 * Supports structured logging for better observability
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  duration?: number
}

export interface OperationalMetrics {
  requestCount: number
  cacheHits: number
  cacheMisses: number
  averageResponseTime: number
  errorCount: number
}

/**
 * Creates a structured log entry
 */
export function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  duration?: number
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context }),
    ...(duration !== undefined && { duration }),
  }
}

/**
 * Logger class for consistent logging across the application
 */
export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry = createLogEntry(level, message, {
      context: this.context,
      ...meta,
    })
    console.log(JSON.stringify(entry))
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta)
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta)
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta)
  }

  /**
   * Measure and log the duration of an async operation
   */
  async measureTime<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start
      this.info(`${operation} completed`, { duration })
      return { result, duration }
    } catch (error) {
      const duration = Date.now() - start
      this.error(`${operation} failed`, { duration, error: String(error) })
      throw error
    }
  }
}

/**
 * Creates a logger instance for a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context)
}
