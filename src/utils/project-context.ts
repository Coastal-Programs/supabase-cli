import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

interface ProjectConfig {
  created_at?: string
  project_id: string
  project_name?: string
}

/**
 * Walk up the directory tree looking for .supabase/config.json
 * Returns the project_id if found, null otherwise
 */
export async function getProjectContext(): Promise<null | string> {
  try {
    const configPath = getProjectContextPath()
    if (!configPath) {
      return null
    }

    const configFile = join(configPath, 'config.json')
    if (!existsSync(configFile)) {
      return null
    }

    const content = readFileSync(configFile, 'utf8')
    const config: ProjectConfig = JSON.parse(content)

    return config.project_id || null
  } catch {
    // If there's any error reading/parsing, return null
    // This ensures commands don't fail due to corrupted config
    return null
  }
}

/**
 * Save project context to .supabase/config.json in current directory
 */
export async function saveProjectContext(projectId: string, projectName?: string): Promise<void> {
  const supabaseDir = join(process.cwd(), '.supabase')
  const configFile = join(supabaseDir, 'config.json')

  // Create .supabase directory if it doesn't exist
  if (!existsSync(supabaseDir)) {
    mkdirSync(supabaseDir, { recursive: true })
  }

  const config: ProjectConfig = {
    created_at: new Date().toISOString(),
    project_id: projectId,
    project_name: projectName,
  }

  writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n', 'utf8')
}

/**
 * Check if project context exists in current directory or parents
 */
export function hasProjectContext(): boolean {
  return getProjectContextPath() !== null
}

/**
 * Get the path to the .supabase directory if it exists
 * Walks up the directory tree to find it
 */
export function getProjectContextPath(): null | string {
  let currentDir = process.cwd()
  const root = dirname(currentDir)

  // Walk up the directory tree
  while (currentDir !== root) {
    const supabaseDir = join(currentDir, '.supabase')
    if (existsSync(supabaseDir)) {
      return supabaseDir
    }

    const parentDir = dirname(currentDir)
    if (parentDir === currentDir) {
      // We've reached the root without changes (safety check)
      break
    }

    currentDir = parentDir
  }

  // Check the root directory
  const rootSupabaseDir = join(root, '.supabase')
  if (existsSync(rootSupabaseDir)) {
    return rootSupabaseDir
  }

  return null
}

/**
 * Get the full project config if it exists
 */
export async function getProjectConfig(): Promise<ProjectConfig | null> {
  try {
    const configPath = getProjectContextPath()
    if (!configPath) {
      return null
    }

    const configFile = join(configPath, 'config.json')
    if (!existsSync(configFile)) {
      return null
    }

    const content = readFileSync(configFile, 'utf8')
    const config: ProjectConfig = JSON.parse(content)

    return config
  } catch {
    return null
  }
}
