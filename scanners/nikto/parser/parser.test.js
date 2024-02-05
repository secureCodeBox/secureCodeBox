// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { readFile } = require("fs/promises");
const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

const {parse} = require("./parser");

test("parses www.securecodebox.io result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/docs.securecodebox.io.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses OWASP Juice Shop result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/juice-shop.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse empty json file", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/empty-report.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});

test("parses 'no web server found' finding correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/unresolvable-host.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
});
