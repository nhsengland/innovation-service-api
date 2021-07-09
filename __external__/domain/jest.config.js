module.exports =  {
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  collectCoverageFrom: [
    "src/**/*.(t|j)s"
  ],
  coveragePathIgnorePatterns: [
    'src/index.ts',
    'src/connections'
  ],
  coverageDirectory: "./coverage",
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    "@domain/(.*)": "<rootDir>/__external__/domain/src/$1",
    "@services/(.*)": "<rootDir>/__external__/services/src/$1"
  }
}