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
  setupFiles: [`<rootDir>/loadershim.js`],
};
