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

test("example parser parses empty json files to zero findings", async () => {
    const fileContent = await readFile(__dirname + "/__testFiles__/empty.jsonl", {
        encoding: "utf8",
    });

    const findings = await parse(fileContent);
    await expect(validateParser(findings)).resolves.toBeUndefined();
    expect(findings).toEqual([]);
});

test("example parser parses large json result successfully", async () => {
    const fileContent = await readFile(
      __dirname + "/__testFiles__/localhost.jsonl",
      {
        encoding: "utf8",
      }
    );
  
    const findings = await parse(fileContent);
    await expect(validateParser(findings)).resolves.toBeUndefined();
    expect(findings).toMatchSnapshot();
  });
  // TODO how to run these tests locally ("npx jest parser.test.js" ?? )