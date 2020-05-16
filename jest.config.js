// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  rootDir: __dirname,
  moduleNameMapper: {
    '^@color2k/(.+)': '<rootDir>/packages/$1/src',
    '^color2k$': '<rootDir>/packages/color2k/src',
    '^prettier$': '<rootDir>/node_modules/prettier',
  },
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  setupFiles: ['<rootDir>/loadershim.js'],
  coveragePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/website/',
    '<rootDir>/scripts/',
    '<rootDir>/rollup.config.js',
    // this file isn't reported correctly because the coverage tool can't see
    // that playwright runs the code in different browsers
    '<rootDir>/packages/parse-to-rgba/',
  ],
};
