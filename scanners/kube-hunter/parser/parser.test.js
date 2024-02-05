// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { readFile } = require("fs/promises");
const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

const { parse } = require("./parser");

test("parses result from kind-1.18-in-cluster-scan correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(
      __dirname + "/__testFiles__/kind-1.18-in-cluster-scan.json",
      {
        encoding: "utf8",
      }
    )
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse empty kube-hunter json file", async () => {
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
