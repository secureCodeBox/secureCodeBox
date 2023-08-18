// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

// eslint-disable-next-line security/detect-non-literal-fs-filename

const {
  parse
} = require("./parser");

test("parser parses example.com sqlite results database successfully", async () => {
  const databasePath = __dirname + "/__testFiles__/example.com.sqlite";

  const findings = await parse(databasePath);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parser parses sqlite results database with empty tables successfully", async () => {
  const databasePath = __dirname + "/__testFiles__/emptyTables.sqlite";
  const findings = await parse(databasePath);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toEqual([]);
});

test("parser parses sqlite results database with no tables successfully", async () => {
  const databasePath = __dirname + "/__testFiles__/noTables.sqlite";

  const findings = await parse(databasePath);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toEqual([]);
});
