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

test("parser parses large json result without vulnerable extensions successfully", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/localhost.json",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(JSON.parse(fileContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parser parses large json result with vulnerable extensions successfully", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/localhost_vuln_extensions.json",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(JSON.parse(fileContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse empty json file", async () => {
  const jsonContent = await readFile(
    __dirname + "/__testFiles__/test-empty-report.json",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(jsonContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});
