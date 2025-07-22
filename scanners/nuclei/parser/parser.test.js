// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "fs/promises";
import { validateParser } from "@securecodebox/parser-sdk-nodejs/parser-utils";

import { parse } from "./parser";

test("parses empty result correctly", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/empty-test.jsonl",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses the example.com result correctly", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/example-com-test.jsonl",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses secureCodeBox.io result correctly", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/secureCodeBox-test.jsonl",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses log4shell result correctly", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/log4shell.jsonl",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(JSON.parse(fileContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses results with requests & responses correctly", async () => {
  const fileContent = await readFile(
    import.meta.dirname +
      "/__testFiles__/example-com-only-misc-tags-with-incluce-rr.jsonl",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(JSON.parse(fileContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

// some templates, e.g. dns ones, do not contain a port in the hostname
test("parses findings with hostnames which do not contain a port correctly", async () => {
  const fileContent = await readFile(
    import.meta.dirname + "/__testFiles__/hostname-without-port.jsonl",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(JSON.parse(fileContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings[0]).toEqual(
    expect.objectContaining({
      location: "example.com",
      attributes: expect.objectContaining({
        hostname: "example.com",
      }),
    }),
  );
});
