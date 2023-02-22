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

const { parse } = require("./parser");

test("ssh-scan parser parses errored result (no ssh server) to zero findings", async () => {
  const hosts = JSON.parse(
    await readFile(__dirname + "/__testFiles__/localhost.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(hosts);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toEqual([]);
});

test("ssh-scan parser parses a proper result to proper findings", async () => {
  const hosts = JSON.parse(
    await readFile(__dirname + "/__testFiles__/securecodebox.io.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(hosts);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
[
  {
    "attributes": {
      "auth_methods": [
        "publickey",
      ],
      "compliance_policy": "Mozilla Modern",
      "compliant": false,
      "compression_algorithms": [
        "none",
        "zlib@openssh.com",
      ],
      "encryption_algorithms": [
        "chacha20-poly1305@openssh.com",
        "aes128-ctr",
        "aes192-ctr",
        "aes256-ctr",
        "aes128-gcm@openssh.com",
        "aes256-gcm@openssh.com",
      ],
      "grade": "C",
      "hostname": "securecodebox.io",
      "ip_address": "138.201.126.99",
      "key_algorithms": [
        "curve25519-sha256@libssh.org",
        "ecdh-sha2-nistp256",
        "ecdh-sha2-nistp384",
        "ecdh-sha2-nistp521",
        "diffie-hellman-group-exchange-sha256",
        "diffie-hellman-group14-sha1",
      ],
      "mac_algorithms": [
        "umac-64-etm@openssh.com",
        "umac-128-etm@openssh.com",
        "hmac-sha2-256-etm@openssh.com",
        "hmac-sha2-512-etm@openssh.com",
        "hmac-sha1-etm@openssh.com",
        "umac-64@openssh.com",
        "umac-128@openssh.com",
        "hmac-sha2-256",
        "hmac-sha2-512",
        "hmac-sha1",
      ],
      "os_cpe": "o:canonical:ubuntu:16.04",
      "references": [
        "https://wiki.mozilla.org/Security/Guidelines/OpenSSH",
      ],
      "server_banner": "SSH-2.0-OpenSSH_7.2p2 Ubuntu-4ubuntu2.4",
      "ssh_lib_cpe": "a:openssh:openssh:7.2p2",
      "ssh_version": 2,
    },
    "category": "SSH Service",
    "description": "SSH Service Information",
    "hint": "",
    "location": "securecodebox.io",
    "name": "SSH Service",
    "osi_layer": "APPLICATION",
    "reference": {},
    "severity": "INFORMATIONAL",
  },
  {
    "attributes": {
      "hostname": "securecodebox.io",
      "ip_address": "138.201.126.99",
      "payload": [
        "diffie-hellman-group14-sha1",
      ],
    },
    "category": "SSH Policy Violation",
    "description": "Deprecated / discouraged SSH key algorithms are used",
    "hint": "Remove these key exchange algorithms: diffie-hellman-group14-sha1",
    "location": "securecodebox.io",
    "name": "Insecure SSH Key Algorithms",
    "osi_layer": "NETWORK",
    "reference": {},
    "severity": "MEDIUM",
  },
  {
    "attributes": {
      "hostname": "securecodebox.io",
      "ip_address": "138.201.126.99",
      "payload": [
        "umac-64-etm@openssh.com",
        "hmac-sha1-etm@openssh.com",
        "umac-64@openssh.com",
        "hmac-sha1",
      ],
    },
    "category": "SSH Policy Violation",
    "description": "Deprecated / discouraged SSH MAC algorithms are used",
    "hint": "Remove these MAC algorithms: umac-64-etm@openssh.com, hmac-sha1-etm@openssh.com, umac-64@openssh.com, hmac-sha1",
    "location": "securecodebox.io",
    "name": "Insecure SSH MAC Algorithms",
    "osi_layer": "NETWORK",
    "reference": {},
    "severity": "MEDIUM",
  },
]
`);
});

test("ssh-scan parser parses a result without a hostname into proper findings", async () => {
  const hosts = JSON.parse(
    await readFile(__dirname + "/__testFiles__/192.168.42.42.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(hosts);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
[
  {
    "attributes": {
      "auth_methods": [
        "publickey",
        "password",
      ],
      "compliance_policy": "Mozilla Modern",
      "compliant": false,
      "compression_algorithms": [
        "none",
        "zlib@openssh.com",
      ],
      "encryption_algorithms": [
        "chacha20-poly1305@openssh.com",
        "aes128-ctr",
        "aes192-ctr",
        "aes256-ctr",
        "aes128-gcm@openssh.com",
        "aes256-gcm@openssh.com",
      ],
      "grade": "D",
      "hostname": null,
      "ip_address": "192.168.42.42",
      "key_algorithms": [
        "curve25519-sha256@libssh.org",
        "ecdh-sha2-nistp256",
        "ecdh-sha2-nistp384",
        "ecdh-sha2-nistp521",
        "diffie-hellman-group-exchange-sha256",
        "diffie-hellman-group14-sha1",
      ],
      "mac_algorithms": [
        "umac-64-etm@openssh.com",
        "umac-128-etm@openssh.com",
        "hmac-sha2-256-etm@openssh.com",
        "hmac-sha2-512-etm@openssh.com",
        "hmac-sha1-etm@openssh.com",
        "umac-64@openssh.com",
        "umac-128@openssh.com",
        "hmac-sha2-256",
        "hmac-sha2-512",
        "hmac-sha1",
      ],
      "os_cpe": "o:canonical:ubuntu:16.04",
      "references": [
        "https://wiki.mozilla.org/Security/Guidelines/OpenSSH",
      ],
      "server_banner": "SSH-2.0-OpenSSH_7.2p2 Ubuntu-4ubuntu2.8",
      "ssh_lib_cpe": "a:openssh:openssh:7.2p2",
      "ssh_version": 2,
    },
    "category": "SSH Service",
    "description": "SSH Service Information",
    "hint": "",
    "location": "192.168.42.42",
    "name": "SSH Service",
    "osi_layer": "APPLICATION",
    "reference": {},
    "severity": "INFORMATIONAL",
  },
  {
    "attributes": {
      "hostname": null,
      "ip_address": "192.168.42.42",
      "payload": [
        "diffie-hellman-group14-sha1",
      ],
    },
    "category": "SSH Policy Violation",
    "description": "Deprecated / discouraged SSH key algorithms are used",
    "hint": "Remove these key exchange algorithms: diffie-hellman-group14-sha1",
    "location": "192.168.42.42",
    "name": "Insecure SSH Key Algorithms",
    "osi_layer": "NETWORK",
    "reference": {},
    "severity": "MEDIUM",
  },
  {
    "attributes": {
      "hostname": null,
      "ip_address": "192.168.42.42",
      "payload": [
        "umac-64-etm@openssh.com",
        "hmac-sha1-etm@openssh.com",
        "umac-64@openssh.com",
        "hmac-sha1",
      ],
    },
    "category": "SSH Policy Violation",
    "description": "Deprecated / discouraged SSH MAC algorithms are used",
    "hint": "Remove these MAC algorithms: umac-64-etm@openssh.com, hmac-sha1-etm@openssh.com, umac-64@openssh.com, hmac-sha1",
    "location": "192.168.42.42",
    "name": "Insecure SSH MAC Algorithms",
    "osi_layer": "NETWORK",
    "reference": {},
    "severity": "MEDIUM",
  },
  {
    "attributes": {
      "hostname": null,
      "ip_address": "192.168.42.42",
      "payload": [
        "password",
      ],
    },
    "category": "SSH Policy Violation",
    "description": "Discouraged SSH authentication methods are used",
    "hint": "Remove these authentication methods: password",
    "location": "192.168.42.42",
    "name": "Discouraged SSH authentication methods",
    "osi_layer": "NETWORK",
    "reference": {},
    "severity": "MEDIUM",
  },
]
`);
});

test("ssh-scan parser parses a result of a network without ssh hosts correctly", async () => {
  const hosts = JSON.parse(
    await readFile(__dirname + "/__testFiles__/local-network.json", {
      encoding: "utf8",
    })
  );
  const findings = await parse(hosts);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
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
