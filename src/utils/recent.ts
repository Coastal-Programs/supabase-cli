import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

export interface RecentProject {
  ref: string
  name: string
  timestamp: number
  lastCommand?: string
}

const MAX_RECENT_PROJECTS = 10
const CONFIG_DIR = join(homedir(), '.supabase-cli')
const RECENT_FILE = join(CONFIG_DIR, 'recent.json')

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    try {
      mkdirSync(CONFIG_DIR, { recursive: true })
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      throw new Error(`Failed to create config directory: ${err.message}`)
    }
  }
}

/**
 * Read recent projects from file
 */
function readRecentProjects(): RecentProject[] {
  try {
    if (!existsSync(RECENT_FILE)) {
      return []
    }

    const content = readFileSync(RECENT_FILE, 'utf-8')
    const projects = JSON.parse(content) as RecentProject[]

    // Validate structure
    if (!Array.isArray(projects)) {
      return []
    }

    return projects.filter(
      (p) =>
        typeof p === 'object' &&
        p !== null &&
        typeof p.ref === 'string' &&
        typeof p.name === 'string' &&
        typeof p.timestamp === 'number',
    )
  } catch {
    // If file is corrupted or unreadable, return empty array
    return []
  }
}

/**
 * Write recent projects to file (atomic write)
 */
function writeRecentProjects(projects: RecentProject[]): void {
  ensureConfigDir()

  try {
    // Atomic write: write to temp file, then rename
    const tempFile = join(tmpdir(), `recent-${Date.now()}.json`)
    const content = JSON.stringify(projects, null, 2)

    writeFileSync(tempFile, content, 'utf-8')

    // Rename is atomic on most filesystems
    if (existsSync(RECENT_FILE)) {
      // On Windows, we need to remove the target file first
      if (process.platform === 'win32') {
        const fs = require('node:fs')
        fs.unlinkSync(RECENT_FILE)
      }
    }

    const fs = require('node:fs')
    fs.renameSync(tempFile, RECENT_FILE)
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    throw new Error(`Failed to write recent projects: ${err.message}`)
  }
}

/**
 * Add a project to recent history
 * - Adds to front of list
 * - Removes duplicates
 * - Keeps last 10 projects
 * - Saves to ~/.supabase-cli/recent.json
 */
export function addRecentProject(ref: string, name: string, command?: string): void {
  try {
    const projects = readRecentProjects()

    // Remove existing entry for this ref
    const filtered = projects.filter((p) => p.ref !== ref)

    // Add new entry at the beginning
    const newProject: RecentProject = {
      lastCommand: command,
      name,
      ref,
      timestamp: Date.now(),
    }

    filtered.unshift(newProject)

    // Keep only last MAX_RECENT_PROJECTS
    const trimmed = filtered.slice(0, MAX_RECENT_PROJECTS)

    writeRecentProjects(trimmed)
  } catch (error) {
    // Silently fail - don't block command execution
    if (process.env.DEBUG === 'true') {
      console.error(`Failed to add recent project: ${error}`)
    }
  }
}

/**
 * Get list of recent projects (max 10, sorted by most recent first)
 */
export function getRecentProjects(): RecentProject[] {
  try {
    return readRecentProjects()
  } catch {
    return []
  }
}

/**
 * Get a specific recent project by index (1-based)
 */
export function getRecentProjectByIndex(index: number): RecentProject | null {
  if (index < 1 || index > MAX_RECENT_PROJECTS) {
    return null
  }

  const projects = getRecentProjects()
  const arrayIndex = index - 1

  if (arrayIndex >= projects.length) {
    return null
  }

  return projects[arrayIndex] ?? null
}

/**
 * Clear all recent projects
 */
export function clearRecentProjects(): void {
  try {
    writeRecentProjects([])
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    throw new Error(`Failed to clear recent projects: ${err.message}`)
  }
}
