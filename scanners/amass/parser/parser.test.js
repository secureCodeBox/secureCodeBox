// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const util = require("util");
const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

test("parser parses example.com sqlite results database successfully", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/example.com.sqlite"
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parser parses sqlite results database with empty tables successfully", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/emptyTables.sqlite"
  );
  
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toEqual([]);
});

test("parser parses sqlite results database with no tables successfully", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/noTables.sqlite",
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toEqual([]);
});

test("parser parses sqlite results database with empty relations (i.e with -passive arg) successfully", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/passive.sqlite",
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});
