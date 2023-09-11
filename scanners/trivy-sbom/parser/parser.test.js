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

let scan;

beforeEach(() => {
  scan = {
    metadata: {
      name: "my-cyclonedx-sbom-scan",
      namespace: "default",
    },
    spec: {
      scanType: "trivy-image-sbom",
      parameters: ["hello-world:latest"],
    },
    status: {
      rawResultDownloadLink: "https://s3.example.com/sbom-cyclonedx.json",
    },
  };
});

test("should create finding correctly", async () => {
  const result = {
    bomFormat: "CycloneDX",
    metadata: {
      component: {
        name: "hello-world:latest"
      }
    }
  };

  const findings = await parse(JSON.stringify(result), scan);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
[
  {
    "attributes": {
      "downloadLink": "https://s3.example.com/sbom-cyclonedx.json",
    },
    "category": "SBOM",
    "description": "Generated an SBOM for: 'hello-world:latest'",
    "name": "SBOM for hello-world:latest",
    "osi_layer": "APPLICATION",
    "severity": "INFORMATIONAL",
  },
]
`);
});

test("should properly parse cyclonedx json sbom file", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/hello-world-cyclonedx.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent, scan);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
  [
    {
      "attributes": {
        "downloadLink": "https://s3.example.com/sbom-cyclonedx.json",
      },
      "category": "SBOM",
      "description": "Generated an SBOM for: 'hello-world:latest'",
      "name": "SBOM for hello-world:latest",
      "osi_layer": "APPLICATION",
      "severity": "INFORMATIONAL",
    },
  ]
  `);
});
