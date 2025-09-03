// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "node:fs/promises";
import { validateParser } from "@securecodebox/parser-sdk-nodejs/parser-utils";

import { parse } from "./parser";

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
        name: "hello-world:latest",
      },
    },
  };

  const findings = await parse(JSON.stringify(result), scan);
  expect(validateParser(findings)).toBeUndefined();
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
  const fileContent = await readFile(
    __dirname + "/__testFiles__/hello-world-cyclonedx.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent, scan);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
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
