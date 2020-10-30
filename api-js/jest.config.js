module.exports = {
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: [
    'node_modules',
    'test-config',
    'jestGlobalMocks.js',
    '.module.js',
    'locale',
  ],
  testTimeout: 10000,
}
