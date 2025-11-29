/**
 * React Hook for MCP Health Monitoring
 *
 * Provides real-time health status with auto-refresh and error handling.
 */

import { useState, useEffect, useCallback } from 'react'
import { getMCPRouter } from '../services/mcpRouter'
import type { SystemHealthStatus, DataloreStatus, DockerStatus, KubernetesStatus } from '../services/mcpRouter'

interface HealthCheckOptions {
  enableAutoRefresh?: boolean
  refreshInterval?: number
  runOnMount?: boolean
}

export interface HealthCheckState {
  system: SystemHealthStatus | null
  datalore: DataloreStatus | null
  docker: DockerStatus | null
  kubernetes: KubernetesStatus | null
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
}

export function useMCPHealth(options: HealthCheckOptions = {}) {
  const {
    enableAutoRefresh = true,
    refreshInterval = Number(import.meta.env.VITE_HEALTH_CHECK_INTERVAL) || 30000,
    runOnMount = true,
  } = options

  const router = getMCPRouter()

  const [state, setState] = useState<HealthCheckState>({
    system: null,
    datalore: null,
    docker: null,
    kubernetes: null,
    isLoading: false,
    error: null,
    lastUpdate: null,
  })

  const runHealthCheck = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const results = await router.runFullHealthCheck()

      setState({
        system: results.system,
        datalore: results.datalore,
        docker: results.docker,
        kubernetes: results.kubernetes,
        isLoading: false,
        error: null,
        lastUpdate: new Date(),
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      }))
    }
  }, [router])

  // Run on mount
  useEffect(() => {
    if (runOnMount) {
      runHealthCheck()
    }
  }, [runOnMount, runHealthCheck])

  // Auto-refresh
  useEffect(() => {
    if (!enableAutoRefresh) return

    const interval = setInterval(runHealthCheck, refreshInterval)
    return () => clearInterval(interval)
  }, [enableAutoRefresh, refreshInterval, runHealthCheck])

  return {
    ...state,
    refresh: runHealthCheck,
  }
}
