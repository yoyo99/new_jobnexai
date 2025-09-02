module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^../src/(.*)$': '<rootDir>/src/$1',
    '^../../src/(.*)$': '<rootDir>/src/$1',
    '^../lib/(.*)$': '<rootDir>/src/lib/$1',
    '^../../lib/(.*)$': '<rootDir>/src/lib/$1',
    '^../stores/(.*)$': '<rootDir>/src/stores/$1',
    '^../../stores/(.*)$': '<rootDir>/src/stores/$1',
    '^../hooks/(.*)$': '<rootDir>/__mocks__/$1'
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/tests/**/*.(test|spec).(ts|tsx|js)'
  ]
};
