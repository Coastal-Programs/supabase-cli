#!/usr/bin/env node

/**
 * Pre-publish verification script
 * Validates package contents before publishing to npm
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

console.log('Running pre-publish verification...\n');

// 1. Check required files exist
const requiredFiles = [
  'package.json',
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  'dist/index.js',
  'dist/index.d.ts',
  'bin/run',
];

requiredFiles.forEach((file) => {
  if (!fs.existsSync(path.join(__dirname, '..', file))) {
    errors.push(`Missing required file: ${file}`);
  }
});

// 2. Validate package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);

if (!packageJson.name) {
  errors.push('package.json: missing "name" field');
}

if (!packageJson.version) {
  errors.push('package.json: missing "version" field');
}

if (!packageJson.description) {
  warnings.push('package.json: missing "description" field');
}

if (!packageJson.repository) {
  warnings.push('package.json: missing "repository" field');
}

if (!packageJson.keywords || packageJson.keywords.length === 0) {
  warnings.push('package.json: missing or empty "keywords" field');
}

if (!packageJson.license) {
  errors.push('package.json: missing "license" field');
}

if (!packageJson.files || packageJson.files.length === 0) {
  warnings.push('package.json: missing or empty "files" field - entire project may be published');
}

// 3. Check for sensitive files in package
const sensitivePatterns = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  'secrets',
  'credentials',
  '.npmrc',
  '.ai/',
  'CLAUDE.md',
];

sensitivePatterns.forEach((pattern) => {
  const npmignore = fs.readFileSync(path.join(__dirname, '..', '.npmignore'), 'utf8');
  if (!npmignore.includes(pattern)) {
    warnings.push(`.npmignore: ${pattern} not explicitly excluded`);
  }
});

// 4. Validate dist directory
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  const distFiles = fs.readdirSync(distPath);
  if (distFiles.length === 0) {
    errors.push('dist/ directory is empty - build may have failed');
  }
} else {
  errors.push('dist/ directory does not exist - run npm run build first');
}

// 5. Check CHANGELOG has entry for current version
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const version = packageJson.version;
  if (!changelog.includes(`[${version}]`)) {
    warnings.push(`CHANGELOG.md: No entry found for version ${version}`);
  }
} else {
  warnings.push('CHANGELOG.md not found');
}

// 6. Validate bin script
if (packageJson.bin) {
  Object.entries(packageJson.bin).forEach(([name, scriptPath]) => {
    const fullPath = path.join(__dirname, '..', scriptPath);
    if (!fs.existsSync(fullPath)) {
      errors.push(`bin script not found: ${scriptPath} (${name})`);
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.startsWith('#!/usr/bin/env node') && !content.includes('node')) {
        warnings.push(`bin script may be missing shebang: ${scriptPath}`);
      }
    }
  });
}

// Report results
console.log('='.repeat(60));
if (errors.length === 0 && warnings.length === 0) {
  console.log('\x1b[32m✓ All checks passed!\x1b[0m\n');
  console.log('Package is ready for publishing.');
  process.exit(0);
}

if (errors.length > 0) {
  console.log('\x1b[31m✗ ERRORS:\x1b[0m');
  errors.forEach((error) => console.log(`  - ${error}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('\x1b[33m⚠ WARNINGS:\x1b[0m');
  warnings.forEach((warning) => console.log(`  - ${warning}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('\x1b[31mCannot publish with errors present.\x1b[0m');
  process.exit(1);
}

if (warnings.length > 0) {
  console.log('\x1b[33mWarnings present - review before publishing.\x1b[0m');
  process.exit(0);
}
