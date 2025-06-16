// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "fs/promises";
import { validateParser } from "@securecodebox/parser-sdk-nodejs/parser-utils";

import { parse } from "./parser";

test("Parsing the juice-shop results.", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/juice-shop.xml",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("Parsing the example.com results.", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/example.com.xml",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("Parsing the docs.securecodebox.io results.", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/docs.securecodebox.io.xml",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("Parsing an empty result.", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/not-found.xml",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});

test("Parsing a nginx result.", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/nginx.xml",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("Parsing a bodgeit result.", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/bodgeit.xml",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});
