#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test configuration
const testConfig = {
  unit: {
    command: 'npm run test',
    description: 'Unit Tests',
    timeout: 300000 // 5 minutes
  },
  e2e: {
    command: 'npx playwright test',
    description: 'End-to-End Tests',
    timeout: 600000 // 10 minutes
  },
  coverage: {
    command: 'npm run test:coverage',
    description: 'Coverage Report',
    timeout: 300000 // 5 minutes
  },
  all: {
    command: 'npm run test:all',
    description: 'All Tests',
    timeout: 900000 // 15 minutes
  }
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if required dependencies are installed
function checkDependencies() {
  logHeader('Checking Dependencies');
  
  const requiredPackages = [
    '@playwright/test',
    '@testing-library/jest-dom',
    '@testing-library/react',
    '@testing-library/user-event',
    'jest',
    'jest-environment-jsdom',
    'ts-jest',
    'msw'
  ];

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  const missingPackages = requiredPackages.filter(pkg => !allDependencies[pkg]);
  
  if (missingPackages.length > 0) {
    logError(`Missing required packages: ${missingPackages.join(', ')}`);
    logInfo('Installing missing packages...');
    
    try {
      execSync(`npm install --save-dev ${missingPackages.join(' ')}`, { stdio: 'inherit' });
      logSuccess('Dependencies installed successfully');
    } catch (error) {
      logError('Failed to install dependencies');
      process.exit(1);
    }
  } else {
    logSuccess('All dependencies are installed');
  }
}

// Run a single test suite
function runTestSuite(suiteName, config) {
  logHeader(`Running ${config.description}`);
  
  try {
    const startTime = Date.now();
    
    execSync(config.command, {
      stdio: 'inherit',
      timeout: config.timeout,
      cwd: process.cwd()
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logSuccess(`${config.description} completed in ${duration}s`);
    return true;
  } catch (error) {
    logError(`${config.description} failed`);
    return false;
  }
}

// Generate test report
function generateReport(results) {
  logHeader('Test Report');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result => result).length;
  const failedTests = totalTests - passedTests;
  
  logInfo(`Total Test Suites: ${totalTests}`);
  logSuccess(`Passed: ${passedTests}`);
  if (failedTests > 0) {
    logError(`Failed: ${failedTests}`);
  }
  
  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`
    },
    results: results
  };
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'test-results', 'test-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logInfo(`Detailed report saved to: ${reportPath}`);
  
  return report;
}

// Main execution function
function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  
  logHeader('JusValida Test Runner');
  logInfo(`Running tests: ${testType}`);
  
  // Check dependencies first
  checkDependencies();
  
  const results = {};
  
  if (testType === 'all' || testType === 'unit') {
    results.unit = runTestSuite('unit', testConfig.unit);
  }
  
  if (testType === 'all' || testType === 'e2e') {
    results.e2e = runTestSuite('e2e', testConfig.e2e);
  }
  
  if (testType === 'all' || testType === 'coverage') {
    results.coverage = runTestSuite('coverage', testConfig.coverage);
  }
  
  // Generate final report
  const report = generateReport(results);
  
  // Exit with appropriate code
  const hasFailures = Object.values(results).some(result => !result);
  if (hasFailures) {
    logError('Some tests failed');
    process.exit(1);
  } else {
    logSuccess('All tests passed!');
    process.exit(0);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, runTestSuite, generateReport };
