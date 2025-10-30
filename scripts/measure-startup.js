#!/usr/bin/env node

/**
 * Measure startup time for CLI
 * Usage: node scripts/measure-startup.js <path-to-cli> [iterations]
 */

const { execSync } = require('child_process')
const path = require('path')

const cliPath = process.argv[2] || './bin/run'
const iterations = parseInt(process.argv[3] || '10', 10)

console.log(`Measuring startup time for: ${cliPath}`)
console.log(`Iterations: ${iterations}\n`)

const times = []

for (let i = 0; i < iterations; i++) {
  const start = Date.now()

  try {
    // Use node to run the script if it's not an .exe
    const command = cliPath.endsWith('.exe')
      ? `"${path.resolve(cliPath)}" --version`
      : `node "${path.resolve(cliPath)}" --version`

    execSync(command, {
      stdio: 'pipe',
      timeout: 30000,
      windowsHide: true
    })
  } catch (error) {
    console.error(`Error on iteration ${i + 1}:`, error.message)
    continue
  }

  const duration = Date.now() - start
  times.push(duration)

  process.stdout.write(`Iteration ${i + 1}/${iterations}: ${duration}ms\r`)
}

console.log('\n')

if (times.length === 0) {
  console.error('No successful measurements')
  process.exit(1)
}

// Calculate statistics
const sum = times.reduce((a, b) => a + b, 0)
const avg = sum / times.length
const min = Math.min(...times)
const max = Math.max(...times)
const sorted = [...times].sort((a, b) => a - b)
const median = sorted[Math.floor(sorted.length / 2)]

console.log('Results:')
console.log(`  Average: ${avg.toFixed(2)}ms`)
console.log(`  Median:  ${median}ms`)
console.log(`  Min:     ${min}ms`)
console.log(`  Max:     ${max}ms`)
console.log(`  Range:   ${max - min}ms`)

// Calculate standard deviation
const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length
const stdDev = Math.sqrt(variance)
console.log(`  Std Dev: ${stdDev.toFixed(2)}ms`)
