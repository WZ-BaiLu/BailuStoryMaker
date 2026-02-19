#!/usr/bin/env node
/**
 * Quick test runner to verify tests work
 */

console.log('='.repeat(60));
console.log('BailuStory Test Runner');
console.log('='.repeat(60));
console.log();

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if jest is installed
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  if (packageJson.devDependencies && packageJson.devDependencies.jest) {
    console.log('✓ Jest is installed');
  } else {
    console.log('✗ Jest is not installed');
    console.log('Please run: npm install');
    process.exit(1);
  }
} catch (error) {
  console.log('✗ Error checking dependencies:', error.message);
  process.exit(1);
}

// Check test files
const testFiles = [
  'tests/managers/NotificationManager.test.js',
  'tests/managers/ThemeManager.test.js',
  'tests/managers/ModalManager.test.js'
];

console.log();
console.log('Test files found:');
testFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✓' : '✗'} ${file}`);
});

console.log();
console.log('Running tests...');
console.log();

try {
  execSync('npm test', { 
    stdio: 'inherit',
    cwd: __dirname
  });
} catch (error) {
  console.log();
  console.log('✗ Tests failed with exit code:', error.status);
  console.log();
  console.log('To fix issues:');
  console.log('1. Check the error messages above');
  console.log('2. Review test files for issues');
  console.log('3. Run: npm run test:coverage for detailed report');
  console.log();
  process.exit(error.status);
}

console.log();
console.log('='.repeat(60));
console.log('All tests passed!');
console.log('='.repeat(60));
