module.exports = {
  setupFiles: ['<rootDir>/src/setupEnv.js'],
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: [
    'node_modules',
    '<rootDir>/src/index.js',
    'test-config',
    'jestGlobalMocks.js',
    '.module.js',
  ],
  testTimeout: 10000,
  verbose: true,
}
