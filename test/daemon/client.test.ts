import { expect } from 'chai'

import { DaemonClient } from '../../src/daemon/client'
import { DaemonLifecycle } from '../../src/daemon/lifecycle'

describe('DaemonClient', () => {
  let client: DaemonClient
  let lifecycle: DaemonLifecycle

  beforeEach(() => {
    client = new DaemonClient()
    lifecycle = new DaemonLifecycle()
  })

  afterEach(async () => {
    // Clean up: stop daemon if running
    try {
      const status = await lifecycle.status()
      if (status.running) {
        await lifecycle.stop()
      }
    } catch {
      // Ignore errors during cleanup
    }
  })

  describe('isRunning', () => {
    it('should return false when daemon is not running', async () => {
      const running = await client.isRunning()
      expect(running).to.be.false
    })

    it('should return true when daemon is running', async function () {
      this.timeout(10000)

      await lifecycle.start({ detached: false })

      const running = await client.isRunning()
      expect(running).to.be.true
    })
  })

  describe('getPid', () => {
    it('should return null when daemon is not running', () => {
      const pid = client.getPid()
      expect(pid).to.be.null
    })

    it('should return PID when daemon is running', async function () {
      this.timeout(10000)

      await lifecycle.start({ detached: false })

      const pid = client.getPid()
      expect(pid).to.be.a('number')
      expect(pid).to.be.greaterThan(0)
    })
  })

  describe('getStatus', () => {
    it('should return not running status when daemon is not running', async () => {
      const status = await client.getStatus()
      expect(status.running).to.be.false
      expect(status.pid).to.be.undefined
    })

    it('should return running status when daemon is running', async function () {
      this.timeout(10000)

      await lifecycle.start({ detached: false })

      const status = await client.getStatus()
      expect(status.running).to.be.true
      expect(status.pid).to.be.a('number')
      expect(status.socketPath).to.be.a('string')
    })
  })

  describe('execute', () => {
    it('should throw error when daemon is not running', async () => {
      try {
        await client.execute('--version', [])
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).to.include('not running')
      }
    })

    it('should execute command successfully', async function () {
      this.timeout(15000)

      await lifecycle.start({ detached: false })

      const response = await client.execute('--version', [])
      expect(response.success).to.be.true
      expect(response.exitCode).to.equal(0)
      expect(response.output).to.be.a('string')
    })
  })

  describe('stop', () => {
    it('should throw error when daemon is not running', async () => {
      try {
        await client.stop()
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).to.include('not running')
      }
    })

    it('should stop daemon successfully', async function () {
      this.timeout(10000)

      await lifecycle.start({ detached: false })
      await client.stop()

      const running = await client.isRunning()
      expect(running).to.be.false
    })
  })
})
