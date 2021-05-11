// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { parse } = require("./parser");

let scan;

beforeEach(() => {
  scan = {
    metadata: {
      name: "my-screenshot-scan",
      namespace: "default"
    },
    spec: {
      scanType: "screenshooter",
      parameters: ["https://www.iteratec.de"]
    },
    status: {
      rawResultDownloadLink: "https://s3.example.com/foobar.png"
    }
  };
});

test("should create finding correctly", async () => {
  expect(await parse("thisisabinarystringformatedimage", scan )).toMatchInlineSnapshot(`
    Array [
      Object {
        "attributes": Object {
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
  (scan.spec.parameters = ["https://www.iteratec.de"]),
    expect(await parse("", scan )).toMatchInlineSnapshot(`Array []`);
});
