let jestConfig = require("./jest.config");
jestConfig.testMatch = ["**/src/__functional-tests__/**/?(*.)+(spec).ts"];
jestConfig.setupFilesAfterEnv = ["<rootDir>/src/__functional-tests__/Setup.ts"];
jestConfig.collectCoverage = false;
module.exports = jestConfig;
