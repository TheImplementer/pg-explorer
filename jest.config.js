module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/client/src/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  }
};