// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { parse } from "./parser";
import { validateParser } from "@securecodebox/parser-sdk-nodejs/parser-utils";

let scan;

beforeEach(() => {
  scan = {
    metadata: {
      name: "my-screenshot-scan",
      namespace: "default",
    },
    spec: {
      scanType: "screenshooter",
      parameters: ["https://www.iteratec.de"],
    },
    status: {
      rawResultDownloadLink: "https://s3.example.com/foobar.png",
    },
  };
});

test("should create finding correctly", async () => {
  const findings = await parse("thisisabinarystringformatedimage", scan);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
[
  {
    "attributes": {
      "downloadLink": "https://s3.example.com/foobar.png",
    },
    "category": "Screenshot",
    "description": "Took a Screenshot for website: 'https://www.iteratec.de'",
    "location": "https://www.iteratec.de",
    "name": "Screenshot for https://www.iteratec.de",
    "osi_layer": "APPLICATION",
    "severity": "INFORMATIONAL",
  },
]
`);
});

test("should not create finding if image is empty", async () => {
  scan.spec.parameters = ["https://www.iteratec.de"];
  const findings = await parse("", scan);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});
