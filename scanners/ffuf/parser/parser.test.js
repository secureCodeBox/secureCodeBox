// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "fs/promises";
import { validateParser } from "@securecodebox/parser-sdk-nodejs/parser-utils";

import { parse } from "./parser";

test("should properly parse ffuf json file", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/ffuf-results.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
[
  {
    "attributes": {
      "contentType": "text/html; charset=UTF-8",
      "duration": 14335592,
      "headers": {},
      "hostname": "www.securecodebox.io",
      "httpStatus": 301,
      "input": {
        "FUZZ": "blog",
      },
      "length": 7253,
      "lines": 32,
      "postdata": "",
      "redirectlocation": "/blog/",
      "words": 31,
    },
    "category": "Webserver Content",
    "description": "Content [blog] was found on the webserver www.securecodebox.io.",
    "identified_at": "2022-09-19T10:43:30.000Z",
    "location": "https://www.securecodebox.io/blog",
    "name": "Webserver Content",
    "osi_layer": "APPLICATION",
    "severity": "INFORMATIONAL",
  },
  {
    "attributes": {
      "contentType": "text/html; charset=UTF-8",
      "duration": 17386127,
      "headers": {},
      "hostname": "www.securecodebox.io",
      "httpStatus": 200,
      "input": {
        "FUZZ": "404",
      },
      "length": 9152,
      "lines": 23,
      "postdata": "",
      "redirectlocation": "",
      "words": 503,
    },
    "category": "Webserver Content",
    "description": "Content [404] was found on the webserver www.securecodebox.io.",
    "identified_at": "2022-09-19T10:43:30.000Z",
    "location": "https://www.securecodebox.io/404",
    "name": "Webserver Content",
    "osi_layer": "APPLICATION",
    "severity": "INFORMATIONAL",
  },
]
`);
});

test("should properly parse ffuf json file wih multiple fuzz keyword inputs", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/ffuf-results-multiple-fuzz-keywords.json",
    {
      encoding: "utf8",
    },
  );

  const findings = await parse(fileContent);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
[
  {
    "attributes": {
      "contentType": "text/html; charset=UTF-8",
      "duration": 501741303,
      "headers": {},
      "hostname": "www.securecodebox.io",
      "httpStatus": 301,
      "input": {
        "FUZZ1": "docs",
        "FUZZ2": "architecture",
      },
      "length": 7612,
      "lines": 34,
      "postdata": "",
      "redirectlocation": "/docs/architecture/",
      "words": 28,
    },
    "category": "Webserver Content",
    "description": "Content [docs,architecture] was found on the webserver www.securecodebox.io.",
    "identified_at": "2022-09-20T08:07:52.000Z",
    "location": "https://www.securecodebox.io/docs/architecture",
    "name": "Webserver Content",
    "osi_layer": "APPLICATION",
    "severity": "INFORMATIONAL",
  },
]
`);
});

test("should properly parse ffuf json file with postdata", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/ffuf-results-postdata.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
[
  {
    "attributes": {
      "contentType": "application/json; charset=utf-8",
      "duration": 248886400,
      "headers": {
        "Content-Type": "application/json",
      },
      "hostname": "localhost:3000",
      "httpStatus": 200,
      "input": {
        "PASSWORD": "password",
        "USERNAME": "user@example.com",
      },
      "length": 855,
      "lines": 1,
      "postdata": "{"email":"USERNAME","password":"PASSWORD"}",
      "redirectlocation": "",
      "words": 1,
    },
    "category": "Webserver Content",
    "description": "Content [password,user@example.com] was found on the webserver localhost:3000.",
    "identified_at": "2022-09-20T13:05:25.000Z",
    "location": "http://localhost:3000/rest/user/login",
    "name": "Webserver Content",
    "osi_layer": "APPLICATION",
    "severity": "INFORMATIONAL",
  },
]
`);
});

test("should properly parse empty json file", async () => {
  const fileContent = await readFile(__dirname + "/__testFiles__/empty.json", {
    encoding: "utf8",
  });
  const findings = await parse(fileContent);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});

test("should properly parse juice-shop findings json file", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/juice-shop.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "contentType": "text/plain; version=0.0.4; charset=utf-8",
          "duration": 2797417,
          "headers": {},
          "hostname": "juice-shop.demo-targets.svc:3000",
          "httpStatus": 200,
          "input": {
            "FFUFHASH": "1",
            "FUZZ": "metrics",
          },
          "length": 22968,
          "lines": 346,
          "postdata": "",
          "redirectlocation": "",
          "words": 901,
        },
        "category": "Webserver Content",
        "description": "Content [1,metrics] was found on the webserver juice-shop.demo-targets.svc:3000.",
        "identified_at": "2025-07-02T08:55:43.000Z",
        "location": "http://juice-shop.demo-targets.svc:3000/metrics",
        "name": "Webserver Content",
        "osi_layer": "APPLICATION",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "contentType": "text/html; charset=utf-8",
          "duration": 5022084,
          "headers": {},
          "hostname": "juice-shop.demo-targets.svc:3000",
          "httpStatus": 200,
          "input": {
            "FFUFHASH": "2",
            "FUZZ": "ftp",
          },
          "length": 11070,
          "lines": 357,
          "postdata": "",
          "redirectlocation": "",
          "words": 1568,
        },
        "category": "Webserver Content",
        "description": "Content [2,ftp] was found on the webserver juice-shop.demo-targets.svc:3000.",
        "identified_at": "2025-07-02T08:55:43.000Z",
        "location": "http://juice-shop.demo-targets.svc:3000/ftp",
        "name": "Webserver Content",
        "osi_layer": "APPLICATION",
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});

test("should properly parse zero findings json file", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/zeroFindings.json",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(fileContent);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});

test("should properly parse empty string", async () => {
  const findings = await parse("");
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});

test("should properly parse null", async () => {
  const findings = await parse(null);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});

test("should properly parse undefined", async () => {
  const findings = await parse(undefined);
  // validate findings
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});
