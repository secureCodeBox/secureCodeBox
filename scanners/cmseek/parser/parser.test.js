// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "fs/promises";

import { parse } from "./parser";

import { validateParser } from "@securecodebox/parser-sdk-nodejs/parser-utils";

test("parser parses result of Joomla scan with core vulnerabilities successfully", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/joomla_with_core_vulns.json",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(JSON.parse(fileContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parser parses result of Joomla scan without core vulnerabilities successfully", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/joomla_without_core_vulns.json",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(JSON.parse(fileContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parser parses result of non-Joomla scan successfully", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/not_joomla.json",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(JSON.parse(fileContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse empty cmseek json file", async () => {
  const jsonContent = await readFile(
    import.meta.dirname + "/__testFiles__/test-empty-report.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(jsonContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});
