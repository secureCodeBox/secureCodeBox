// SPDX-FileCopyrightText: 2021 iteratec GmbH
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

test("parses bkimminich/juice-shop:v10.2.0 result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/juice-shop-v10.2.0.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses securecodebox/amass:unstable@sha256:05954f82eaa7bbe81dfc81907113c1e8d9b2409f3d38be3f0e12bccb322bea2c result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(
      __dirname + "/__testFiles__/securecodebox-amass-unstable-pinned.json",
      { encoding: "utf8" }
    )
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses securecodebox/engine with implicit latest tag result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/securecodebox-engine.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses securecodebox/ssh:unstable result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(
      __dirname + "/__testFiles__/securecodebox-ssh-unstable.json",
      { encoding: "utf8" }
    )
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses mediawiki:stable result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/mediawiki-stable.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses mediawiki:1.27.3 result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/mediawiki-1.27.3.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should properly parse empty json file", async () => {
  const jsonContent = await readFile(
    __dirname + "/__testFiles__/test-empty-report.json",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(jsonContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot("Array []");
});
