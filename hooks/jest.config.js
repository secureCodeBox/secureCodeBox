// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  }
}
