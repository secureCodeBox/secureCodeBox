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

test("parses bkimminich/juice-shop:v10.2.0 result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/juice-shop-v10.2.0.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses bkimminich/juice-shop:v12.10.2 result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/juice-shop-v12.10.2.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses securecodebox:master result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/securecodebox-repo.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
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
  expect(findings).toMatchInlineSnapshot("Array []");
});
