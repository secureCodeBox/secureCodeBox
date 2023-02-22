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

test("example parser parses empty json files to zero findings", async () => {
  const fileContent = await readFile(__dirname + "/__testFiles__/empty.jsonl", {
    encoding: "utf8",
  });

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toEqual([]);
});

// test("example parser parses missing json files to zero findings", async () => {
//   expect(await parse(null)).toEqual([]);
// });

// test("example parser parses missing json files to zero findings", async () => {
//   expect(await parse(0)).toEqual([]);
// });

test("example parser parses single line json successfully", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/example.com.jsonl",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();

  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "addresses": [
            {
              "asn": 34011,
              "cidr": "10.110.224.0/21",
              "desc": "GD-EMEA-DC-CGN1",
              "ip": "10.110.225.135",
            },
          ],
          "domain": "example.de",
          "name": "www.example.de",
          "source": undefined,
          "tag": "cert",
        },
        "category": "Subdomain",
        "description": "Found subdomain www.example.de",
        "identified_at": undefined,
        "location": "www.example.de",
        "name": "www.example.de",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});

test("example parser parses large json result successfully", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/securecodebox.io.jsonl",
    {
      encoding: "utf8",
    }
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

// axios parses jsonl with a single line / entry as a json object as they are coincidentally also valid json objects.
// This means that the parser needs to also handle objects passed into into it, not just strings
test("handles jsonl files with a single row correctly", async () => {
  const fileContent = {
    name: "www.securecodebox.io",
    domain: "securecodebox.io",
    Timestamp: "2012-04-23T18:25:43.511Z",
    addresses: [
      {
        ip: "185.199.109.153",
        cidr: "185.199.108.0/22",
        asn: 54113,
        desc: "FASTLY - Fastly",
      },
      // ...
    ],
    tag: "cert",
    sources: ["Crtsh"],
  };

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});
