// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "node:fs/promises";
import { validateParser } from "@securecodebox/parser-sdk-nodejs/parser-utils";

import { parse } from "./parser";

test("parser parses example.com sqlite results database successfully", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/example.com.sqlite",
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parser parses sqlite results database with empty tables successfully", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/emptyTables.sqlite",
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toEqual([]);
});

test("parser parses sqlite results database with no tables successfully", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/noTables.sqlite",
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toEqual([]);
});

test("parser parses sqlite results database with empty relations table successfully", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/emptyRelations.sqlite",
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});
