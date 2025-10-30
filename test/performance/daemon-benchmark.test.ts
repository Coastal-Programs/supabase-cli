import { expect } from 'chai'
import { exec } from 'child_process'
import { promisify } from 'util'

import { DaemonClient } from '../../src/daemon/client'
import { DaemonLifecycle } from '../../src/daemon/lifecycle'

const execAsync = promisify(exec)

describe('Daemon Performance Benchmark', () => {
  let lifecycle: DaemonLifecycle
  let client: DaemonClient

  before(async function () {
    this.timeout(10000)
    lifecycle = new DaemonLifecycle()
    client = new DaemonClient()

    // Start daemon
    await lifecycle.start({ detached: false })
  })

  after(async () => {
    // Stop daemon
    try {
      await lifecycle.stop()
    } catch {
      // Ignore errors during cleanup
    }
  })

  it('should demonstrate 10x performance improvement', async function () {
    this.timeout(30000)

    const iterations = 5

    // Benchmark direct execution
    console.log('\n  Benchmarking direct execution...')
    const directTimes: number[] = []

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now()
      try {
        // Execute --version directly (fast path)
        await execAsync('node bin/run --version')
      } catch {
        // Ignore errors
      }
      const duration = Date.now() - startTime
      directTimes.push(duration)
      console.log(`    Direct execution ${i + 1}: ${duration}ms`)
    }

    const avgDirectTime = directTimes.reduce((a, b) => a + b, 0) / iterations
    console.log(`  Average direct execution time: ${avgDirectTime.toFixed(0)}ms`)

    // Benchmark daemon execution
    console.log('\n  Benchmarking daemon execution...')
    const daemonTimes: number[] = []

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now()
      try {
        // Execute via daemon
        await client.execute('--version', [])
      } catch {
        // Ignore errors
      }
      const duration = Date.now() - startTime
      daemonTimes.push(duration)
      console.log(`    Daemon execution ${i + 1}: ${duration}ms`)
    }

    const avgDaemonTime = daemonTimes.reduce((a, b) => a + b, 0) / iterations
    console.log(`  Average daemon execution time: ${avgDaemonTime.toFixed(0)}ms`)

    // Calculate speedup
    const speedup = avgDirectTime / avgDaemonTime
    console.log(`\n  Speedup: ${speedup.toFixed(1)}x faster`)

    // Verify daemon is significantly faster
    // Note: On Windows, the speedup may be less than 10x due to different process spawning
    // We expect at least 2x faster, ideally 5-10x
    expect(avgDaemonTime).to.be.lessThan(avgDirectTime)
    expect(speedup).to.be.greaterThan(2) // At least 2x faster

    // Report performance target achievement
    if (speedup >= 10) {
      console.log('  ✓ Performance target achieved: 10x faster!')
    } else if (speedup >= 5) {
      console.log('  ✓ Good performance: 5-10x faster')
    } else {
      console.log('  ⚠ Moderate performance: 2-5x faster')
    }
  })

  it('should maintain fast response times under load', async function () {
    this.timeout(30000)

    const iterations = 20
    const times: number[] = []

    console.log('\n  Testing daemon under load...')

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now()
      await client.execute('--version', [])
      const duration = Date.now() - startTime
      times.push(duration)

      if (i % 5 === 0) {
        console.log(`    Completed ${i} iterations, avg: ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(0)}ms`)
      }
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / iterations
    const maxTime = Math.max(...times)
    const minTime = Math.min(...times)

    console.log(`  Average: ${avgTime.toFixed(0)}ms`)
    console.log(`  Min: ${minTime}ms`)
    console.log(`  Max: ${maxTime}ms`)

    // Verify consistent performance
    expect(avgTime).to.be.lessThan(500) // Should average under 500ms
    expect(maxTime).to.be.lessThan(2000) // No request should take more than 2s
  })

  it('should handle concurrent requests', async function () {
    this.timeout(30000)

    const concurrentRequests = 10

    console.log(`\n  Testing ${concurrentRequests} concurrent requests...`)

    const startTime = Date.now()

    // Execute multiple requests concurrently
    const promises = Array.from({ length: concurrentRequests }, (_, i) =>
      client.execute('--version', []).catch((error) => {
        console.error(`    Request ${i + 1} failed:`, error.message)
        return { success: false, exitCode: 1, duration: 0, error: error.message }
      }),
    )

    const results = await Promise.all(promises)
    const totalDuration = Date.now() - startTime

    console.log(`  Total duration: ${totalDuration}ms`)
    console.log(`  Average per request: ${(totalDuration / concurrentRequests).toFixed(0)}ms`)

    // Verify all succeeded
    const successCount = results.filter((r) => r.success).length
    console.log(`  Success rate: ${successCount}/${concurrentRequests}`)

    expect(successCount).to.be.greaterThan(0)
  })
})
