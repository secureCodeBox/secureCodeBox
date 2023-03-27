// SPDX-FileCopyrightText: the secureCodeBox authors
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

test("should properly parse doggo json file", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/example.com.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse empty json file", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/empty.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});
