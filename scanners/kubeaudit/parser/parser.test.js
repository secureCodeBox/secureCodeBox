// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { readFile } = require("fs/promises");
const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

const { parse } = require("./parser");

test("should properly parse kubeaudit juice-shop results", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/juice-shop.jsonl",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();

  expect(findings).toMatchSnapshot();
});

test("should properly parse empty kubeaudit jsonl file", async () => {
  const jsonContent = await readFile(
    __dirname + "/__testFiles__/test-empty-report.jsonl",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(jsonContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});
