module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],
  moduleNameMapper: {
    "@src/(.*)": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/__tests__/**/*+(spec).+(ts)"],
  collectCoverage: true,
  transform: {
    "^.+\\.(ts)$": "ts-jest",
  },
};
