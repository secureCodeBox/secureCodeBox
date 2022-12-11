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
Array [
  Object {
    "attributes": Object {
      "contentType": "text/html; charset=UTF-8",
      "duration": 14335592,
      "headers": Object {},
      "hostname": "www.securecodebox.io",
      "httpStatus": 301,
      "input": Object {
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
    "location": "https://www.securecodebox.io/blog",
    "name": "Webserver Content",
    "osi_layer": "APPLICATION",
    "severity": "INFORMATIONAL",
  },
  Object {
    "attributes": Object {
      "contentType": "text/html; charset=UTF-8",
      "duration": 17386127,
      "headers": Object {},
      "hostname": "www.securecodebox.io",
      "httpStatus": 200,
      "input": Object {
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
    "location": "https://www.securecodebox.io/404",
    "name": "Webserver Content",
    "osi_layer": "APPLICATION",
    "severity": "INFORMATIONAL",
  },
]
`);
});

test("should properly parse ffuf json file wih multiple fuzz keyword inputs", async () => {
  const fileContent = JSON.parse(
    await readFile(
      __dirname + "/__testFiles__/ffuf-results-multiple-fuzz-keywords.json",
      {
        encoding: "utf8",
      }
    )
  );
  const findings = await parse(fileContent);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
Array [
  Object {
    "attributes": Object {
      "contentType": "text/html; charset=UTF-8",
      "duration": 501741303,
      "headers": Object {},
      "hostname": "www.securecodebox.io",
      "httpStatus": 301,
      "input": Object {
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
    "location": "https://www.securecodebox.io/docs/architecture",
    "name": "Webserver Content",
    "osi_layer": "APPLICATION",
    "severity": "INFORMATIONAL",
  },
]
`);
});

test("should properly parse ffuf json file with postdata", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/ffuf-results-postdata.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
Array [
  Object {
    "attributes": Object {
      "contentType": "application/json; charset=utf-8",
      "duration": 248886400,
      "headers": Object {
        "Content-Type": "application/json",
      },
      "hostname": "localhost:3000",
      "httpStatus": 200,
      "input": Object {
        "PASSWORD": "password",
        "USERNAME": "user@example.com",
      },
      "length": 855,
      "lines": 1,
      "postdata": "{\\"email\\":\\"USERNAME\\",\\"password\\":\\"PASSWORD\\"}",
      "redirectlocation": "",
      "words": 1,
    },
    "category": "Webserver Content",
    "description": "Content [password,user@example.com] was found on the webserver localhost:3000.",
    "location": "http://localhost:3000/rest/user/login",
    "name": "Webserver Content",
    "osi_layer": "APPLICATION",
    "severity": "INFORMATIONAL",
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
  expect(findings).toMatchInlineSnapshot(`Array []`);
});

test("should properly parse zero findings json file", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/zeroFindings.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`Array []`);
});

test("should properly parse empty string", async () => {
  const findings = await parse("");
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`Array []`);
});

test("should properly parse null", async () => {
  const findings = await parse(null);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`Array []`);
});

test("should properly parse undefined", async () => {
  const findings = await parse(undefined);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`Array []`);
});
