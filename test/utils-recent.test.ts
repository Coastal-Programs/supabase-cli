import { expect } from 'chai'
import { existsSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import {
  addRecentProject,
  clearRecentProjects,
  getRecentProjectByIndex,
  getRecentProjects,
} from '../src/utils/recent'

describe('Recent Projects', () => {
  const configDir = join(homedir(), '.supabase-cli')
  const recentFile = join(configDir, 'recent.json')

  beforeEach(() => {
    // Clean up before each test
    if (existsSync(recentFile)) {
      rmSync(recentFile, { force: true })
    }
  })

  afterEach(() => {
    // Clean up after each test
    if (existsSync(recentFile)) {
      rmSync(recentFile, { force: true })
    }
  })

  describe('addRecentProject', () => {
    it('should add a project to recent history', () => {
      addRecentProject('abc123', 'Test Project', 'projects:get')

      const projects = getRecentProjects()
      expect(projects).to.have.lengthOf(1)
      expect(projects[0].ref).to.equal('abc123')
      expect(projects[0].name).to.equal('Test Project')
      expect(projects[0].lastCommand).to.equal('projects:get')
    })

    it('should add project to front of list', () => {
      addRecentProject('abc123', 'Project 1')
      addRecentProject('def456', 'Project 2')

      const projects = getRecentProjects()
      expect(projects[0].ref).to.equal('def456')
      expect(projects[1].ref).to.equal('abc123')
    })

    it('should remove duplicates and update timestamp', () => {
      addRecentProject('abc123', 'Test Project', 'projects:get')
      const firstTimestamp = getRecentProjects()[0].timestamp

      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        addRecentProject('abc123', 'Test Project Updated', 'db:info')

        const projects = getRecentProjects()
        expect(projects).to.have.lengthOf(1)
        expect(projects[0].name).to.equal('Test Project Updated')
        expect(projects[0].lastCommand).to.equal('db:info')
        expect(projects[0].timestamp).to.be.greaterThan(firstTimestamp)
      }, 10)
    })

    it('should limit to 10 projects', () => {
      // Add 15 projects
      for (let i = 0; i < 15; i++) {
        addRecentProject(`ref${i}`, `Project ${i}`)
      }

      const projects = getRecentProjects()
      expect(projects).to.have.lengthOf(10)
      // Most recent should be ref14
      expect(projects[0].ref).to.equal('ref14')
      // Oldest should be ref5
      expect(projects[9].ref).to.equal('ref5')
    })

    it('should create config directory if it does not exist', () => {
      // Remove directory
      if (existsSync(configDir)) {
        rmSync(recentFile, { force: true })
      }

      addRecentProject('abc123', 'Test Project')

      expect(existsSync(configDir)).to.be.true
      expect(existsSync(recentFile)).to.be.true
    })
  })

  describe('getRecentProjects', () => {
    it('should return empty array if no recent projects', () => {
      const projects = getRecentProjects()
      expect(projects).to.be.an('array').that.is.empty
    })

    it('should return all recent projects', () => {
      addRecentProject('abc123', 'Project 1')
      addRecentProject('def456', 'Project 2')
      addRecentProject('ghi789', 'Project 3')

      const projects = getRecentProjects()
      expect(projects).to.have.lengthOf(3)
    })
  })

  describe('getRecentProjectByIndex', () => {
    beforeEach(() => {
      addRecentProject('abc123', 'Project 1', 'projects:get')
      addRecentProject('def456', 'Project 2', 'db:info')
      addRecentProject('ghi789', 'Project 3', 'projects:list')
    })

    it('should return project at index 1 (most recent)', () => {
      const project = getRecentProjectByIndex(1)
      expect(project).to.not.be.null
      expect(project!.ref).to.equal('ghi789')
      expect(project!.name).to.equal('Project 3')
    })

    it('should return project at index 2', () => {
      const project = getRecentProjectByIndex(2)
      expect(project).to.not.be.null
      expect(project!.ref).to.equal('def456')
    })

    it('should return project at index 3', () => {
      const project = getRecentProjectByIndex(3)
      expect(project).to.not.be.null
      expect(project!.ref).to.equal('abc123')
    })

    it('should return null for index 0', () => {
      const project = getRecentProjectByIndex(0)
      expect(project).to.be.null
    })

    it('should return null for index greater than list length', () => {
      const project = getRecentProjectByIndex(10)
      expect(project).to.be.null
    })

    it('should return null for negative index', () => {
      const project = getRecentProjectByIndex(-1)
      expect(project).to.be.null
    })
  })

  describe('clearRecentProjects', () => {
    it('should clear all recent projects', () => {
      addRecentProject('abc123', 'Project 1')
      addRecentProject('def456', 'Project 2')

      clearRecentProjects()

      const projects = getRecentProjects()
      expect(projects).to.be.an('array').that.is.empty
    })

    it('should work even if no projects exist', () => {
      expect(() => clearRecentProjects()).to.not.throw()

      const projects = getRecentProjects()
      expect(projects).to.be.an('array').that.is.empty
    })
  })

  describe('Data integrity', () => {
    it('should validate project structure', () => {
      addRecentProject('abc123', 'Test Project', 'projects:get')

      const projects = getRecentProjects()
      const project = projects[0]

      expect(project).to.have.property('ref')
      expect(project).to.have.property('name')
      expect(project).to.have.property('timestamp')
      expect(project).to.have.property('lastCommand')

      expect(project.ref).to.be.a('string')
      expect(project.name).to.be.a('string')
      expect(project.timestamp).to.be.a('number')
    })

    it('should handle optional lastCommand', () => {
      addRecentProject('abc123', 'Test Project')

      const projects = getRecentProjects()
      expect(projects[0].lastCommand).to.be.undefined
    })
  })
})
