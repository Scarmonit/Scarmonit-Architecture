/**
 * MCP Router Test Harness
 *
 * Simulates MCP tool calls and validates routing behavior.
 * Run manually in browser console or via test framework.
 */

import { getMCPRouter } from './mcpRouter'
import { getTelemetry } from './telemetry'

export interface TestResult {
  testName: string
  passed: boolean
  duration: number
  error?: string
  details?: unknown
}

export class MCPRouterTester {
  private router = getMCPRouter()
  private telemetry = getTelemetry()
  private results: TestResult[] = []

  /**
   * Run all tests
   */
  async runAllTests(): Promise<{
    total: number
    passed: number
    failed: number
    results: TestResult[]
  }> {
    console.log('🧪 Starting MCP Router Test Suite...\n')

    this.results = []

    await this.testSystemHealth()
    await this.testDataloreStatus()
    await this.testDockerStatus()
    await this.testKubernetesStatus()
    await this.testFullHealthCheck()
    await this.testMCPHealth()
    await this.testTelemetryTracking()
    await this.testErrorHandling()

    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length

    console.log('\n📊 Test Results Summary:')
    console.log(`Total: ${this.results.length}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)

    return {
      total: this.results.length,
      passed,
      failed,
      results: this.results,
    }
  }

  private async testSystemHealth(): Promise<void> {
    await this.runTest('System Health Check', async () => {
      const result = await this.router.getSystemHealth()

      if (!result.overall) throw new Error('Missing overall status')
      if (!Array.isArray(result.services)) throw new Error('Services not an array')
      if (!(result.lastCheck instanceof Date)) throw new Error('Invalid lastCheck date')

      return result
    })
  }

  private async testDataloreStatus(): Promise<void> {
    await this.runTest('Datalore Status Check', async () => {
      const result = await this.router.getDataloreStatus()

      if (typeof result.connected !== 'boolean') throw new Error('Invalid connected status')
      if (!result.statusMessage) throw new Error('Missing status message')
      if (!Array.isArray(result.features)) throw new Error('Features not an array')

      return result
    })
  }

  private async testDockerStatus(): Promise<void> {
    await this.runTest('Docker Status Check', async () => {
      const result = await this.router.getDockerStatus()

      if (typeof result.total !== 'number') throw new Error('Invalid total count')
      if (typeof result.running !== 'number') throw new Error('Invalid running count')
      if (!Array.isArray(result.containers)) throw new Error('Containers not an array')

      return result
    })
  }

  private async testKubernetesStatus(): Promise<void> {
    await this.runTest('Kubernetes Status Check', async () => {
      const result = await this.router.getKubernetesStatus()

      if (typeof result.healthy !== 'boolean') throw new Error('Invalid healthy status')
      if (!Array.isArray(result.pods)) throw new Error('Pods not an array')
      if (!Array.isArray(result.deployments)) throw new Error('Deployments not an array')

      return result
    })
  }

  private async testFullHealthCheck(): Promise<void> {
    await this.runTest('Full Health Check', async () => {
      const result = await this.router.runFullHealthCheck()

      if (!result.system) throw new Error('Missing system health')
      if (!result.datalore) throw new Error('Missing datalore status')
      if (!result.docker) throw new Error('Missing docker status')
      if (!result.kubernetes) throw new Error('Missing kubernetes status')

      return result
    })
  }

  private async testMCPHealth(): Promise<void> {
    await this.runTest('MCP Services Health', async () => {
      const result = await this.router.checkMCPHealth()

      if (typeof result.agentApi !== 'boolean') throw new Error('Invalid agentApi status')
      if (typeof result.scarmonit !== 'boolean') throw new Error('Invalid scarmonit status')
      if (typeof result.devops !== 'boolean') throw new Error('Invalid devops status')

      return result
    })
  }

  private async testTelemetryTracking(): Promise<void> {
    await this.runTest('Telemetry Tracking', async () => {
      const beforeCount = this.router.getTelemetry().length

      // Make a call to trigger telemetry
      await this.router.getSystemHealth()

      const afterCount = this.router.getTelemetry().length

      if (afterCount <= beforeCount) {
        throw new Error('Telemetry not tracked')
      }

      const events = this.router.getTelemetry()
      const lastEvent = events[events.length - 1]

      if (!lastEvent.timestamp) throw new Error('Missing timestamp')
      if (!lastEvent.type) throw new Error('Missing event type')

      return { eventsTracked: afterCount - beforeCount, lastEvent }
    })
  }

  private async testErrorHandling(): Promise<void> {
    await this.runTest('Error Handling', async () => {
      // This should handle errors gracefully and return default values
      const dockerResult = await this.router.getDockerStatus()

      // Even if API fails, we should get a valid structure
      if (dockerResult.total === undefined) throw new Error('Invalid error handling')

      return { handled: true }
    })
  }

  private async runTest(
    name: string,
    testFn: () => Promise<unknown>
  ): Promise<void> {
    const startTime = Date.now()

    try {
      console.log(`🔬 Running: ${name}`)

      const details = await testFn()

      const duration = Date.now() - startTime

      this.results.push({
        testName: name,
        passed: true,
        duration,
        details,
      })

      console.log(`  ✅ PASSED (${duration}ms)`)
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      this.results.push({
        testName: name,
        passed: false,
        duration,
        error: errorMessage,
      })

      console.log(`  ❌ FAILED (${duration}ms): ${errorMessage}`)
    }
  }

  /**
   * Export test results
   */
  exportResults(): string {
    return JSON.stringify({
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
      },
      telemetry: {
        errors: this.telemetry.getErrorSummary(),
        performance: this.telemetry.getPerformanceMetrics(),
      },
      timestamp: new Date().toISOString(),
    }, null, 2)
  }
}

// Expose to global scope for browser console testing
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).MCPRouterTester = MCPRouterTester
}

/**
 * Quick test runner for browser console
 */
export async function quickTest(): Promise<void> {
  const tester = new MCPRouterTester()
  const results = await tester.runAllTests()

  console.log('\n📄 Full Results:')
  console.table(results.results)

  console.log('\n💾 Export results to file:')
  console.log('copy(new MCPRouterTester().exportResults())')
}

// Expose quick test to global scope
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testMCPRouter = quickTest
}
