/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^uuid$': '<rootDir>/lib/utils/uuid-mock.js',
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    'app/**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 10000,
  // Set different test environments based on file path
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/app/api/**/*.test.ts', '**/lib/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^uuid$': '<rootDir>/lib/utils/uuid-mock.js',
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: {
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          },
        }],
      },
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['**/app/components/**/*.test.tsx', '**/app/**/*.test.tsx'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^uuid$': '<rootDir>/lib/utils/uuid-mock.js',
      },
    },
  ],
};

module.exports = config;
