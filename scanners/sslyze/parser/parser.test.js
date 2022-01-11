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

const {
  parse
} = require("./parser");

test("parses result file for www.securecodebox.io correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/www.securecodebox.io.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();

  expect(findings).toContainEqual({
    name: "TLS Service",
    category: "TLS Service Info",
    description: "",
    severity: "INFORMATIONAL",
    osi_layer: "PRESENTATION",
    hint: null,
    reference: null,
    location: "www.securecodebox.io:443",
    attributes: {
      hostname: "www.securecodebox.io",
      ip_address: "185.199.110.153",
      port: 443,
      tls_versions: [
        "TLS 1.2",
        "TLS 1.3"
      ],
      cipher_suites: [
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
        "TLS_AES_128_GCM_SHA256"
      ],
    },
  });

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

  expect(findings).toContainEqual({
    name: "TLS Service",
    category: "TLS Service Info",
    description: "",
    severity: "INFORMATIONAL",
    osi_layer: "PRESENTATION",
    hint: null,
    reference: null,
    location: "tls-v1-0.badssl.com:443",
    attributes: {
      hostname: "tls-v1-0.badssl.com",
      ip_address: "104.154.89.105",
      port: 443,
      tls_versions: [
        "TLS 1.0",
        "TLS 1.1",
        "TLS 1.2"
      ],
      cipher_suites: [
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
        "DHE-RSA-AES128-SHA256"
      ],
    },
  }, );

  expect(findings).toContainEqual({
    name: "TLS Version TLS 1.0 is considered insecure",
    category: "Outdated TLS Version",
    description: "The server uses outdated or insecure tls versions.",
    severity: "MEDIUM",
    hint: "Upgrade to a higher tls version.",
    osi_layer: "PRESENTATION",
    reference: null,
    location: "tls-v1-0.badssl.com:443",
    attributes: {
      hostname: "tls-v1-0.badssl.com",
      ip_address: "104.154.89.105",
      port: 443,
      outdated_version: "TLS 1.0"
    },
  });

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
  expect(findings).toContainEqual({
    name: "TLS Service",
    category: "TLS Service Info",
    description: "",
    severity: "INFORMATIONAL",
    osi_layer: "PRESENTATION",
    hint: null,
    reference: null,
    location: "expired.badssl.com:443",
    attributes: {
      hostname: "expired.badssl.com",
      ip_address: "104.154.89.105",
      port: 443,
      tls_versions: ["TLS 1.0", "TLS 1.1", "TLS 1.2"],
      cipher_suites: [
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
    },
  });

  expect(findings).toContainEqual({
    name: "Expired Certificate",
    description: "Certificate has expired",
    category: "Invalid Certificate",
    severity: "MEDIUM",
    location: "expired.badssl.com:443",
    attributes: {
      hostname: "expired.badssl.com",
      ip_address: "104.154.89.105",
      port: 443,
    },
    hint: null,
    osi_layer: "PRESENTATION",
    reference: null,
  });
});

test("parses result file for wrong.host.badssl.com correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/wrong.host.badssl.com.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();

  expect(findings).toContainEqual({
    name: "TLS Service",
    category: "TLS Service Info",
    description: "",
    severity: "INFORMATIONAL",
    osi_layer: "PRESENTATION",
    hint: null,
    reference: null,
    location: "wrong.host.badssl.com:443",
    attributes: {
      hostname: "wrong.host.badssl.com",
      ip_address: "104.154.89.105",
      port: 443,
      tls_versions: ["TLS 1.0", "TLS 1.1", "TLS 1.2"],
      cipher_suites: [
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
    },
  });

  expect(findings).toContainEqual({
    name: "Invalid Hostname",
    description: "Hostname of Server didn't match the certificates subject names",
    category: "Invalid Certificate",
    severity: "MEDIUM",
    location: "wrong.host.badssl.com:443",
    attributes: {
      hostname: "wrong.host.badssl.com",
      ip_address: "104.154.89.105",
      port: 443,
    },
    hint: null,
    osi_layer: "PRESENTATION",
    reference: null,
  });
});

test("parses result file for untrusted-root.badssl.com correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(
      __dirname + "/__testFiles__/untrusted-root.badssl.com.json", {
        encoding: "utf8",
      }
    )
  );

  const findings = await parse(fileContent);

  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toContainEqual({
    name: "TLS Service",
    category: "TLS Service Info",
    description: "",
    severity: "INFORMATIONAL",
    osi_layer: "PRESENTATION",
    hint: null,
    reference: null,
    location: "untrusted-root.badssl.com:443",
    attributes: {
      hostname: "untrusted-root.badssl.com",
      ip_address: "104.154.89.105",
      port: 443,
      tls_versions: ["TLS 1.0", "TLS 1.1", "TLS 1.2"],
      cipher_suites: [
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
    },
  });

  expect(findings).toContainEqual({
    name: "Untrusted Certificate Root",
    description: "The certificate chain contains a certificate not trusted ",
    category: "Invalid Certificate",
    severity: "MEDIUM",
    location: "untrusted-root.badssl.com:443",
    attributes: {
      hostname: "untrusted-root.badssl.com",
      ip_address: "104.154.89.105",
      port: 443,
    },
    hint: null,
    osi_layer: "PRESENTATION",
    reference: null,
  });
});

test("parses result file for self-signed.badssl.com correctly", async () => {
  const fileContent = JSON.parse(
    await readFile(__dirname + "/__testFiles__/self-signed.badssl.com.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(fileContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();

  expect(findings).toContainEqual({
    name: "TLS Service",
    category: "TLS Service Info",
    description: "",
    severity: "INFORMATIONAL",
    osi_layer: "PRESENTATION",
    hint: null,
    reference: null,
    location: "self-signed.badssl.com:443",
    attributes: {
      hostname: "self-signed.badssl.com",
      ip_address: "104.154.89.105",
      port: 443,
      tls_versions: ["TLS 1.0", "TLS 1.1", "TLS 1.2"],
      cipher_suites: [
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
    },
  });

  expect(findings).toContainEqual({
    name: "Self-Signed Certificate",
    description: "Certificate is self-signed",
    category: "Invalid Certificate",
    severity: "MEDIUM",
    location: "self-signed.badssl.com:443",
    attributes: {
      hostname: "self-signed.badssl.com",
      ip_address: "104.154.89.105",
      port: 443,
    },
    hint: null,
    osi_layer: "PRESENTATION",
    reference: null,
  });
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
    __dirname + "/__testFiles__/test-empty-report.json", {
      encoding: "utf8",
    }
  );
  const findings = await parse(jsonContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot("Array []");
});
