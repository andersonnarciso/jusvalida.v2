#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if we can run tests
function checkTestEnvironment() {
  logHeader('Checking Test Environment');
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    logError('package.json not found. Are you in the project root?');
    process.exit(1);
  }
  
  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    logInfo('Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      logSuccess('Dependencies installed');
    } catch (error) {
      logError('Failed to install dependencies');
      process.exit(1);
    }
  }
  
  logSuccess('Test environment is ready');
}

// Run Jest tests
function runJestTests() {
  logHeader('Running Jest Unit Tests');
  
  try {
    // First, let's check if Jest is available
    execSync('npx jest --version', { stdio: 'pipe' });
    
    // Run Jest tests
    execSync('npx jest --passWithNoTests', { 
      stdio: 'inherit',
      timeout: 300000 // 5 minutes
    });
    
    logSuccess('Jest tests completed');
    return true;
  } catch (error) {
    logError('Jest tests failed or Jest not available');
    logInfo('This is expected if Jest is not set up yet');
    return false;
  }
}

// Run Playwright tests
function runPlaywrightTests() {
  logHeader('Running Playwright E2E Tests');
  
  try {
    // Check if Playwright is available
    execSync('npx playwright --version', { stdio: 'pipe' });
    
    // Install Playwright browsers if needed
    try {
      execSync('npx playwright install', { stdio: 'inherit' });
    } catch (error) {
      logInfo('Playwright browsers already installed or installation failed');
    }
    
    // Run Playwright tests
    execSync('npx playwright test --reporter=list', { 
      stdio: 'inherit',
      timeout: 600000 // 10 minutes
    });
    
    logSuccess('Playwright tests completed');
    return true;
  } catch (error) {
    logError('Playwright tests failed or Playwright not available');
    logInfo('This is expected if Playwright is not set up yet');
    return false;
  }
}

// Analyze the project structure
function analyzeProject() {
  logHeader('Project Analysis');
  
  const projectStructure = {
    client: fs.existsSync('client'),
    server: fs.existsSync('server'),
    shared: fs.existsSync('shared'),
    tests: fs.existsSync('tests'),
    packageJson: fs.existsSync('package.json'),
    viteConfig: fs.existsSync('vite.config.ts'),
    tailwindConfig: fs.existsSync('tailwind.config.ts')
  };
  
  logInfo('Project Structure:');
  Object.entries(projectStructure).forEach(([key, exists]) => {
    const status = exists ? '✅' : '❌';
    log(`  ${status} ${key}: ${exists ? 'Found' : 'Not found'}`);
  });
  
  // Check for test files
  const testFiles = [];
  if (fs.existsSync('tests')) {
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.test.ts') || file.endsWith('.test.tsx') || file.endsWith('.spec.ts')) {
          testFiles.push(filePath);
        }
      });
    };
    walkDir('tests');
  }
  
  logInfo(`Found ${testFiles.length} test files:`);
  testFiles.forEach(file => {
    log(`  📄 ${file}`);
  });
  
  return { projectStructure, testFiles };
}

// Generate test report
function generateTestReport(results) {
  logHeader('Test Report Summary');
  
  const report = {
    timestamp: new Date().toISOString(),
    project: 'JusValida',
    results: results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r).length,
      failed: Object.values(results).filter(r => !r).length
    }
  };
  
  logInfo('Test Results:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    log(`  ${status} ${test}`);
  });
  
  const successRate = ((report.summary.passed / report.summary.total) * 100).toFixed(1);
  logInfo(`Success Rate: ${successRate}%`);
  
  // Save report
  const reportPath = 'test-results.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logInfo(`Report saved to: ${reportPath}`);
  
  return report;
}

// Main execution
function main() {
  logHeader('JusValida Test Analysis');
  logInfo('Analyzing project and running available tests...');
  
  // Analyze project
  const analysis = analyzeProject();
  
  // Check test environment
  checkTestEnvironment();
  
  // Run available tests
  const results = {};
  
  // Try to run Jest tests
  results.jest = runJestTests();
  
  // Try to run Playwright tests
  results.playwright = runPlaywrightTests();
  
  // Generate report
  const report = generateTestReport(results);
  
  // Final summary
  logHeader('Final Summary');
  if (report.summary.passed === report.summary.total) {
    logSuccess('All available tests passed!');
  } else {
    logInfo('Some tests were not available or failed');
    logInfo('This is normal for a project that may not have tests set up yet');
  }
  
  logInfo('\nNext Steps:');
  logInfo('1. Set up Jest for unit testing');
  logInfo('2. Set up Playwright for E2E testing');
  logInfo('3. Add test files to the tests/ directory');
  logInfo('4. Configure test environment variables');
  logInfo('5. Run tests regularly during development');
}

// Run the main function
main();
