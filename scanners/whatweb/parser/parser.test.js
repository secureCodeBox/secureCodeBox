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

test("should properly parse whatweb json file", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/example.com.json", {
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
          "HTML5": true,
          "HTTPServer": "ECS (dcb/7FA5)",
          "country": "EUROPEAN UNION/EU",
          "ip_addresses": [
            "93.184.216.34",
          ],
          "requestConfig": "WhatWeb/0.5.5",
        },
        "category": "WEB APPLICATION",
        "description": "Example Domain",
        "location": "http://example.com",
        "name": "http://example.com",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});

test("should properly parse empty whatweb json file", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/no-address.com.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(fileContent);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});

test("should properly parse securecodebox.io whatweb json file with higher aggression level(3)", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/securecodebox.io.json", {
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
          "HTTPServer": "GitHub.com",
          "RedirectLocation": "https://www.securecodebox.io/",
          "UncommonHeaders": "x-github-request-id,x-served-by,x-cache-hits,x-timer,x-fastly-request-id",
          "Via-Proxy": "1.1 varnish",
          "country": null,
          "ip_addresses": [
            "185.199.109.153",
          ],
          "requestConfig": "WhatWeb/0.5.5",
        },
        "category": "WEB APPLICATION",
        "description": "301 Moved Permanently",
        "location": "http://securecodebox.io",
        "name": "http://securecodebox.io",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "HTML5": true,
          "HTTPServer": "GitHub.com",
          "Meta-Refresh-Redirect": "https://docs.securecodebox.io/",
          "Strict-Transport-Security": "max-age=31556952",
          "UncommonHeaders": "access-control-allow-origin,x-proxy-cache,x-github-request-id,x-served-by,x-cache-hits,x-timer,x-fastly-request-id",
          "Via-Proxy": "1.1 varnish",
          "country": null,
          "ip_addresses": [
            "185.199.110.153",
          ],
          "requestConfig": "WhatWeb/0.5.5",
        },
        "category": "WEB APPLICATION",
        "description": "secureCodeBox – Testing your Software Security",
        "location": "https://www.securecodebox.io/",
        "name": "https://www.securecodebox.io/",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "HTML5": true,
          "HTTPServer": "Netlify",
          "MetaGenerator": "Docusaurus v2.0.0-beta.3",
          "Open-Graph-Protocol": "",
          "Script": "",
          "Strict-Transport-Security": "max-age=31536000",
          "UncommonHeaders": "x-nf-request-id",
          "country": "UNITED STATES/US",
          "ip_addresses": [
            "3.64.200.242",
          ],
          "requestConfig": "WhatWeb/0.5.5",
        },
        "category": "WEB APPLICATION",
        "description": null,
        "location": "https://docs.securecodebox.io/",
        "name": "https://docs.securecodebox.io/",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});

test("should properly parse whatweb json file with two domains", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/two-domains.json", {
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
          "HTML5": true,
          "HTTPServer": "ECS (dcb/7F39)",
          "country": "EUROPEAN UNION/EU",
          "ip_addresses": [
            "93.184.216.34",
          ],
          "requestConfig": "WhatWeb/0.5.5",
        },
        "category": "WEB APPLICATION",
        "description": "Example Domain",
        "location": "http://example.com",
        "name": "http://example.com",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "Apache": "",
          "Google-Analytics": "",
          "HTTPServer": "Apache/2.4.7 (Ubuntu)",
          "Script": "text/javascript",
          "country": "RESERVED/ZZ",
          "ip_addresses": [
            "45.33.32.156",
          ],
          "requestConfig": "WhatWeb/0.5.5",
        },
        "category": "WEB APPLICATION",
        "description": "Go ahead and ScanMe!",
        "location": "http://scanme.nmap.org",
        "name": "http://scanme.nmap.org",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});
