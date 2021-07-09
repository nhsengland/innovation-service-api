module.exports =  {
  rootDir:'../../',
  roots: ['<rootDir>/__external__/services/src'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  collectCoverageFrom: [
    "src/services/**/*.(t|j)s"
  ],
  coverageDirectory: "./coverage",
  coveragePathIgnorePatterns: [
    
  ],
  moduleNameMapper: {
    "@domain/(.*)": "<rootDir>/__external__/domain/src/$1",
    "@services/(.*)": "<rootDir>/__external__/services/src/$1"
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
    }
  }
}