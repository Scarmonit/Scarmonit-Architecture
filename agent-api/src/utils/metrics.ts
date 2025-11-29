/**
 * Metrics utility for operational efficiency tracking
 * Tracks processing time, cache performance, and resource utilization
 */

import { createLogger } from './logger'

const logger = createLogger('Metrics')

export interface RequestMetrics {
  endpoint: string
  method: string
  statusCode: number
  duration: number
  cached: boolean
  timestamp: string
}

export interface AggregatedMetrics {
  totalRequests: number
  averageResponseTime: number
  cacheHitRate: number
  errorRate: number
  requestsByEndpoint: Record<string, number>
  lastUpdated: string
}

/**
 * In-memory metrics collector for edge efficiency
 * Note: In a distributed environment, metrics should be aggregated externally
 */
export class MetricsCollector {
  private metrics: RequestMetrics[] = []
  private maxSize: number
  private errorCount = 0

  constructor(maxSize = 1000) {
    this.maxSize = maxSize
  }

  /**
   * Record a request metric
   */
  record(metric: Omit<RequestMetrics, 'timestamp'>): void {
    const fullMetric: RequestMetrics = {
      ...metric,
      timestamp: new Date().toISOString(),
    }

    this.metrics.push(fullMetric)
    
    // Track errors
    if (metric.statusCode >= 400) {
      this.errorCount++
    }

    // Maintain max size (FIFO)
    if (this.metrics.length > this.maxSize) {
      this.metrics.shift()
    }

    logger.debug('Metric recorded', {
      endpoint: metric.endpoint,
      duration: metric.duration,
      cached: metric.cached,
    })
  }

  /**
   * Get aggregated metrics
   */
  getAggregated(): AggregatedMetrics {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        requestsByEndpoint: {},
        lastUpdated: new Date().toISOString(),
      }
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0)
    const cacheHits = this.metrics.filter((m) => m.cached).length
    const errorRequests = this.metrics.filter((m) => m.statusCode >= 400).length

    const requestsByEndpoint = this.metrics.reduce((acc, m) => {
      acc[m.endpoint] = (acc[m.endpoint] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalRequests: this.metrics.length,
      averageResponseTime: Math.round(totalDuration / this.metrics.length),
      cacheHitRate: Math.round((cacheHits / this.metrics.length) * 100) / 100,
      errorRate: Math.round((errorRequests / this.metrics.length) * 100) / 100,
      requestsByEndpoint,
      lastUpdated: new Date().toISOString(),
    }
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = []
    this.errorCount = 0
    logger.info('Metrics reset')
  }

  /**
   * Get recent metrics (for debugging)
   */
  getRecent(count = 10): RequestMetrics[] {
    return this.metrics.slice(-count)
  }
}

// Singleton instance for the worker
let metricsInstance: MetricsCollector | null = null

/**
 * Get or create the metrics collector instance
 */
export function getMetricsCollector(maxSize?: number): MetricsCollector {
  if (!metricsInstance) {
    metricsInstance = new MetricsCollector(maxSize)
  }
  return metricsInstance
}

/**
 * Middleware helper to time requests
 */
export function createTimingMiddleware(): {
  start: () => number
  end: (startTime: number) => number
} {
  return {
    start: () => Date.now(),
    end: (startTime: number) => Date.now() - startTime,
  }
}
