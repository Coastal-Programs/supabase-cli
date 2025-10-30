import { arch, platform, release } from 'node:os'

/**
 * Platform detection and utilities
 *
 * TODO: Implement platform-specific functions:
 * - getConfigPath(): string
 * - getDataPath(): string
 * - getCachePath(): string
 * - openUrl(url: string): void
 * - openEditor(file: string): void
 * - etc.
 */

export const Platform = {
  /**
   * Get system architecture
   */
  get architecture(): string {
    return arch()
  },

  /**
   * Get current platform
   */
  get current(): NodeJS.Platform {
    return platform()
  },

  /**
   * Get platform display name
   */
  get displayName(): string {
    switch (platform()) {
      case 'win32': {
        return 'Windows'
      }

      case 'darwin': {
        return 'macOS'
      }

      case 'linux': {
        return 'Linux'
      }

      default: {
        return platform()
      }
    }
  },

  /**
   * Check if running on Linux
   */
  get isLinux(): boolean {
    return platform() === 'linux'
  },

  /**
   * Check if running on macOS
   */
  get isMacOS(): boolean {
    return platform() === 'darwin'
  },

  /**
   * Check if running on Windows
   */
  get isWindows(): boolean {
    return platform() === 'win32'
  },

  /**
   * Get OS release version
   */
  get osVersion(): string {
    return release()
  },
}
