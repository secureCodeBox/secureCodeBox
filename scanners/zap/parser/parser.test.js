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

test("Parsing the juice-shop results.", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/juice-shop.xml",
    {
      encoding: "utf8",
    }
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("Parsing the example.com results.", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/example.com.xml",
    {
      encoding: "utf8",
    }
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("Parsing the docs.securecodebox.io results.", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/docs.securecodebox.io.xml",
    {
      encoding: "utf8",
    }
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("Parsing an empty result.", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/not-found.xml",
    {
      encoding: "utf8",
    }
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`Array []`);
});

test("Parsing a nginx result.", async () => {
  const fileContent = await readFile(__dirname + "/__testFiles__/nginx.xml", {
    encoding: "utf8",
  });

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("Parsing a bodgeit result.", async () => {
  const fileContent = await readFile(__dirname + "/__testFiles__/bodgeit.xml", {
    encoding: "utf8",
  });

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});