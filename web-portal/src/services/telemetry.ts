/**
 * Telemetry Service - Error tracking and performance monitoring
 *
 * Captures tool execution metrics, errors, and system events for debugging.
 */

export interface TelemetryConfig {
  enabled: boolean
  maxEvents: number
  consoleOutput: boolean
  persistToStorage: boolean
}

export interface ErrorEvent {
  type: 'error'
  category: 'mcp' | 'network' | 'ui' | 'unknown'
  message: string
  stack?: string
  context?: Record<string, unknown>
  timestamp: number
}

export interface PerformanceEvent {
  type: 'performance'
  operation: string
  duration: number
  success: boolean
  metadata?: Record<string, unknown>
  timestamp: number
}

export interface HealthEvent {
  type: 'health'
  service: string
  status: 'online' | 'offline' | 'degraded'
  responseTime?: number
  timestamp: number
}

export type TelemetryEvent = ErrorEvent | PerformanceEvent | HealthEvent

export class TelemetryService {
  private events: TelemetryEvent[] = []
  private config: TelemetryConfig

  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      maxEvents: config.maxEvents ?? 1000,
      consoleOutput: config.consoleOutput ?? false,
      persistToStorage: config.persistToStorage ?? false,
    }

    if (this.config.persistToStorage) {
      this.loadFromStorage()
    }
  }

  /**
   * Track an error event
   */
  trackError(
    message: string,
    category: ErrorEvent['category'] = 'unknown',
    context?: Record<string, unknown>
  ): void {
    if (!this.config.enabled) return

    const event: ErrorEvent = {
      type: 'error',
      category,
      message,
      context,
      timestamp: Date.now(),
    }

    this.addEvent(event)

    if (this.config.consoleOutput) {
      console.error(`[Telemetry Error] ${category}:`, message, context)
    }
  }

  /**
   * Track a performance event
   */
  trackPerformance(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.config.enabled) return

    const event: PerformanceEvent = {
      type: 'performance',
      operation,
      duration,
      success,
      metadata,
      timestamp: Date.now(),
    }

    this.addEvent(event)

    if (this.config.consoleOutput) {
      console.log(`[Telemetry Performance] ${operation}: ${duration}ms (${success ? 'success' : 'failed'})`)
    }
  }

  /**
   * Track a health check event
   */
  trackHealth(
    service: string,
    status: HealthEvent['status'],
    responseTime?: number
  ): void {
    if (!this.config.enabled) return

    const event: HealthEvent = {
      type: 'health',
      service,
      status,
      responseTime,
      timestamp: Date.now(),
    }

    this.addEvent(event)

    if (this.config.consoleOutput) {
      console.log(`[Telemetry Health] ${service}: ${status} (${responseTime}ms)`)
    }
  }

  /**
   * Get all events
   */
  getEvents(filter?: { type?: TelemetryEvent['type']; limit?: number }): TelemetryEvent[] {
    let filtered = this.events

    if (filter?.type) {
      filtered = filtered.filter(e => e.type === filter.type)
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit)
    }

    return [...filtered]
  }

  /**
   * Get error summary
   */
  getErrorSummary(): {
    total: number
    byCategory: Record<string, number>
    recent: ErrorEvent[]
  } {
    const errors = this.events.filter((e): e is ErrorEvent => e.type === 'error')

    const byCategory: Record<string, number> = {}
    errors.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1
    })

    return {
      total: errors.length,
      byCategory,
      recent: errors.slice(-10),
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    operations: Record<string, {
      count: number
      avgDuration: number
      successRate: number
    }>
  } {
    const perfEvents = this.events.filter((e): e is PerformanceEvent => e.type === 'performance')

    const operations: Record<string, {
      count: number
      totalDuration: number
      successes: number
      avgDuration: number
      successRate: number
    }> = {}

    perfEvents.forEach(e => {
      if (!operations[e.operation]) {
        operations[e.operation] = {
          count: 0,
          totalDuration: 0,
          successes: 0,
          avgDuration: 0,
          successRate: 0,
        }
      }

      const op = operations[e.operation]
      op.count++
      op.totalDuration += e.duration
      if (e.success) op.successes++
    })

    // Calculate averages
    Object.values(operations).forEach(op => {
      op.avgDuration = Math.round(op.totalDuration / op.count)
      op.successRate = Math.round((op.successes / op.count) * 100)
    })

    return { operations }
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = []
    if (this.config.persistToStorage) {
      localStorage.removeItem('scarmonit_telemetry')
    }
  }

  /**
   * Export events as JSON
   */
  export(): string {
    return JSON.stringify({
      events: this.events,
      summary: {
        errors: this.getErrorSummary(),
        performance: this.getPerformanceMetrics(),
      },
      exportedAt: new Date().toISOString(),
    }, null, 2)
  }

  private addEvent(event: TelemetryEvent): void {
    this.events.push(event)

    // Maintain max size
    if (this.events.length > this.config.maxEvents) {
      this.events.shift()
    }

    // Persist if enabled
    if (this.config.persistToStorage) {
      this.saveToStorage()
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('scarmonit_telemetry', JSON.stringify(this.events))
    } catch (error) {
      console.warn('Failed to persist telemetry to storage:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('scarmonit_telemetry')
      if (stored) {
        this.events = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load telemetry from storage:', error)
    }
  }
}

// Singleton instance
let telemetryInstance: TelemetryService | null = null

export function getTelemetry(config?: Partial<TelemetryConfig>): TelemetryService {
  if (!telemetryInstance) {
    telemetryInstance = new TelemetryService(config)
  }
  return telemetryInstance
}
