// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const util = require("util");

const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

test("parser parses large json result without vulnuerable extensions successfully", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/localhost.json",
    {
      encoding: "utf8",
    }
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parser parses large json result with vulnuerable extensions successfully", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/localhost_vuln_extensions.json",
    {
      encoding: "utf8",
    }
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});