// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { readFile } = require("fs/promises");
const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

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

test("parses the example.com result correctly", async () => {
  const fileContent = 
    await readFile(
      __dirname + "/__testFiles__/example-com-test.jsonl",
      {
        encoding: "utf8",
      }
    )

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test.skip("parses ftp result correctly", async () => {
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

test("parses secureCodeBox.io result correctly", async () => {
  const fileContent = 
    await readFile(
      __dirname + "/__testFiles__/secureCodeBox-test.jsonl",
      {
        encoding: "utf8",
      }
    )

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses log4shell result correctly", async () => {
  const fileContent = 
    await readFile(
      __dirname + "/__testFiles__/log4shell.jsonl",
      {
        encoding: "utf8",
      }
    )

  const findings = await parse(JSON.parse(fileContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses results with requests & responses correctly", async () => {
  const fileContent = 
    await readFile(
      __dirname + "/__testFiles__/example-com-only-misc-tags-with-incluce-rr.jsonl",
      {
        encoding: "utf8",
      }
    )

  const findings = await parse(JSON.parse(fileContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});
