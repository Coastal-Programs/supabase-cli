import { expect } from 'chai'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import { DaemonLifecycle } from '../../src/daemon/lifecycle'

describe('DaemonLifecycle', () => {
  let lifecycle: DaemonLifecycle
  let configDir: string
  let pidFile: string

  beforeEach(() => {
    lifecycle = new DaemonLifecycle()
    configDir = path.join(os.homedir(), '.supabase')
    pidFile = path.join(configDir, 'daemon.pid')
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

    // Clean up PID file
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile)
    }
  })

  describe('start', () => {
    it('should start daemon successfully', async function () {
      this.timeout(10000) // Increase timeout for daemon start

      await lifecycle.start({ detached: false })

      const status = await lifecycle.status()
      expect(status.running).to.be.true
      expect(status.pid).to.be.a('number')
    })

    it('should throw error if daemon is already running', async function () {
      this.timeout(10000)

      await lifecycle.start({ detached: false })

      try {
        await lifecycle.start({ detached: false })
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).to.include('already running')
      }
    })
  })

  describe('stop', () => {
    it('should stop daemon successfully', async function () {
      this.timeout(10000)

      await lifecycle.start({ detached: false })
      await lifecycle.stop()

      const status = await lifecycle.status()
      expect(status.running).to.be.false
    })

    it('should throw error if daemon is not running', async () => {
      try {
        await lifecycle.stop()
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).to.include('not running')
      }
    })
  })

  describe('restart', () => {
    it('should restart daemon successfully', async function () {
      this.timeout(15000)

      await lifecycle.start({ detached: false })
      const status1 = await lifecycle.status()
      const pid1 = status1.pid

      await lifecycle.restart({ detached: false })
      const status2 = await lifecycle.status()
      const pid2 = status2.pid

      expect(status2.running).to.be.true
      expect(pid2).to.not.equal(pid1)
    })

    it('should start daemon if not running', async function () {
      this.timeout(10000)

      await lifecycle.restart({ detached: false })

      const status = await lifecycle.status()
      expect(status.running).to.be.true
    })
  })

  describe('status', () => {
    it('should return running status when daemon is running', async function () {
      this.timeout(10000)

      await lifecycle.start({ detached: false })

      const status = await lifecycle.status()
      expect(status.running).to.be.true
      expect(status.pid).to.be.a('number')
      expect(status.socketPath).to.be.a('string')
    })

    it('should return not running status when daemon is not running', async () => {
      const status = await lifecycle.status()
      expect(status.running).to.be.false
      expect(status.pid).to.be.undefined
    })
  })

  describe('autoStart', () => {
    it('should start daemon if not running', async function () {
      this.timeout(10000)

      const started = await lifecycle.autoStart()

      expect(started).to.be.true

      const status = await lifecycle.status()
      expect(status.running).to.be.true
    })

    it('should not start daemon if already running', async function () {
      this.timeout(10000)

      await lifecycle.start({ detached: false })
      const started = await lifecycle.autoStart()

      expect(started).to.be.false
    })
  })

  describe('isDaemonModeEnabled', () => {
    it('should return true if SUPABASE_CLI_DAEMON=true', () => {
      process.env.SUPABASE_CLI_DAEMON = 'true'
      expect(lifecycle.isDaemonModeEnabled()).to.be.true
    })

    it('should return true if SUPABASE_CLI_DAEMON=1', () => {
      process.env.SUPABASE_CLI_DAEMON = '1'
      expect(lifecycle.isDaemonModeEnabled()).to.be.true
    })

    it('should return false if SUPABASE_CLI_DAEMON is not set', () => {
      delete process.env.SUPABASE_CLI_DAEMON
      expect(lifecycle.isDaemonModeEnabled()).to.be.false
    })

    it('should return false if SUPABASE_CLI_DAEMON=false', () => {
      process.env.SUPABASE_CLI_DAEMON = 'false'
      expect(lifecycle.isDaemonModeEnabled()).to.be.false
    })
  })
})
