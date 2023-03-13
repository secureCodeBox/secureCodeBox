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

test("parses result file for www.securecodebox.io correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/www.securecodebox.io.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();

  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "cipher_suites": [
            "AES256-SHA",
            "AES128-GCM-SHA256",
            "AES128-SHA",
            "ECDHE-RSA-CHACHA20-POLY1305",
            "ECDHE-RSA-AES256-GCM-SHA384",
            "ECDHE-RSA-AES256-SHA384",
            "ECDHE-RSA-AES256-SHA",
            "ECDHE-RSA-AES128-GCM-SHA256",
            "ECDHE-RSA-AES128-SHA256",
            "ECDHE-RSA-AES128-SHA",
            "TLS_CHACHA20_POLY1305_SHA256",
            "TLS_AES_256_GCM_SHA384",
            "TLS_AES_128_GCM_SHA256",
          ],
          "hostname": "www.securecodebox.io",
          "ip_address": "185.199.110.153",
          "port": 443,
          "tls_versions": [
            "TLS 1.2",
            "TLS 1.3",
          ],
        },
        "category": "TLS Service Info",
        "description": "",
        "identified_at": "2021-12-22T13:07:17.614Z",
        "location": "www.securecodebox.io:443",
        "mitigation": null,
        "name": "TLS Service",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "INFORMATIONAL",
      },
    ]
  `);
  expect(findings.length).toEqual(1);
});

test("parses result file for tls-v1-0.badssl.com:1010 correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/tls-v1-0.badssl.com_1010.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();

  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "cipher_suites": [
            "CAMELLIA256-SHA",
            "CAMELLIA128-SHA",
            "AES256-SHA",
            "AES128-SHA",
            "DES-CBC3-SHA",
            "ECDHE-RSA-AES256-SHA",
            "ECDHE-RSA-AES128-SHA",
            "ECDHE-RSA-DES-CBC3-SHA",
            "DHE-RSA-CAMELLIA256-SHA",
            "DHE-RSA-CAMELLIA128-SHA",
            "DHE-RSA-AES256-SHA",
            "DHE-RSA-AES128-SHA",
            "AES256-GCM-SHA384",
            "AES256-SHA256",
            "AES128-GCM-SHA256",
            "AES128-SHA256",
            "ECDHE-RSA-AES256-GCM-SHA384",
            "ECDHE-RSA-AES256-SHA384",
            "ECDHE-RSA-AES128-GCM-SHA256",
            "ECDHE-RSA-AES128-SHA256",
            "DHE-RSA-AES256-GCM-SHA384",
            "DHE-RSA-AES256-SHA256",
            "DHE-RSA-AES128-GCM-SHA256",
            "DHE-RSA-AES128-SHA256",
          ],
          "hostname": "tls-v1-0.badssl.com",
          "ip_address": "104.154.89.105",
          "port": 443,
          "tls_versions": [
            "TLS 1.0",
            "TLS 1.1",
            "TLS 1.2",
          ],
        },
        "category": "TLS Service Info",
        "description": "",
        "identified_at": "2021-12-22T13:00:24.567Z",
        "location": "tls-v1-0.badssl.com:443",
        "mitigation": null,
        "name": "TLS Service",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "tls-v1-0.badssl.com",
          "ip_address": "104.154.89.105",
          "outdated_version": "TLS 1.0",
          "port": 443,
        },
        "category": "Outdated TLS Version",
        "description": "The server uses outdated or insecure tls versions.",
        "identified_at": "2021-12-22T13:00:24.567Z",
        "location": "tls-v1-0.badssl.com:443",
        "mitigation": "Upgrade to a higher tls version.",
        "name": "TLS Version TLS 1.0 is considered insecure",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
      {
        "attributes": {
          "hostname": "tls-v1-0.badssl.com",
          "ip_address": "104.154.89.105",
          "outdated_version": "TLS 1.1",
          "port": 443,
        },
        "category": "Outdated TLS Version",
        "description": "The server uses outdated or insecure tls versions.",
        "identified_at": "2021-12-22T13:00:24.567Z",
        "location": "tls-v1-0.badssl.com:443",
        "mitigation": "Upgrade to a higher tls version.",
        "name": "TLS Version TLS 1.1 is considered insecure",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
    ]
  `);

  expect(findings.length).toEqual(3);
});

