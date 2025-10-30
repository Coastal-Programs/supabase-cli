import { expect } from 'chai'

import ProjectsRestore from '../../../src/commands/projects/restore'

describe('projects:restore command', () => {
  describe('command structure', () => {
    it('should have correct description', () => {
      expect(ProjectsRestore.description).to.be.a('string')
      expect(ProjectsRestore.description.length).to.be.greaterThan(10)
      expect(ProjectsRestore.description).to.include('restore')
      expect(ProjectsRestore.description).to.include('paused')
    })

    it('should have examples', () => {
      expect(ProjectsRestore.examples).to.be.an('array')
      expect(ProjectsRestore.examples.length).to.be.greaterThan(0)
    })

    it('should have aliases', () => {
      expect(ProjectsRestore.aliases).to.be.an('array')
      expect(ProjectsRestore.aliases).to.include('projects:resume')
      expect(ProjectsRestore.aliases).to.include('proj:restore')
    })
  })

  describe('arguments', () => {
    it('should have ref argument', () => {
      const args = ProjectsRestore.args
      expect(args).to.have.property('ref')
    })

    it('should have optional ref argument', () => {
      const args = ProjectsRestore.args
      expect(args.ref.required).to.be.false
    })

    it('should have description for ref argument', () => {
      const args = ProjectsRestore.args
      expect(args.ref.description).to.exist
      if (args.ref.description) {
        expect(args.ref.description).to.be.a('string')
        expect(args.ref.description.length).to.be.greaterThan(10)
      }
    })
  })

  describe('flags', () => {
    it('should extend base flags', () => {
      const flags = ProjectsRestore.flags
      expect(flags).to.have.property('format')
      expect(flags).to.have.property('quiet')
      expect(flags).to.have.property('debug')
    })

    it('should have output format flags', () => {
      const flags = ProjectsRestore.flags
      expect(flags.format).to.have.property('options')
      expect(flags.format.options).to.include('json')
      expect(flags.format.options).to.include('table')
      expect(flags.format.options).to.include('yaml')
    })

    it('should have automation flags', () => {
      const flags = ProjectsRestore.flags
      expect(flags).to.have.property('quiet')
      expect(flags).to.have.property('yes')
    })

    it('should have confirmation flags', () => {
      const flags = ProjectsRestore.flags
      expect(flags).to.have.property('yes')
      expect(flags.yes.description).to.include('confirmation')
    })

    it('should have project flag', () => {
      const flags = ProjectsRestore.flags
      expect(flags).to.have.property('project')
      expect(flags.project.char).to.equal('p')
    })

    it('should have default format as json', () => {
      const flags = ProjectsRestore.flags
      expect(flags.format.default).to.equal('json')
    })
  })

  describe('validation', () => {
    it('should accept ref as argument or project flag', () => {
      const args = ProjectsRestore.args
      const flags = ProjectsRestore.flags
      expect(args.ref).to.exist
      expect(flags.project).to.exist
    })

    it('should support confirmation bypass with --yes flag', () => {
      const flags = ProjectsRestore.flags
      expect(flags.yes).to.exist
      expect(flags.yes.type).to.equal('boolean')
    })
  })

  describe('output handling', () => {
    it('should support quiet mode flag', () => {
      const flags = ProjectsRestore.flags
      expect(flags).to.have.property('quiet')
      expect(flags.quiet.type).to.equal('boolean')
    })

    it('should support multiple output formats', () => {
      const flags = ProjectsRestore.flags
      expect(flags.format.options).to.deep.equal(['json', 'table', 'yaml'])
    })
  })

  describe('safety features', () => {
    it('should have confirmation flag for destructive operation', () => {
      const flags = ProjectsRestore.flags
      expect(flags.yes).to.exist
      expect(flags.yes.description).to.be.a('string')
    })
  })
})
