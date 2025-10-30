import { expect } from 'chai'
import * as sinon from 'sinon'

import Interactive from '../../src/commands/interactive'

describe('Interactive Command', () => {
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('command metadata', () => {
    it('should have correct description', () => {
      expect(Interactive.description).to.equal('Start interactive REPL mode for running commands')
    })

    it('should have examples', () => {
      expect(Interactive.examples).to.be.an('array')
      expect(Interactive.examples.length).to.be.greaterThan(0)
    })

    it('should have project flag', () => {
      expect(Interactive.flags).to.have.property('project')
      expect(Interactive.flags.project).to.have.property('description')
    })
  })

  describe('getAvailableCommands', () => {
    it('should return array of commands', async () => {
      const command = new Interactive([], {} as never)

      // Mock the config to have some commands
      const mockCommands = [
        { aliases: [], hidden: false, id: 'projects:list' },
        { aliases: ['pg'], hidden: false, id: 'projects:get' },
        { aliases: [], hidden: true, id: 'hidden:command' },
        { aliases: [], hidden: false, id: 'interactive' },
      ]

      // @ts-expect-error - accessing private property for testing
      command.config = { commands: mockCommands }

      // @ts-expect-error - accessing private method for testing
      const commands = await command.getAvailableCommands()

      expect(commands).to.be.an('array')
      expect(commands).to.include('projects:list')
      expect(commands).to.include('projects:get')
      expect(commands).to.include('pg') // alias
      expect(commands).not.to.include('hidden:command') // hidden
      expect(commands).not.to.include('interactive') // self
    })

    it('should return empty array on error', async () => {
      const command = new Interactive([], {} as never)

      // Mock config to throw error
      // @ts-expect-error - accessing private property for testing
      command.config = { commands: null }

      // @ts-expect-error - accessing private method for testing
      const commands = await command.getAvailableCommands()

      expect(commands).to.be.an('array')
      expect(commands.length).to.equal(0)
    })

    it('should sort commands alphabetically', async () => {
      const command = new Interactive([], {} as never)

      // Mock the config with unsorted commands
      const mockCommands = [
        { aliases: [], hidden: false, id: 'zebra' },
        { aliases: [], hidden: false, id: 'alpha' },
        { aliases: [], hidden: false, id: 'beta' },
      ]

      // @ts-expect-error - accessing private property for testing
      command.config = { commands: mockCommands }

      // @ts-expect-error - accessing private method for testing
      const commands = await command.getAvailableCommands()

      expect(commands[0]).to.equal('alpha')
      expect(commands[1]).to.equal('beta')
      expect(commands[2]).to.equal('zebra')
    })
  })
})