test("parses result file for expired.badssl.com correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/expired.badssl.com.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(fileContent);

  await expect(validateParser(findings)).resolves.toBeUndefined();

  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "cipher_suites": [
            "CAMELLIA256-SHA",
            "CAMELLIA128-SHA",
            "AES256-SHA",
            "AES128-SHA",
            "DES-CBC3-SHA",
            "ECDHE-RSA-AES256-SHA",
            "ECDHE-RSA-AES128-SHA",
            "ECDHE-RSA-DES-CBC3-SHA",
            "DHE-RSA-CAMELLIA256-SHA",
            "DHE-RSA-CAMELLIA128-SHA",
            "DHE-RSA-AES256-SHA",
            "DHE-RSA-AES128-SHA",
            "AES256-GCM-SHA384",
            "AES256-SHA256",
            "AES128-GCM-SHA256",
            "AES128-SHA256",
            "ECDHE-RSA-AES256-GCM-SHA384",
            "ECDHE-RSA-AES256-SHA384",
            "ECDHE-RSA-AES128-GCM-SHA256",
            "ECDHE-RSA-AES128-SHA256",
            "DHE-RSA-AES256-GCM-SHA384",
            "DHE-RSA-AES256-SHA256",
            "DHE-RSA-AES128-GCM-SHA256",
            "DHE-RSA-AES128-SHA256",
          ],
          "hostname": "expired.badssl.com",
          "ip_address": "104.154.89.105",
          "port": 443,
          "tls_versions": [
            "TLS 1.0",
            "TLS 1.1",
            "TLS 1.2",
          ],
        },
        "category": "TLS Service Info",
        "description": "",
        "identified_at": "2021-12-28T12:21:27.539Z",
        "location": "expired.badssl.com:443",
        "mitigation": null,
        "name": "TLS Service",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "expired.badssl.com",
          "ip_address": "104.154.89.105",
          "outdated_version": "TLS 1.0",
          "port": 443,
        },
        "category": "Outdated TLS Version",
        "description": "The server uses outdated or insecure tls versions.",
        "identified_at": "2021-12-28T12:21:27.539Z",
        "location": "expired.badssl.com:443",
        "mitigation": "Upgrade to a higher tls version.",
        "name": "TLS Version TLS 1.0 is considered insecure",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
      {
        "attributes": {
          "hostname": "expired.badssl.com",
          "ip_address": "104.154.89.105",
          "outdated_version": "TLS 1.1",
          "port": 443,
        },
        "category": "Outdated TLS Version",
        "description": "The server uses outdated or insecure tls versions.",
        "identified_at": "2021-12-28T12:21:27.539Z",
        "location": "expired.badssl.com:443",
        "mitigation": "Upgrade to a higher tls version.",
        "name": "TLS Version TLS 1.1 is considered insecure",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
      {
        "attributes": {
          "hostname": "expired.badssl.com",
          "ip_address": "104.154.89.105",
          "port": 443,
        },
        "category": "Invalid Certificate",
        "description": "Certificate has expired",
        "identified_at": "2021-12-28T12:21:27.539Z",
        "location": "expired.badssl.com:443",
        "mitigation": null,
        "name": "Expired Certificate",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
    ]
  `);
});

test("parses result file for wrong.host.badssl.com correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/wrong.host.badssl.com.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();

  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "cipher_suites": [
            "CAMELLIA256-SHA",
            "CAMELLIA128-SHA",
            "AES256-SHA",
            "AES128-SHA",
            "DES-CBC3-SHA",
            "ECDHE-RSA-AES256-SHA",
            "ECDHE-RSA-AES128-SHA",
            "ECDHE-RSA-DES-CBC3-SHA",
            "DHE-RSA-CAMELLIA256-SHA",
            "DHE-RSA-CAMELLIA128-SHA",
            "DHE-RSA-AES256-SHA",
            "DHE-RSA-AES128-SHA",
            "AES256-GCM-SHA384",
            "AES256-SHA256",
            "AES128-GCM-SHA256",
            "AES128-SHA256",
            "ECDHE-RSA-AES256-GCM-SHA384",
            "ECDHE-RSA-AES256-SHA384",
            "ECDHE-RSA-AES128-GCM-SHA256",
            "ECDHE-RSA-AES128-SHA256",
            "DHE-RSA-AES256-GCM-SHA384",
            "DHE-RSA-AES256-SHA256",
            "DHE-RSA-AES128-GCM-SHA256",
            "DHE-RSA-AES128-SHA256",
          ],
          "hostname": "wrong.host.badssl.com",
          "ip_address": "104.154.89.105",
          "port": 443,
          "tls_versions": [
            "TLS 1.0",
            "TLS 1.1",
            "TLS 1.2",
          ],
        },
        "category": "TLS Service Info",
        "description": "",
        "identified_at": "2021-12-22T13:06:29.937Z",
        "location": "wrong.host.badssl.com:443",
        "mitigation": null,
        "name": "TLS Service",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "wrong.host.badssl.com",
          "ip_address": "104.154.89.105",
          "outdated_version": "TLS 1.0",
          "port": 443,
        },
        "category": "Outdated TLS Version",
        "description": "The server uses outdated or insecure tls versions.",
        "identified_at": "2021-12-22T13:06:29.937Z",
        "location": "wrong.host.badssl.com:443",
        "mitigation": "Upgrade to a higher tls version.",
        "name": "TLS Version TLS 1.0 is considered insecure",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
      {
        "attributes": {
          "hostname": "wrong.host.badssl.com",
          "ip_address": "104.154.89.105",
          "outdated_version": "TLS 1.1",
          "port": 443,
        },
        "category": "Outdated TLS Version",
        "description": "The server uses outdated or insecure tls versions.",
        "identified_at": "2021-12-22T13:06:29.937Z",
        "location": "wrong.host.badssl.com:443",
        "mitigation": "Upgrade to a higher tls version.",
        "name": "TLS Version TLS 1.1 is considered insecure",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
      {
        "attributes": {
          "hostname": "wrong.host.badssl.com",
          "ip_address": "104.154.89.105",
          "port": 443,
        },
        "category": "Invalid Certificate",
        "description": "Hostname of Server didn't match the certificates subject names",
        "identified_at": "2021-12-22T13:06:29.937Z",
        "location": "wrong.host.badssl.com:443",
        "mitigation": null,
        "name": "Invalid Hostname",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
    ]
  `);
});

