// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const util = require("util");
const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

test("parses empty result correctly", async () => {
  const fileContent = 
    await readFile(
      __dirname + "/__testFiles__/empty-test.jsonl",
      {
        encoding: "utf8",
      }
    )
  
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses a single result correctly", async () => {
  const fileContent = 
    await readFile(
      __dirname + "/__testFiles__/single-test.jsonl",
      {
        encoding: "utf8",
      }
    )
  
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses the dns result correctly", async () => {
  const fileContent = 
    await readFile(
      __dirname + "/__testFiles__/dns-test.jsonl",
      {
        encoding: "utf8",
      }
    )
  
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses ftp result correctly", async () => {
  const fileContent = 
    await readFile(
      __dirname + "/__testFiles__/ftp-test.jsonl",
      {
        encoding: "utf8",
      }
    )
  
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses log4j result correctly", async () => {
  const fileContent = 
    await readFile(
      __dirname + "/__testFiles__/log4j-test.jsonl",
      {
        encoding: "utf8",
      }
    )
  
  const findings = await parse(JSON.parse(fileContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});