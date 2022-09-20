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

const {parse} = require("./parser");

test("should properly parse ffuf json file", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/ffuf-results.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "contentType": "text/html; charset=UTF-8",
          "duration": 14335592,
          "hostname": "www.securecodebox.io",
          "httpStatus": 301,
          "length": 7253,
          "lines": 32,
          "redirectlocation": "/blog/",
          "resultFile": "",
          "words": 31,
        },
        "category": "Webserver Content",
        "description": "Content blog was found on the webserver www.securecodebox.io.",
        "location": "https://www.securecodebox.io/blog",
        "name": "Webserver Content",
        "osi_layer": "APPLICATION",
        "severity": "LOW",
      },
      {
        "attributes": {
          "contentType": "text/html; charset=UTF-8",
          "duration": 17386127,
          "hostname": "www.securecodebox.io",
          "httpStatus": 200,
          "length": 9152,
          "lines": 23,
          "redirectlocation": "",
          "resultFile": "",
          "words": 503,
        },
        "category": "Webserver Content",
        "description": "Content 404 was found on the webserver www.securecodebox.io.",
        "location": "https://www.securecodebox.io/404",
        "name": "Webserver Content",
        "osi_layer": "APPLICATION",
        "severity": "LOW",
      },
    ]
  `);
});

test("should properly parse empty json file", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/empty.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});
