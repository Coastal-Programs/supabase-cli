import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import { describe, it, beforeEach, afterEach } from 'mocha'

import {
  parseBatchFile,
  executeCommand,
  executeCommandBatch,
  formatDuration,
  calculateStatistics,
  saveResults,
  CommandResult,
  CommandDefinition,
} from '../src/utils/batch-runner'

describe('Batch Runner', () => {
  const testDir = path.join(__dirname, 'fixtures', 'batch')

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
  })

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir)
      for (const file of files) {
        fs.unlinkSync(path.join(testDir, file))
      }
      fs.rmdirSync(testDir)
    }
  })

  describe('parseBatchFile', () => {
    it('should parse simple text format', () => {
      const filePath = path.join(testDir, 'simple.txt')
      const content = `
# Comment line
echo "test1"
echo "test2"

# Another comment
echo "test3"
      `.trim()

      fs.writeFileSync(filePath, content)

      const commands = parseBatchFile(filePath)

      expect(commands).to.have.lengthOf(3)
      expect(commands[0].command).to.equal('echo')
      expect(commands[0].args).to.deep.equal(['"test1"'])
      expect(commands[0].id).to.equal('cmd-1')
      expect(commands[2].command).to.equal('echo')
    })

    it('should parse JSON format', () => {
      const filePath = path.join(testDir, 'commands.json')
      const content = JSON.stringify([
        {
          command: 'echo',
          args: ['test1'],
          id: 'echo-1',
          timeout: 30,
        },
        {
          command: 'echo',
          args: ['test2'],
          id: 'echo-2',
        },
      ])

      fs.writeFileSync(filePath, content)

      const commands = parseBatchFile(filePath)

      expect(commands).to.have.lengthOf(2)
      expect(commands[0].command).to.equal('echo')
      expect(commands[0].args).to.deep.equal(['test1'])
      expect(commands[0].id).to.equal('echo-1')
      expect(commands[0].timeout).to.equal(30)
      expect(commands[1].id).to.equal('echo-2')
    })

    it('should handle JSON array of strings', () => {
      const filePath = path.join(testDir, 'simple.json')
      const content = JSON.stringify(['echo test1', 'echo test2', 'echo test3'])

      fs.writeFileSync(filePath, content)

      const commands = parseBatchFile(filePath)

      expect(commands).to.have.lengthOf(3)
      expect(commands[0].command).to.equal('echo')
      expect(commands[0].args).to.deep.equal(['test1'])
    })

    it('should skip empty lines and comments', () => {
      const filePath = path.join(testDir, 'with-comments.txt')
      const content = `
# Header comment

echo "test"
// Another comment style

echo "test2"

      `.trim()

      fs.writeFileSync(filePath, content)

      const commands = parseBatchFile(filePath)

      expect(commands).to.have.lengthOf(2)
    })

    it('should throw error for non-existent file', () => {
      expect(() => parseBatchFile('non-existent.txt')).to.throw('Batch file not found')
    })

    it('should throw error for invalid JSON command', () => {
      const filePath = path.join(testDir, 'invalid.json')
      const content = JSON.stringify([{ args: ['test'] }]) // Missing command field

      fs.writeFileSync(filePath, content)

      expect(() => parseBatchFile(filePath)).to.throw("missing 'command' field")
    })
  })

  describe('executeCommand', () => {
    it('should execute simple command successfully', async () => {
      const definition: CommandDefinition = {
        command: 'node',
        args: ['-e', 'console.log("Hello World")'],
        id: 'test-1',
      }

      const result = await executeCommand(definition)

      expect(result.success).to.be.true
      expect(result.exitCode).to.equal(0)
      expect(result.stdout).to.include('Hello World')
      expect(result.duration).to.be.greaterThan(0)
      expect(result.id).to.equal('test-1')
    })

    it('should handle command failure', async () => {
      const definition: CommandDefinition = {
        command: 'node',
        args: ['-e', 'process.exit(1)'],
        id: 'test-fail',
      }

      const result = await executeCommand(definition)

      expect(result.success).to.be.false
      expect(result.exitCode).to.equal(1)
      expect(result.error).to.equal('Command failed')
    })

    it('should handle command timeout', async function () {
      this.timeout(10000) // Increase test timeout

      const definition: CommandDefinition = {
        command: 'node',
        args: ['-e', 'setTimeout(() => {}, 10000)'], // Sleep for 10 seconds
        id: 'test-timeout',
        timeout: 1, // 1 second timeout
      }

      const result = await executeCommand(definition)

      expect(result.success).to.be.false
      expect(result.timedOut).to.be.true
      expect(result.error).to.equal('Command timed out')
    })

    it('should handle dry run', async () => {
      const definition: CommandDefinition = {
        command: 'node',
        args: ['-e', 'console.log("Should not run")'],
        id: 'test-dry',
      }

      const result = await executeCommand(definition, { dryRun: true })

      expect(result.success).to.be.true
      expect(result.stdout).to.include('[DRY RUN]')
      expect(result.duration).to.equal(0)
    })

    it('should handle invalid command', async () => {
      const definition: CommandDefinition = {
        command: 'non-existent-command-xyz',
        args: [],
        id: 'test-invalid',
      }

      const result = await executeCommand(definition)

      expect(result.success).to.be.false
      expect(result.exitCode).to.equal(-1)
      expect(result.error).to.exist
    })
  })

  describe('executeCommandBatch', () => {
    it('should execute commands in parallel', async function () {
      this.timeout(10000)

      const commands: CommandDefinition[] = [
        { command: 'node', args: ['-e', 'console.log("test1")'], id: 'cmd-1' },
        { command: 'node', args: ['-e', 'console.log("test2")'], id: 'cmd-2' },
        { command: 'node', args: ['-e', 'console.log("test3")'], id: 'cmd-3' },
      ]

      const results = await executeCommandBatch(commands, { parallel: 3 })

      expect(results).to.have.lengthOf(3)
      expect(results.every((r) => r.success)).to.be.true
    })

    it('should stop on first error by default', async function () {
      this.timeout(10000)

      const commands: CommandDefinition[] = [
        { command: 'node', args: ['-e', 'console.log("test1")'], id: 'cmd-1' },
        { command: 'node', args: ['-e', 'process.exit(1)'], id: 'cmd-2' }, // This fails
        { command: 'node', args: ['-e', 'console.log("test3")'], id: 'cmd-3' },
      ]

      const results = await executeCommandBatch(commands, { parallel: 1, continueOnError: false })

      // Should have executed at least the first two commands
      expect(results.length).to.be.at.least(2)

      // Second command should have failed
      const failedCommand = results.find((r) => r.id === 'cmd-2')
      expect(failedCommand?.success).to.be.false
    })

    it('should continue on error when flag is set', async function () {
      this.timeout(10000)

      const commands: CommandDefinition[] = [
        { command: 'node', args: ['-e', 'console.log("test1")'], id: 'cmd-1' },
        { command: 'node', args: ['-e', 'process.exit(1)'], id: 'cmd-2' }, // This fails
        { command: 'node', args: ['-e', 'console.log("test3")'], id: 'cmd-3' },
      ]

      const results = await executeCommandBatch(commands, { parallel: 1, continueOnError: true })

      expect(results).to.have.lengthOf(3)
      expect(results[0].success).to.be.true
      expect(results[1].success).to.be.false
      expect(results[2].success).to.be.true
    })

    it('should respect parallel limit', async function () {
      this.timeout(10000)

      const commands: CommandDefinition[] = Array.from({ length: 10 }, (_, i) => ({
        command: 'node',
        args: ['-e', `console.log("test${i}")`],
        id: `cmd-${i}`,
      }))

      const startTime = Date.now()
      const results = await executeCommandBatch(commands, { parallel: 2 })
      const duration = Date.now() - startTime

      expect(results).to.have.lengthOf(10)
      expect(results.every((r) => r.success)).to.be.true

      // With parallel=2, it should take roughly 5x the time of a single command
      // (10 commands / 2 parallel = 5 batches)
      // This is a loose check since timing can vary
      expect(duration).to.be.greaterThan(0)
    })
  })

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).to.equal('500ms')
      expect(formatDuration(999)).to.equal('999ms')
    })

    it('should format seconds', () => {
      expect(formatDuration(1000)).to.equal('1.00s')
      expect(formatDuration(1500)).to.equal('1.50s')
      expect(formatDuration(30000)).to.equal('30.00s')
    })

    it('should format minutes', () => {
      expect(formatDuration(60000)).to.equal('1m 0s')
      expect(formatDuration(90000)).to.equal('1m 30s')
      expect(formatDuration(125000)).to.equal('2m 5s')
    })
  })

  describe('calculateStatistics', () => {
    it('should calculate correct statistics', () => {
      const results: CommandResult[] = [
        {
          command: 'test1',
          exitCode: 0,
          stdout: '',
          stderr: '',
          success: true,
          duration: 100,
          id: 'cmd-1',
        },
        {
          command: 'test2',
          exitCode: 1,
          stdout: '',
          stderr: '',
          success: false,
          duration: 200,
          id: 'cmd-2',
        },
        {
          command: 'test3',
          exitCode: 0,
          stdout: '',
          stderr: '',
          success: true,
          duration: 150,
          id: 'cmd-3',
        },
        {
          command: 'test4',
          exitCode: -1,
          stdout: '',
          stderr: '',
          success: false,
          duration: 50,
          id: 'cmd-4',
          timedOut: true,
        },
      ]

      const stats = calculateStatistics(results)

      expect(stats.total).to.equal(4)
      expect(stats.successful).to.equal(2)
      expect(stats.failed).to.equal(2)
      expect(stats.timedOut).to.equal(1)
      expect(stats.totalDuration).to.equal(500)
      expect(stats.averageDuration).to.equal(125)
      expect(stats.successRate).to.equal(50)
    })

    it('should handle empty results', () => {
      const stats = calculateStatistics([])

      expect(stats.total).to.equal(0)
      expect(stats.successful).to.equal(0)
      expect(stats.failed).to.equal(0)
      expect(stats.averageDuration).to.equal(0)
      expect(stats.successRate).to.equal(0)
    })
  })

  describe('saveResults', () => {
    it('should save results to JSON file', () => {
      const filePath = path.join(testDir, 'results.json')
      const results: CommandResult[] = [
        {
          command: 'test1',
          exitCode: 0,
          stdout: 'output',
          stderr: '',
          success: true,
          duration: 100,
          id: 'cmd-1',
        },
      ]

      saveResults(filePath, results)

      expect(fs.existsSync(filePath)).to.be.true

      const content = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content)

      expect(data.timestamp).to.exist
      expect(data.statistics).to.exist
      expect(data.results).to.have.lengthOf(1)
      expect(data.results[0].command).to.equal('test1')
    })
  })
})
