// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "fs/promises";
import { validateParser } from "@securecodebox/parser-sdk-nodejs/parser-utils";

import { parse } from "./parser";

test("parses www.securecodebox.io result file into findings", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/docs.securecodebox.io.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses OWASP Juice Shop result file into findings", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/juice-shop.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse empty json file", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/empty-report.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});

test("parses 'no web server found' finding correctly", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/unresolvable-host.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  expect(validateParser(findings)).toBeUndefined();
});
