// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  rootDir: __dirname,
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  setupFiles: ['<rootDir>/loadershim.js'],
  coveragePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/website/',
    '<rootDir>/scripts/',
    '<rootDir>/rollup.config.js',
  ],
};
