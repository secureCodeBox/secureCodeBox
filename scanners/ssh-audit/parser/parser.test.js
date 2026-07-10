// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "node:fs/promises";
import { validateParser } from "@securecodebox/parser-sdk-nodejs/parser-utils";

import { parse } from "./parser";

test("ssh-audit parser parses a result into proper findings for dummy-ssh", async () => {
  const hosts = await readFile(__dirname + "/__testFiles__/dummy-ssh.json", {
    encoding: "utf8",
  });
  const findings = await parse(hosts);
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse empty json file", async () => {
  const jsonContent = await readFile(
    __dirname + "/__testFiles__/test-empty-report.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(jsonContent);
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});

test("ssh-audit parser parses a result into proper findings for an example with given port", async () => {
  const hosts = await readFile(__dirname + "/__testFiles__/portExample.json", {
    encoding: "utf8",
  });
  const findings = await parse(hosts);
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchSnapshot();
});
