import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { expect } from 'chai'

import {
  getProjectConfig,
  getProjectContext,
  getProjectContextPath,
  hasProjectContext,
  saveProjectContext,
} from '../../src/utils/project-context'

describe('project-context', () => {
  const testDir = join(process.cwd(), 'test-temp-project-context')
  const supabaseDir = join(testDir, '.supabase')
  const configFile = join(supabaseDir, 'config.json')

  beforeEach(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }

    // Change to test directory
    process.chdir(testDir)
  })

  afterEach(() => {
    // Change back to original directory
    process.chdir(join(__dirname, '../..'))

    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { force: true, recursive: true })
    }
  })

  describe('getProjectContext', () => {
    it('should return null when no config exists', async () => {
      const result = await getProjectContext()
      expect(result).to.be.null
    })

    it('should return project_id when config exists', async () => {
      const projectId = 'test-project-123'

      // Create config
      await saveProjectContext(projectId, 'Test Project')

      const result = await getProjectContext()
      expect(result).to.equal(projectId)
    })

    it('should return null when config.json is invalid JSON', async () => {
      // Create .supabase directory
      if (!existsSync(supabaseDir)) {
        mkdirSync(supabaseDir, { recursive: true })
      }

      // Write invalid JSON
      writeFileSync(configFile, 'invalid json{]', 'utf8')

      const result = await getProjectContext()
      expect(result).to.be.null
    })

    it('should return null when project_id is missing', async () => {
      // Create .supabase directory
      if (!existsSync(supabaseDir)) {
        mkdirSync(supabaseDir, { recursive: true })
      }

      // Write config without project_id
      writeFileSync(configFile, JSON.stringify({ project_name: 'Test' }), 'utf8')

      const result = await getProjectContext()
      expect(result).to.be.null
    })
  })

  describe('saveProjectContext', () => {
    it('should create .supabase directory if it does not exist', async () => {
      await saveProjectContext('test-project-123', 'Test Project')

      expect(existsSync(supabaseDir)).to.be.true
    })

    it('should create config.json with correct structure', async () => {
      const projectId = 'test-project-123'
      const projectName = 'Test Project'

      await saveProjectContext(projectId, projectName)

      expect(existsSync(configFile)).to.be.true

      const config = await getProjectConfig()
      expect(config).to.not.be.null
      expect(config?.project_id).to.equal(projectId)
      expect(config?.project_name).to.equal(projectName)
      expect(config?.created_at).to.be.a('string')
    })

    it('should overwrite existing config', async () => {
      await saveProjectContext('old-project', 'Old Project')
      await saveProjectContext('new-project', 'New Project')

      const config = await getProjectConfig()
      expect(config?.project_id).to.equal('new-project')
      expect(config?.project_name).to.equal('New Project')
    })

    it('should work without project name', async () => {
      await saveProjectContext('test-project-123')

      const config = await getProjectConfig()
      expect(config?.project_id).to.equal('test-project-123')
      expect(config?.project_name).to.be.undefined
    })
  })

  describe('hasProjectContext', () => {
    it('should return false when no config exists', () => {
      const result = hasProjectContext()
      expect(result).to.be.false
    })

    it('should return true when config exists', async () => {
      await saveProjectContext('test-project-123')

      const result = hasProjectContext()
      expect(result).to.be.true
    })
  })

  describe('getProjectContextPath', () => {
    it('should return null when no .supabase directory exists', () => {
      const result = getProjectContextPath()
      expect(result).to.be.null
    })

    it('should return path when .supabase directory exists', async () => {
      await saveProjectContext('test-project-123')

      const result = getProjectContextPath()
      expect(result).to.equal(supabaseDir)
    })

    it('should walk up directory tree to find .supabase', async () => {
      // Create nested directory structure
      const nestedDir = join(testDir, 'nested', 'deeper')
      mkdirSync(nestedDir, { recursive: true })

      // Create .supabase in test dir
      await saveProjectContext('test-project-123')

      // Change to nested directory
      process.chdir(nestedDir)

      const result = getProjectContextPath()
      expect(result).to.equal(supabaseDir)
    })
  })

  describe('getProjectConfig', () => {
    it('should return null when no config exists', async () => {
      const result = await getProjectConfig()
      expect(result).to.be.null
    })

    it('should return full config when it exists', async () => {
      const projectId = 'test-project-123'
      const projectName = 'Test Project'

      await saveProjectContext(projectId, projectName)

      const result = await getProjectConfig()
      expect(result).to.not.be.null
      expect(result?.project_id).to.equal(projectId)
      expect(result?.project_name).to.equal(projectName)
      expect(result?.created_at).to.be.a('string')
    })

    it('should return null for invalid JSON', async () => {
      // Create .supabase directory
      if (!existsSync(supabaseDir)) {
        mkdirSync(supabaseDir, { recursive: true })
      }

      // Write invalid JSON
      writeFileSync(configFile, 'invalid json{]', 'utf8')

      const result = await getProjectConfig()
      expect(result).to.be.null
    })
  })
})
