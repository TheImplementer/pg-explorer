module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/client/src/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  setupFilesAfterEnv: ['./client/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'client/src/**/*.{js,jsx}',
    '!client/src/index.js',
    '!**/node_modules/**'
  ]
};