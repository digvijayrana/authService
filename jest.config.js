module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.js",

    // ❌ EXCLUDE THESE
    "!src/server.js",
    "!src/app.js",
    "!src/config/**",
    "!src/logger.js",
    "!src/swagger/**",
    "!src/utils**"
  ],

  coverageReporters: [
    "json",
    "lcov",
    "text",
    "clover",
    "html"      // 👈 IMPORTANT
  ],
  coveragePathIgnorePatterns: [
  "/node_modules/",
  "src/utils/password/"
],

  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
