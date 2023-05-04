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

test("ssh-scan parser parses a result into proper findings", async () => {
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
            "hostname": "dummy-ssh.default.svc",
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
          "identified_at": "2023-05-04T13:36:05.692Z",
          "location": "dummy-ssh.default.svc",
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
          "hint": "Remove these Kex Algorithms",
          "name": "Insecure SSH Kex Algorithms",
          "severity": "HIGH",
        },
        {
          "algorithms": [
            "ecdsa-sha2-nistp256",
            "ssh-rsa",
          ],
          "category": "SSH Policy Violation",
          "description": "Discouraged SSH Key Algorithms in use",
          "hint": "Remove these Key Algorithms",
          "name": "Insecure SSH Key Algorithms",
          "severity": "HIGH",
        },
        {
          "algorithms": [
            "hmac-sha1",
            "hmac-sha1-etm@openssh.com",
          ],
          "category": "SSH Policy Violation",
          "description": "Discouraged SSH MAC algorithms in use",
          "hint": "Remove these MAC Algorithms",
          "name": "Insecure SSH MAC Algorithms",
          "severity": "HIGH",
        },
        {
          "algorithms": [
            "rsa-sha2-256 (Note: increase modulus size to 3072 bits or larger)",
            "rsa-sha2-512 (Note: increase modulus size to 3072 bits or larger)",
          ],
          "category": "SSH Policy Violation",
          "description": "Weak Key Algorithms in use",
          "hint": "Change these Algorithms",
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
          "description": "Discouraged SSH MAC algorithms in use",
          "hint": "Remove these MAC Algorithms",
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
              "type": "URL",
              "value": "https://nvd.nist.gov/vuln/detail/CVE-2015-8325",
            },
          ],
          "severity": "HIGH",
        },
      ]
    `);
    console.log(findings);
});