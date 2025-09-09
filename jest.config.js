module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\.(ts|tsx)?$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.test.json' }],
    '^.+\.(js|jsx)$': 'babel-jest',
  },
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^react-i18next$': '<rootDir>/__mocks__/react-i18next.js'
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.test.(ts|tsx|js)',
    '<rootDir>/tests/**/*.test.(ts|tsx|js)'
  ]
};
