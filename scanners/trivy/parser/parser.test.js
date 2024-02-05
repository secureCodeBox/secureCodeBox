// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { readFile } = require("fs/promises");
const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

const {parse} = require("./parser");

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

test("parses bkimminich/juice-shop:v12.10.2 result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/juice-shop-v12.10.2.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("parses securecodebox:master result file into findings", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/securecodebox-repo.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});


test("should properly parse a json file with no .Results", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/juice-shop-v12.10.2-no-results.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);

});

test("should parse a trivy-k8s scan result of a cluster running secureCodeBox itself", async () => {
  const jsonContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/local-k8s-scan-result.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(jsonContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

test("should report an error in case of unexpected attributes in a trivy-k8s scan result", async () => {
  const jsonContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/k8s-results_unexpected-attribute.json", {
      encoding: "utf8",
    })
  );
  await expect(parse(jsonContent)).rejects.toThrow(
    "Unexpected attribute 'Secrets' on resource-item"
  );
});

test("should parse a trivy-k8s scan result", async () => {
  const jsonContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/trivy--k8s-scan-results.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(jsonContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});


test("should properly parse a json file with empty .Results", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/juice-shop-v12.10.2-empty-results.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
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
  expect(findings).toMatchInlineSnapshot(`[]`);
});
