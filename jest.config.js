module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/**/__tests__/*.test.ts',
    '<rootDir>/src/**/*.test.ts',
    '!<rootDir>/src/**/*integration*.test.ts', // Separate integration tests
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000, // Reduced for unit tests
  globalSetup: '<rootDir>/src/lib/__tests__/global-setup.js',
  globalTeardown: '<rootDir>/src/lib/__tests__/global-teardown.js',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/e2e/'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/lib/__tests__/**',
    '!src/types/**',
    '!src/app/**/route.ts', // API routes tested separately
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
