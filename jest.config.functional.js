let jestConfig = require("./jest.config");
jestConfig.testMatch = ["**/__functional-tests__/**/?(*.)+(spec).ts"];
jestConfig.setupFilesAfterEnv = ["<rootDir>/__functional-tests__/Setup.ts"];
module.exports = jestConfig;
