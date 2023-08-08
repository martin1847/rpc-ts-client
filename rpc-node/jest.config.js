/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',//'node'
  // testEnvironment: "node",
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  collectCoverageFrom: ["src/index.ts", "!**/node_modules/**"],
  coverageReporters: ["html", "text", "text-summary", "cobertura"],
  // setupFilesAfterEnv:["<rootDir>/jest.setup.ts"],
  // setupFiles: [
  //   "./jest.setup.ts"
  // ]
};