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

test("should properly parse whatweb xml file", async () => {
  const xmlContent = await readFile(
    __dirname + "/__testFiles__/example.com.xml",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(xmlContent);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
Array [
  Object {
    "attributes": Object {
      "Country": "EUROPEAN UNION EU",
      "HTML5": "",
      "HTTPServer": "ECS (dcb/7EEA)",
      "requestConfig": Object {
        "headerName": "User-Agent",
        "headerValue": "WhatWeb/0.5.0",
      },
    },
    "category": "URL",
    "description": "Example Domain",
    "location": "93.184.216.34",
    "name": "http://example.com",
    "osi_layer": "NETWORK",
    "severity": "INFORMATIONAL",
  },
]
`);
});

test("should properly parse two xml with two targets", async () => {
  const xmlContent = await readFile(
    __dirname + "/__testFiles__/two-domains.xml",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(xmlContent);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
Array [
  Object {
    "attributes": Object {
      "Country": "EUROPEAN UNION EU",
      "HTML5": "",
      "HTTPServer": "ECS (dcb/7F5E)",
      "requestConfig": Object {
        "headerName": "User-Agent",
        "headerValue": "WhatWeb/0.5.0",
      },
    },
    "category": "URL",
    "description": "Example Domain",
    "location": "93.184.216.34",
    "name": "http://example.com",
    "osi_layer": "NETWORK",
    "severity": "INFORMATIONAL",
  },
  Object {
    "attributes": Object {
      "Country": "EUROPEAN UNION EU",
      "HTML5": "",
      "HTTPServer": "ECS (dcb/7EEA)",
      "requestConfig": Object {
        "headerName": "User-Agent",
        "headerValue": "WhatWeb/0.5.0",
      },
    },
    "category": "URL",
    "description": "Example Domain",
    "location": "93.184.216.34",
    "name": "http://example.com",
    "osi_layer": "NETWORK",
    "severity": "INFORMATIONAL",
  },
]
`);
});

test("should properly parse whatweb xml file", async () => {
  const xmlContent = await readFile(
    __dirname + "/__testFiles__/securecodebox.io.xml",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(xmlContent);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
Array [
  Object {
    "attributes": Object {
      "HTML5": "",
      "HTTPServer": "GitHub.com",
      "Meta-Refresh-Redirect": "https://docs.securecodebox.io/",
      "Strict-Transport-Security": "max-age=31556952",
      "UncommonHeaders": "access-control-allow-origin,x-proxy-cache,x-github-request-id,x-served-by,x-cache-hits,x-timer,x-fastly-request-id",
      "Via-Proxy": "1.1 varnish",
      "requestConfig": Object {
        "headerName": "User-Agent",
        "headerValue": "WhatWeb/0.5.0",
      },
    },
    "category": "URL",
    "description": "secureCodeBox %E2 Testing your Software Security",
    "location": "185.199.108.153",
    "name": "https://www.securecodebox.io",
    "osi_layer": "NETWORK",
    "severity": "INFORMATIONAL",
  },
  Object {
    "attributes": Object {
      "Country": "UNITED STATES US",
      "HTML5": "",
      "HTTPServer": "Netlify",
      "MetaGenerator": "Docusaurus v2.0.0-beta.3",
      "Open-Graph-Protocol": "",
      "Script": "",
      "Strict-Transport-Security": "max-age=31536000",
      "UncommonHeaders": "x-nf-request-id",
      "requestConfig": Object {
        "headerName": "User-Agent",
        "headerValue": "WhatWeb/0.5.0",
      },
    },
    "category": "URL",
    "description": null,
    "location": "206.189.52.23",
    "name": "https://docs.securecodebox.io/",
    "osi_layer": "NETWORK",
    "severity": "INFORMATIONAL",
  },
]
`);
});
