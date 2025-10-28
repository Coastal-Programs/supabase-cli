#!/usr/bin/env node

try {
  const chalk = require('chalk')
  const updateNotifier = require('update-notifier')
  const pkg = require('../package.json')

  // Check for updates
  const notifier = updateNotifier.default ? updateNotifier.default({ pkg }) : updateNotifier({ pkg })

  // Show update notification if available
  if (notifier && notifier.notify) {
    notifier.notify({
      isGlobal: true,
      defer: false,
    })
  }

  // Welcome message (only show if not in CI)
  if (!process.env.CI) {
    console.log()
    console.log(chalk.bold.cyan('  @coastal-programs/supabase-cli'))
    console.log()
    console.log('  Production-ready Supabase CLI')
    console.log()
    console.log('  Quick Start:')
    console.log(chalk.gray('    1. Set your access token:'))
    console.log(chalk.yellow('       export SUPABASE_ACCESS_TOKEN=your_token'))
    console.log()
    console.log(chalk.gray('    2. Initialize configuration:'))
    console.log(chalk.yellow('       supabase-cli config:init'))
    console.log()
    console.log(chalk.gray('    3. List your projects:'))
    console.log(chalk.yellow('       supabase-cli projects:list'))
    console.log()
    console.log('  Documentation:')
    console.log(chalk.blue('    https://github.com/coastal-programs/supabase-cli'))
    console.log()
    console.log(chalk.gray('  Run "supabase-cli --help" for more commands'))
    console.log()
  }
} catch (error) {
  // Silently fail if postinstall has issues
  // Don't break installation
}