test("parses result file for untrusted-root.badssl.com correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(
      __dirname + "/__testFiles__/untrusted-root.badssl.com.json",
      {
        encoding: "utf8",
      }
    )
  );

  const findings = await parse(fileContent);

  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "cipher_suites": [
            "CAMELLIA256-SHA",
            "CAMELLIA128-SHA",
            "AES256-SHA",
            "AES128-SHA",
            "DES-CBC3-SHA",
            "ECDHE-RSA-AES256-SHA",
            "ECDHE-RSA-AES128-SHA",
            "ECDHE-RSA-DES-CBC3-SHA",
            "DHE-RSA-CAMELLIA256-SHA",
            "DHE-RSA-CAMELLIA128-SHA",
            "DHE-RSA-AES256-SHA",
            "DHE-RSA-AES128-SHA",
            "AES256-GCM-SHA384",
            "AES256-SHA256",
            "AES128-GCM-SHA256",
            "AES128-SHA256",
            "ECDHE-RSA-AES256-GCM-SHA384",
            "ECDHE-RSA-AES256-SHA384",
            "ECDHE-RSA-AES128-GCM-SHA256",
            "ECDHE-RSA-AES128-SHA256",
            "DHE-RSA-AES256-GCM-SHA384",
            "DHE-RSA-AES256-SHA256",
            "DHE-RSA-AES128-GCM-SHA256",
            "DHE-RSA-AES128-SHA256",
          ],
          "hostname": "untrusted-root.badssl.com",
          "ip_address": "104.154.89.105",
          "port": 443,
          "tls_versions": [
            "TLS 1.0",
            "TLS 1.1",
            "TLS 1.2",
          ],
        },
        "category": "TLS Service Info",
        "description": "",
        "identified_at": "2021-12-22T13:01:41.243Z",
        "location": "untrusted-root.badssl.com:443",
        "mitigation": null,
        "name": "TLS Service",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "untrusted-root.badssl.com",
          "ip_address": "104.154.89.105",
          "outdated_version": "TLS 1.0",
          "port": 443,
        },
        "category": "Outdated TLS Version",
        "description": "The server uses outdated or insecure tls versions.",
        "identified_at": "2021-12-22T13:01:41.243Z",
        "location": "untrusted-root.badssl.com:443",
        "mitigation": "Upgrade to a higher tls version.",
        "name": "TLS Version TLS 1.0 is considered insecure",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
      {
        "attributes": {
          "hostname": "untrusted-root.badssl.com",
          "ip_address": "104.154.89.105",
          "outdated_version": "TLS 1.1",
          "port": 443,
        },
        "category": "Outdated TLS Version",
        "description": "The server uses outdated or insecure tls versions.",
        "identified_at": "2021-12-22T13:01:41.243Z",
        "location": "untrusted-root.badssl.com:443",
        "mitigation": "Upgrade to a higher tls version.",
        "name": "TLS Version TLS 1.1 is considered insecure",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
      {
        "attributes": {
          "hostname": "untrusted-root.badssl.com",
          "ip_address": "104.154.89.105",
          "port": 443,
        },
        "category": "Invalid Certificate",
        "description": "The certificate chain contains a certificate not trusted ",
        "identified_at": "2021-12-22T13:01:41.243Z",
        "location": "untrusted-root.badssl.com:443",
        "mitigation": null,
        "name": "Untrusted Certificate Root",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
    ]
  `);
});

test("parses result file for self-signed.badssl.com correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/self-signed.badssl.com.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();

  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "cipher_suites": [
            "CAMELLIA256-SHA",
            "CAMELLIA128-SHA",
            "AES256-SHA",
            "AES128-SHA",
            "DES-CBC3-SHA",
            "ECDHE-RSA-AES256-SHA",
            "ECDHE-RSA-AES128-SHA",
            "ECDHE-RSA-DES-CBC3-SHA",
            "DHE-RSA-CAMELLIA256-SHA",
            "DHE-RSA-CAMELLIA128-SHA",
            "DHE-RSA-AES256-SHA",
            "DHE-RSA-AES128-SHA",
            "AES256-GCM-SHA384",
            "AES256-SHA256",
            "AES128-GCM-SHA256",
            "AES128-SHA256",
            "ECDHE-RSA-AES256-GCM-SHA384",
            "ECDHE-RSA-AES256-SHA384",
            "ECDHE-RSA-AES128-GCM-SHA256",
            "ECDHE-RSA-AES128-SHA256",
            "DHE-RSA-AES256-GCM-SHA384",
            "DHE-RSA-AES256-SHA256",
            "DHE-RSA-AES128-GCM-SHA256",
            "DHE-RSA-AES128-SHA256",
          ],
          "hostname": "self-signed.badssl.com",
          "ip_address": "104.154.89.105",
          "port": 443,
          "tls_versions": [
            "TLS 1.0",
            "TLS 1.1",
            "TLS 1.2",
          ],
        },
        "category": "TLS Service Info",
        "description": "",
        "identified_at": "2021-12-22T12:57:56.762Z",
        "location": "self-signed.badssl.com:443",
        "mitigation": null,
        "name": "TLS Service",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "self-signed.badssl.com",
          "ip_address": "104.154.89.105",
          "outdated_version": "TLS 1.0",
          "port": 443,
        },
        "category": "Outdated TLS Version",
        "description": "The server uses outdated or insecure tls versions.",
        "identified_at": "2021-12-22T12:57:56.762Z",
        "location": "self-signed.badssl.com:443",
        "mitigation": "Upgrade to a higher tls version.",
        "name": "TLS Version TLS 1.0 is considered insecure",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
      {
        "attributes": {
          "hostname": "self-signed.badssl.com",
          "ip_address": "104.154.89.105",
          "outdated_version": "TLS 1.1",
          "port": 443,
        },
        "category": "Outdated TLS Version",
        "description": "The server uses outdated or insecure tls versions.",
        "identified_at": "2021-12-22T12:57:56.762Z",
        "location": "self-signed.badssl.com:443",
        "mitigation": "Upgrade to a higher tls version.",
        "name": "TLS Version TLS 1.1 is considered insecure",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
      {
        "attributes": {
          "hostname": "self-signed.badssl.com",
          "ip_address": "104.154.89.105",
          "port": 443,
        },
        "category": "Invalid Certificate",
        "description": "Certificate is self-signed",
        "identified_at": "2021-12-22T12:57:56.762Z",
        "location": "self-signed.badssl.com:443",
        "mitigation": null,
        "name": "Self-Signed Certificate",
        "osi_layer": "PRESENTATION",
        "reference": null,
        "severity": "MEDIUM",
      },
    ]
  `);
});

test("parses an empty result file correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/unavailable-host.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toEqual([]);
});

test("should properly parse empty json file", async () => {
  const jsonContent = await readFile(
    __dirname + "/__testFiles__/test-empty-report.json",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(jsonContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});
