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

// Install testing dependencies
function installTestDependencies() {
  logHeader('Installing Test Dependencies');
  
  const testDependencies = [
    '@playwright/test',
    '@testing-library/jest-dom',
    '@testing-library/react',
    '@testing-library/user-event',
    '@types/jest',
    'jest',
    'jest-environment-jsdom',
    'ts-jest',
    'msw',
    'vitest',
    '@vitest/ui'
  ];
  
  try {
    logInfo('Installing testing packages...');
    execSync(`npm install --save-dev ${testDependencies.join(' ')}`, { 
      stdio: 'inherit',
      timeout: 300000 // 5 minutes
    });
    logSuccess('Test dependencies installed successfully');
    return true;
  } catch (error) {
    logError('Failed to install test dependencies');
    return false;
  }
}

// Fix Jest configuration for ES modules
function fixJestConfig() {
  logHeader('Configuring Jest for ES Modules');
  
  const jestConfig = `import { jest } from '@jest/globals';

export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@assets/(.*)$': '<rootDir>/attached_assets/$1'
  },
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    '!client/src/**/*.d.ts',
    '!client/src/main.tsx',
    '!client/src/vite-env.d.ts',
    '!client/src/**/*.stories.{ts,tsx}',
    '!client/src/**/*.test.{ts,tsx}',
    '!client/src/**/*.spec.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{ts,tsx}',
    '<rootDir>/client/src/**/*.test.{ts,tsx}'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/tests/e2e/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@supabase|@tanstack))'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  }
};`;
  
  try {
    fs.writeFileSync('jest.config.mjs', jestConfig);
    logSuccess('Jest configuration created');
    return true;
  } catch (error) {
    logError('Failed to create Jest configuration');
    return false;
  }
}

// Create test setup file
function createTestSetup() {
  logHeader('Creating Test Setup');
  
  const setupContent = `import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from '@jest/globals';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock server for API calls
const server = setupServer(
  // Mock Supabase auth endpoints
  rest.post('*/auth/v1/token', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          user_metadata: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      })
    );
  }),

  rest.post('*/auth/v1/signup', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access_token: 'mock-access-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          user_metadata: {
            first_name: 'Test',
            last_name: 'User'
          }
        }
      })
    );
  }),

  rest.get('*/api/user/profile', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        userProfile: {
          credits: 100,
          firstName: 'Test',
          lastName: 'User'
        }
      })
    );
  }),

  rest.get('*/api/analyses', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([])
    );
  }),

  rest.get('*/api/platform-stats', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        totalDocuments: 1000,
        analysisAccuracy: 95,
        activeLawyers: 150,
        totalUsers: 500,
        totalCreditsUsed: 5000,
        avgAnalysisTime: 2.5
      })
    );
  })
);

// Setup and teardown
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn'
  });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Mock environment variables
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;
`;
  
  try {
    fs.writeFileSync('tests/setup.ts', setupContent);
    logSuccess('Test setup file created');
    return true;
  } catch (error) {
    logError('Failed to create test setup file');
    return false;
  }
}

// Update package.json with test scripts
function updatePackageJson() {
  logHeader('Updating Package.json Scripts');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    packageJson.scripts = {
      ...packageJson.scripts,
      'test': 'jest --config jest.config.mjs',
      'test:watch': 'jest --config jest.config.mjs --watch',
      'test:coverage': 'jest --config jest.config.mjs --coverage',
      'test:e2e': 'playwright test',
      'test:e2e:ui': 'playwright test --ui',
      'test:e2e:headed': 'playwright test --headed',
      'test:all': 'npm run test && npm run test:e2e',
      'test:ci': 'npm run test:coverage && npm run test:e2e'
    };
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    logSuccess('Package.json updated with test scripts');
    return true;
  } catch (error) {
    logError('Failed to update package.json');
    return false;
  }
}

// Install Playwright browsers
function installPlaywrightBrowsers() {
  logHeader('Installing Playwright Browsers');
  
  try {
    execSync('npx playwright install', { 
      stdio: 'inherit',
      timeout: 600000 // 10 minutes
    });
    logSuccess('Playwright browsers installed');
    return true;
  } catch (error) {
    logError('Failed to install Playwright browsers');
    return false;
  }
}

// Run a simple test to verify setup
function runTestVerification() {
  logHeader('Running Test Verification');
  
  try {
    // Try to run Jest with a simple test
    execSync('npx jest --config jest.config.mjs --passWithNoTests', { 
      stdio: 'pipe',
      timeout: 60000 // 1 minute
    });
    logSuccess('Jest configuration verified');
    return true;
  } catch (error) {
    logInfo('Jest verification failed - this is expected for initial setup');
    return false;
  }
}

// Main execution
function main() {
  logHeader('JusValida Test Setup');
  logInfo('Setting up comprehensive testing environment...');
  
  const results = {};
  
  // Install dependencies
  results.dependencies = installTestDependencies();
  
  // Configure Jest
  results.jestConfig = fixJestConfig();
  
  // Create test setup
  results.testSetup = createTestSetup();
  
  // Update package.json
  results.packageJson = updatePackageJson();
  
  // Install Playwright browsers
  results.playwrightBrowsers = installPlaywrightBrowsers();
  
  // Verify setup
  results.verification = runTestVerification();
  
  // Summary
  logHeader('Setup Summary');
  const totalSteps = Object.keys(results).length;
  const successfulSteps = Object.values(results).filter(r => r).length;
  
  logInfo(`Setup completed: ${successfulSteps}/${totalSteps} steps successful`);
  
  Object.entries(results).forEach(([step, success]) => {
    const status = success ? '✅' : '❌';
    log(`  ${status} ${step}`);
  });
  
  if (successfulSteps === totalSteps) {
    logSuccess('Test setup completed successfully!');
    logInfo('\nYou can now run:');
    logInfo('  npm run test        - Run unit tests');
    logInfo('  npm run test:e2e    - Run E2E tests');
    logInfo('  npm run test:all    - Run all tests');
  } else {
    logInfo('Test setup completed with some issues');
    logInfo('You may need to manually configure some components');
  }
}

// Run the main function
main();
