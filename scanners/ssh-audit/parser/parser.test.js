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

test("ssh-audit parser parses a result into proper findings", async () => {
    const hosts = JSON.parse(
        await readFile(__dirname + "/__testFiles__/dummy-ssh.json", {
          encoding: "utf8",
        })
      );
    const findings = await parse(hosts);
    await expect(validateParser(findings)).resolves.toBeUndefined();
    expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
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
          "fingerprints": [
            {
              "hash": "eLwgzyjvrpwDbDr+pDbIfUhlNANB4DPH9/0w1vGa87E",
              "hash_alg": "SHA256",
              "hostkey": "ssh-ed25519",
            },
            {
              "hash": "c8:65:6b:d1:59:03:56:21:d9:0f:84:83:ce:ac:40:86",
              "hash_alg": "MD5",
              "hostkey": "ssh-ed25519",
            },
            {
              "hash": "MbRX/CgQyN6/p8/ZjORurfaJqDhu4VEIWfXo0BnxaCE",
              "hash_alg": "SHA256",
              "hostkey": "ssh-rsa",
            },
            {
              "hash": "a5:6f:62:26:81:03:b7:5e:06:48:10:04:79:4b:ac:32",
              "hash_alg": "MD5",
              "hostkey": "ssh-rsa",
            },
          ],
          "host": "dummy-ssh.demo-targets.svc",
          "key_algorithms": [
            {
              "algorithm": "ssh-rsa",
              "keysize": 2048,
            },
            {
              "algorithm": "rsa-sha2-512",
              "keysize": 2048,
            },
            {
              "algorithm": "rsa-sha2-256",
              "keysize": 2048,
            },
            {
              "algorithm": "ecdsa-sha2-nistp256",
            },
            {
              "algorithm": "ssh-ed25519",
            },
          ],
          "key_exchange_algorithms": [
            {
              "algorithm": "curve25519-sha256@libssh.org",
            },
            {
              "algorithm": "ecdh-sha2-nistp256",
            },
            {
              "algorithm": "ecdh-sha2-nistp384",
            },
            {
              "algorithm": "ecdh-sha2-nistp521",
            },
            {
              "algorithm": "diffie-hellman-group-exchange-sha256",
              "keysize": 2048,
            },
            {
              "algorithm": "diffie-hellman-group14-sha1",
            },
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
          "server_banner": "SSH-2.0-OpenSSH_7.2p2 Ubuntu-4ubuntu2.8",
          "ssh_lib_cpe": "OpenSSH_7.2p2",
          "ssh_version": 2,
        },
        "category": "SSH Service",
        "description": "Information about Used SSH Algorithms",
        "location": "dummy-ssh.demo-targets.svc",
        "name": "SSH Service",
        "osi_layer": "APPLICATION",
        "severity": "INFORMATIONAL",
      },
      {
        "algorithms": [
          "diffie-hellman-group14-sha1",
          "ecdh-sha2-nistp256",
          "ecdh-sha2-nistp384",
          "ecdh-sha2-nistp521",
        ],
        "category": "SSH Policy Violation",
        "description": "Discouraged SSH key exchange algorithms in use",
        "hint": "Remove these KEX algorithms",
        "name": "Insecure SSH KEX Algorithms",
        "severity": "HIGH",
      },
      {
        "algorithms": [
          "ecdsa-sha2-nistp256",
          "ssh-rsa",
        ],
        "category": "SSH Policy Violation",
        "description": "Discouraged SSH key algorithms in use",
        "hint": "Remove these key algorithms",
        "name": "Insecure SSH Key Algorithms",
        "severity": "HIGH",
      },
      {
        "algorithms": [
          "hmac-sha1",
          "hmac-sha1-etm@openssh.com",
        ],
        "category": "SSH Policy Violation",
        "description": "Discouraged SSH message authentication code algorithms in use",
        "hint": "Remove these MAC algorithms",
        "name": "Insecure SSH MAC Algorithms",
        "severity": "HIGH",
      },
      {
        "algorithms": [
          "rsa-sha2-256 (Note: increase modulus size to 3072 bits or larger)",
          "rsa-sha2-512 (Note: increase modulus size to 3072 bits or larger)",
        ],
        "category": "SSH Policy Violation",
        "description": "Weak SSH key algorithms in use",
        "hint": "Change these key algorithms",
        "name": "SSH Key Algorithms must be changed",
        "severity": "MEDIUM",
      },
      {
        "algorithms": [
          "hmac-sha2-256",
          "hmac-sha2-512",
          "umac-128@openssh.com",
          "umac-64-etm@openssh.com",
          "umac-64@openssh.com",
        ],
        "category": "SSH Policy Violation",
        "description": "Discouraged SSH message authentication code algorithms in use",
        "hint": "Remove these MAC algorithms",
        "name": "Insecure SSH MAC Algorithms",
        "severity": "MEDIUM",
      },
      {
        "category": "SSH Violation",
        "cvssv2": 7,
        "description": "privilege escalation via supplemental groups",
        "name": "CVE-2021-41617",
        "references": [
          {
            "type": "CVE",
            "value": "CVE-2021-41617",
          },
          {
            "type": "URL",
            "value": "https://nvd.nist.gov/vuln/detail/CVE-2021-41617",
          },
        ],
        "severity": "HIGH",
      },
      {
        "category": "SSH Violation",
        "cvssv2": 7.8,
        "description": "command injection via anomalous argument transfers",
        "name": "CVE-2020-15778",
        "references": [
          {
            "type": "CVE",
            "value": "CVE-2020-15778",
          },
          {
            "type": "URL",
            "value": "https://nvd.nist.gov/vuln/detail/CVE-2020-15778",
          },
        ],
        "severity": "HIGH",
      },
      {
        "category": "SSH Violation",
        "cvssv2": 5.3,
        "description": "username enumeration via GS2",
        "name": "CVE-2018-15919",
        "references": [
          {
            "type": "CVE",
            "value": "CVE-2018-15919",
          },
          {
            "type": "URL",
            "value": "https://nvd.nist.gov/vuln/detail/CVE-2018-15919",
          },
        ],
        "severity": "MEDIUM",
      },
      {
        "category": "SSH Violation",
        "cvssv2": 5.3,
        "description": "enumerate usernames due to timing discrepancies",
        "name": "CVE-2018-15473",
        "references": [
          {
            "type": "CVE",
            "value": "CVE-2018-15473",
          },
          {
            "type": "URL",
            "value": "https://nvd.nist.gov/vuln/detail/CVE-2018-15473",
          },
        ],
        "severity": "MEDIUM",
      },
      {
        "category": "SSH Violation",
        "cvssv2": 5.3,
        "description": "enumerate usernames via challenge response",
        "name": "CVE-2016-20012",
        "references": [
          {
            "type": "CVE",
            "value": "CVE-2016-20012",
          },
          {
            "type": "URL",
            "value": "https://nvd.nist.gov/vuln/detail/CVE-2016-20012",
          },
        ],
        "severity": "MEDIUM",
      },
      {
        "category": "SSH Violation",
        "cvssv2": 7.8,
        "description": "cause DoS via long password string (crypt CPU consumption)",
        "name": "CVE-2016-6515",
        "references": [
          {
            "type": "CVE",
            "value": "CVE-2016-6515",
          },
          {
            "type": "URL",
            "value": "https://nvd.nist.gov/vuln/detail/CVE-2016-6515",
          },
        ],
        "severity": "HIGH",
      },
      {
        "category": "SSH Violation",
        "cvssv2": 7.2,
        "description": "privilege escalation via triggering crafted environment",
        "name": "CVE-2015-8325",
        "references": [
          {
            "type": "CVE",
            "value": "CVE-2015-8325",
          },
          {
            "type": "URL",
            "value": "https://nvd.nist.gov/vuln/detail/CVE-2015-8325",
          },
        ],
        "severity": "HIGH",
      },
    ]
    `);
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



test("ssh-audit parser parses a result into proper findings dfdg", async () => {
  const hosts = JSON.parse(
      await readFile(__dirname + "/__testFiles__/example.json", {
        encoding: "utf8",
      })
    );
  const findings = await parse(hosts);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
  [
    {
      "attributes": {
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
        "fingerprints": [
          {
            "hash": "Qljt15P0hpcQdSrAZVME1Vj5fsX/LgKBDtfT7k6T66Q",
            "hash_alg": "SHA256",
            "hostkey": "ssh-ed25519",
          },
          {
            "hash": "d7:0b:7f:bb:5c:2b:1d:44:1d:63:5a:1d:3c:18:a2:e6",
            "hash_alg": "MD5",
            "hostkey": "ssh-ed25519",
          },
          {
            "hash": "rn+kjXUflGJzrCx7tIGGiJWMFS8gjwy5vFJzxXqK6Nk",
            "hash_alg": "SHA256",
            "hostkey": "ssh-rsa",
          },
          {
            "hash": "49:bd:b5:a9:3b:6e:cc:4a:59:69:e6:06:e9:d7:13:4a",
            "hash_alg": "MD5",
            "hostkey": "ssh-rsa",
          },
        ],
        "host": "example.com",
        "key_algorithms": [
          {
            "algorithm": "rsa-sha2-512",
            "keysize": 2048,
          },
          {
            "algorithm": "rsa-sha2-256",
            "keysize": 2048,
          },
          {
            "algorithm": "ssh-rsa",
            "keysize": 2048,
          },
          {
            "algorithm": "ecdsa-sha2-nistp256",
          },
          {
            "algorithm": "ssh-ed25519",
          },
        ],
        "key_exchange_algorithms": [
          {
            "algorithm": "curve25519-sha256",
          },
          {
            "algorithm": "curve25519-sha256@libssh.org",
          },
          {
            "algorithm": "ecdh-sha2-nistp256",
          },
          {
            "algorithm": "ecdh-sha2-nistp384",
          },
          {
            "algorithm": "ecdh-sha2-nistp521",
          },
          {
            "algorithm": "diffie-hellman-group-exchange-sha256",
            "keysize": 2048,
          },
          {
            "algorithm": "diffie-hellman-group16-sha512",
          },
          {
            "algorithm": "diffie-hellman-group18-sha512",
          },
          {
            "algorithm": "diffie-hellman-group14-sha256",
          },
          {
            "algorithm": "diffie-hellman-group14-sha1",
          },
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
        "server_banner": "SSH-2.0-OpenSSH_7.9p1 Raspbian-10+deb10u2+rpt1",
        "ssh_lib_cpe": "OpenSSH_7.9p1",
        "ssh_version": 2,
      },
      "category": "SSH Service",
      "description": "Information about Used SSH Algorithms",
      "location": "example.com",
      "name": "SSH Service",
      "osi_layer": "APPLICATION",
      "severity": "INFORMATIONAL",
    },
    {
      "algorithms": [
        "diffie-hellman-group14-sha1",
        "ecdh-sha2-nistp256",
        "ecdh-sha2-nistp384",
        "ecdh-sha2-nistp521",
      ],
      "category": "SSH Policy Violation",
      "description": "Discouraged SSH key exchange algorithms in use",
      "hint": "Remove these KEX algorithms",
      "name": "Insecure SSH KEX Algorithms",
      "severity": "HIGH",
    },
    {
      "algorithms": [
        "ecdsa-sha2-nistp256",
        "ssh-rsa",
      ],
      "category": "SSH Policy Violation",
      "description": "Discouraged SSH key algorithms in use",
      "hint": "Remove these key algorithms",
      "name": "Insecure SSH Key Algorithms",
      "severity": "HIGH",
    },
    {
      "algorithms": [
        "hmac-sha1",
        "hmac-sha1-etm@openssh.com",
      ],
      "category": "SSH Policy Violation",
      "description": "Discouraged SSH message authentication code algorithms in use",
      "hint": "Remove these MAC algorithms",
      "name": "Insecure SSH MAC Algorithms",
      "severity": "HIGH",
    },
    {
      "algorithms": [
        "rsa-sha2-256 (Note: increase modulus size to 3072 bits or larger)",
        "rsa-sha2-512 (Note: increase modulus size to 3072 bits or larger)",
      ],
      "category": "SSH Policy Violation",
      "description": "Weak SSH key algorithms in use",
      "hint": "Change these key algorithms",
      "name": "SSH Key Algorithms must be changed",
      "severity": "MEDIUM",
    },
    {
      "algorithms": [
        "diffie-hellman-group14-sha256",
      ],
      "category": "SSH Policy Violation",
      "description": "Discouraged SSH key exchange algorithms in use",
      "hint": "Remove these KEX algorithms",
      "name": "Insecure SSH KEX Algorithms",
      "severity": "MEDIUM",
    },
    {
      "algorithms": [
        "hmac-sha2-256",
        "hmac-sha2-512",
        "umac-128@openssh.com",
        "umac-64-etm@openssh.com",
        "umac-64@openssh.com",
      ],
      "category": "SSH Policy Violation",
      "description": "Discouraged SSH message authentication code algorithms in use",
      "hint": "Remove these MAC algorithms",
      "name": "Insecure SSH MAC Algorithms",
      "severity": "MEDIUM",
    },
    {
      "category": "SSH Violation",
      "cvssv2": 7,
      "description": "privilege escalation via supplemental groups",
      "name": "CVE-2021-41617",
      "references": [
        {
          "type": "CVE",
          "value": "CVE-2021-41617",
        },
        {
          "type": "URL",
          "value": "https://nvd.nist.gov/vuln/detail/CVE-2021-41617",
        },
      ],
      "severity": "HIGH",
    },
    {
      "category": "SSH Violation",
      "cvssv2": 7.8,
      "description": "command injection via anomalous argument transfers",
      "name": "CVE-2020-15778",
      "references": [
        {
          "type": "CVE",
          "value": "CVE-2020-15778",
        },
        {
          "type": "URL",
          "value": "https://nvd.nist.gov/vuln/detail/CVE-2020-15778",
        },
      ],
      "severity": "HIGH",
    },
    {
      "category": "SSH Violation",
      "cvssv2": 7.8,
      "description": "memory corruption and local code execution via pre-authentication integer overflow",
      "name": "CVE-2019-16905",
      "references": [
        {
          "type": "CVE",
          "value": "CVE-2019-16905",
        },
        {
          "type": "URL",
          "value": "https://nvd.nist.gov/vuln/detail/CVE-2019-16905",
        },
      ],
      "severity": "HIGH",
    },
    {
      "category": "SSH Violation",
      "cvssv2": 5.3,
      "description": "enumerate usernames via challenge response",
      "name": "CVE-2016-20012",
      "references": [
        {
          "type": "CVE",
          "value": "CVE-2016-20012",
        },
        {
          "type": "URL",
          "value": "https://nvd.nist.gov/vuln/detail/CVE-2016-20012",
        },
      ],
      "severity": "MEDIUM",
    },
  ]
  `);
});