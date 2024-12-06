// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const util = require("util");
const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

test("ssh-audit parser parses a result into proper findings for dummy-ssh", async () => {
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
            {
              "algorithm": "chacha20-poly1305@openssh.com",
              "notes": {
                "info": [
                  "default cipher since OpenSSH 6.9",
                  "available since OpenSSH 6.5, Dropbear SSH 2020.79",
                ],
                "warn": [
                  "vulnerable to the Terrapin attack (CVE-2023-48795), allowing message prefix truncation",
                ],
              },
            },
            {
              "algorithm": "aes128-ctr",
              "notes": {
                "info": [
                  "available since OpenSSH 3.7, Dropbear SSH 0.52",
                ],
              },
            },
            {
              "algorithm": "aes192-ctr",
              "notes": {
                "info": [
                  "available since OpenSSH 3.7",
                ],
              },
            },
            {
              "algorithm": "aes256-ctr",
              "notes": {
                "info": [
                  "available since OpenSSH 3.7, Dropbear SSH 0.52",
                ],
              },
            },
            {
              "algorithm": "aes128-gcm@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
              },
            },
            {
              "algorithm": "aes256-gcm@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
              },
            },
          ],
          "fingerprints": [
            {
              "hash": "pa+Jwax5syiezfL29o6j6uaWBoJeK/LZJ8OXUwPrE5A",
              "hash_alg": "SHA256",
              "hostkey": "ecdsa-sha2-nistp256",
            },
            {
              "hash": "f5:fb:82:83:cd:0e:1f:af:2a:45:17:0b:b7:3c:9f:ee",
              "hash_alg": "MD5",
              "hostkey": "ecdsa-sha2-nistp256",
            },
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
          "hostname": "dummy-ssh.demo-targets.svc",
          "ip_address": null,
          "key_algorithms": [
            {
              "algorithm": "ssh-rsa",
              "keysize": 2048,
              "notes": {
                "fail": [
                  "using broken SHA-1 hash algorithm",
                ],
                "info": [
                  "deprecated in OpenSSH 8.8: https://www.openssh.com/txt/release-8.8",
                  "available since OpenSSH 2.5.0, Dropbear SSH 0.28",
                ],
                "warn": [
                  "2048-bit modulus only provides 112-bits of symmetric strength",
                ],
              },
            },
            {
              "algorithm": "rsa-sha2-512",
              "keysize": 2048,
              "notes": {
                "info": [
                  "available since OpenSSH 7.2",
                ],
                "warn": [
                  "2048-bit modulus only provides 112-bits of symmetric strength",
                ],
              },
            },
            {
              "algorithm": "rsa-sha2-256",
              "keysize": 2048,
              "notes": {
                "info": [
                  "available since OpenSSH 7.2, Dropbear SSH 2020.79",
                ],
                "warn": [
                  "2048-bit modulus only provides 112-bits of symmetric strength",
                ],
              },
            },
            {
              "algorithm": "ecdsa-sha2-nistp256",
              "notes": {
                "fail": [
                  "using elliptic curves that are suspected as being backdoored by the U.S. National Security Agency",
                ],
                "info": [
                  "available since OpenSSH 5.7, Dropbear SSH 2013.62",
                ],
                "warn": [
                  "using weak random number generator could reveal the key",
                ],
              },
            },
            {
              "algorithm": "ssh-ed25519",
              "notes": {
                "info": [
                  "available since OpenSSH 6.5, Dropbear SSH 2020.79",
                ],
              },
            },
          ],
          "key_exchange_algorithms": [
            {
              "algorithm": "curve25519-sha256@libssh.org",
              "notes": {
                "info": [
                  "default key exchange from OpenSSH 6.5 to 7.3",
                  "available since OpenSSH 6.4, Dropbear SSH 2013.62",
                ],
              },
            },
            {
              "algorithm": "ecdh-sha2-nistp256",
              "notes": {
                "fail": [
                  "using elliptic curves that are suspected as being backdoored by the U.S. National Security Agency",
                ],
                "info": [
                  "available since OpenSSH 5.7, Dropbear SSH 2013.62",
                ],
              },
            },
            {
              "algorithm": "ecdh-sha2-nistp384",
              "notes": {
                "fail": [
                  "using elliptic curves that are suspected as being backdoored by the U.S. National Security Agency",
                ],
                "info": [
                  "available since OpenSSH 5.7, Dropbear SSH 2013.62",
                ],
              },
            },
            {
              "algorithm": "ecdh-sha2-nistp521",
              "notes": {
                "fail": [
                  "using elliptic curves that are suspected as being backdoored by the U.S. National Security Agency",
                ],
                "info": [
                  "available since OpenSSH 5.7, Dropbear SSH 2013.62",
                ],
              },
            },
            {
              "algorithm": "diffie-hellman-group-exchange-sha256",
              "keysize": 3072,
              "notes": {
                "info": [
                  "OpenSSH's GEX fallback mechanism was triggered during testing. Very old SSH clients will still be able to create connections using a 2048-bit modulus, though modern clients will use 3072. This can only be disabled by recompiling the code (see https://github.com/openssh/openssh-portable/blob/V_9_4/dh.c#L477).",
                  "available since OpenSSH 4.4",
                ],
              },
            },
            {
              "algorithm": "diffie-hellman-group14-sha1",
              "notes": {
                "fail": [
                  "using broken SHA-1 hash algorithm",
                ],
                "info": [
                  "available since OpenSSH 3.9, Dropbear SSH 0.53",
                ],
                "warn": [
                  "2048-bit modulus only provides 112-bits of symmetric strength",
                ],
              },
            },
          ],
          "mac_algorithms": [
            {
              "algorithm": "umac-64-etm@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
                "warn": [
                  "using small 64-bit tag size",
                ],
              },
            },
            {
              "algorithm": "umac-128-etm@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
              },
            },
            {
              "algorithm": "hmac-sha2-256-etm@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
              },
            },
            {
              "algorithm": "hmac-sha2-512-etm@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
              },
            },
            {
              "algorithm": "hmac-sha1-etm@openssh.com",
              "notes": {
                "fail": [
                  "using broken SHA-1 hash algorithm",
                ],
                "info": [
                  "available since OpenSSH 6.2",
                ],
              },
            },
            {
              "algorithm": "umac-64@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 4.7",
                ],
                "warn": [
                  "using encrypt-and-MAC mode",
                  "using small 64-bit tag size",
                ],
              },
            },
            {
              "algorithm": "umac-128@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
                "warn": [
                  "using encrypt-and-MAC mode",
                ],
              },
            },
            {
              "algorithm": "hmac-sha2-256",
              "notes": {
                "info": [
                  "available since OpenSSH 5.9, Dropbear SSH 2013.56",
                ],
                "warn": [
                  "using encrypt-and-MAC mode",
                ],
              },
            },
            {
              "algorithm": "hmac-sha2-512",
              "notes": {
                "info": [
                  "available since OpenSSH 5.9, Dropbear SSH 2013.56",
                ],
                "warn": [
                  "using encrypt-and-MAC mode",
                ],
              },
            },
            {
              "algorithm": "hmac-sha1",
              "notes": {
                "fail": [
                  "using broken SHA-1 hash algorithm",
                ],
                "info": [
                  "available since OpenSSH 2.1.0, Dropbear SSH 0.28",
                ],
                "warn": [
                  "using encrypt-and-MAC mode",
                ],
              },
            },
          ],
          "server_banner": "SSH-2.0-OpenSSH_7.2p2 Ubuntu-4ubuntu2.8",
          "ssh_lib_cpe": "OpenSSH_7.2p2",
          "ssh_version": "2.0",
        },
        "category": "SSH Service",
        "description": "Information about Used SSH Algorithms",
        "location": "ssh://dummy-ssh.demo-targets.svc",
        "name": "SSH Service",
        "osi_layer": "APPLICATION",
        "port": "22",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "algorithms": [
            "diffie-hellman-group14-sha1",
            "ecdh-sha2-nistp256",
            "ecdh-sha2-nistp384",
            "ecdh-sha2-nistp521",
          ],
        },
        "category": "SSH Policy Violation",
        "description": "Discouraged SSH key exchange algorithms in use",
        "location": "ssh://dummy-ssh.demo-targets.svc",
        "mitigation": "Remove these KEX algorithms",
        "name": "Insecure SSH KEX Algorithms",
        "severity": "HIGH",
      },
      {
        "attributes": {
          "algorithms": [
            "ecdsa-sha2-nistp256",
            "ssh-rsa",
          ],
        },
        "category": "SSH Policy Violation",
        "description": "Discouraged SSH key algorithms in use",
        "location": "ssh://dummy-ssh.demo-targets.svc",
        "mitigation": "Remove these key algorithms",
        "name": "Insecure SSH Key Algorithms",
        "severity": "HIGH",
      },
      {
        "attributes": {
          "algorithms": [
            "hmac-sha1",
            "hmac-sha1-etm@openssh.com",
          ],
        },
        "category": "SSH Policy Violation",
        "description": "Discouraged SSH message authentication code algorithms in use",
        "location": "ssh://dummy-ssh.demo-targets.svc",
        "mitigation": "Remove these MAC algorithms",
        "name": "Insecure SSH MAC Algorithms",
        "severity": "HIGH",
      },
      {
        "attributes": {
          "algorithms": [
            "rsa-sha2-256 (Note: increase modulus size to 3072 bits or larger)",
            "rsa-sha2-512 (Note: increase modulus size to 3072 bits or larger)",
          ],
        },
        "category": "SSH Policy Violation",
        "description": "Weak SSH key algorithms in use",
        "location": "ssh://dummy-ssh.demo-targets.svc",
        "mitigation": "Change these key algorithms",
        "name": "SSH Key Algorithms must be changed",
        "severity": "MEDIUM",
      },
      {
        "attributes": {
          "algorithms": [
            "chacha20-poly1305@openssh.com",
          ],
        },
        "category": "SSH Policy Violation",
        "description": "Discouraged SSH Encryption algorithms are in use",
        "location": "ssh://dummy-ssh.demo-targets.svc",
        "mitigation": "Remove these encryption algorithms",
        "name": "Insecure SSH Encryption Algorithms",
        "severity": "MEDIUM",
      },
      {
        "attributes": {
          "algorithms": [
            "hmac-sha2-256",
            "hmac-sha2-512",
            "umac-128@openssh.com",
            "umac-64-etm@openssh.com",
            "umac-64@openssh.com",
          ],
        },
        "category": "SSH Policy Violation",
        "description": "Discouraged SSH message authentication code algorithms in use",
        "location": "ssh://dummy-ssh.demo-targets.svc",
        "mitigation": "Remove these MAC algorithms",
        "name": "Insecure SSH MAC Algorithms",
        "severity": "MEDIUM",
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

test("ssh-audit parser parses a result into proper findings for an example with given port", async () => {
  const hosts = JSON.parse(
    await readFile(__dirname + "/__testFiles__/portExample.json", {
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
          ],
          "encryption_algorithms": [
            {
              "algorithm": "chacha20-poly1305@openssh.com",
              "notes": {
                "info": [
                  "default cipher since OpenSSH 6.9",
                  "available since OpenSSH 6.5, Dropbear SSH 2020.79",
                ],
              },
            },
            {
              "algorithm": "aes256-gcm@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
              },
            },
            {
              "algorithm": "aes128-gcm@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
              },
            },
            {
              "algorithm": "aes256-ctr",
              "notes": {
                "info": [
                  "available since OpenSSH 3.7, Dropbear SSH 0.52",
                ],
              },
            },
            {
              "algorithm": "aes192-ctr",
              "notes": {
                "info": [
                  "available since OpenSSH 3.7",
                ],
              },
            },
            {
              "algorithm": "aes128-ctr",
              "notes": {
                "info": [
                  "available since OpenSSH 3.7, Dropbear SSH 0.52",
                ],
              },
            },
          ],
          "fingerprints": [
            {
              "hash": "WrPtjtUCUKDiCnCXydph/tHIISUeJiLMLwdBLpfI2KU",
              "hash_alg": "SHA256",
              "hostkey": "ecdsa-sha2-nistp256",
            },
            {
              "hash": "ed:ea:4c:10:1a:37:41:5f:dd:84:29:4b:ba:ab:8a:27",
              "hash_alg": "MD5",
              "hostkey": "ecdsa-sha2-nistp256",
            },
            {
              "hash": "zDyiQDFSdBbKGL0vFgMWa0cdEI1R4QGtkEMHY/BlqT0",
              "hash_alg": "SHA256",
              "hostkey": "ssh-ed25519",
            },
            {
              "hash": "c8:2c:ee:3b:bc:ae:0e:8b:0d:6f:f2:b6:77:25:69:aa",
              "hash_alg": "MD5",
              "hostkey": "ssh-ed25519",
            },
            {
              "hash": "khLYpAPy+wFXAh+p6PBgNrmO4Qjs0KIDBuyb83m/1j4",
              "hash_alg": "SHA256",
              "hostkey": "ssh-rsa",
            },
            {
              "hash": "62:b4:fe:be:11:54:61:6b:c3:b8:e4:98:f3:41:84:73",
              "hash_alg": "MD5",
              "hostkey": "ssh-rsa",
            },
          ],
          "hostname": null,
          "ip_address": "127.0.0.1",
          "key_algorithms": [
            {
              "algorithm": "rsa-sha2-512",
              "keysize": 3072,
              "notes": {
                "info": [
                  "available since OpenSSH 7.2",
                ],
              },
            },
            {
              "algorithm": "rsa-sha2-256",
              "keysize": 3072,
              "notes": {
                "info": [
                  "available since OpenSSH 7.2, Dropbear SSH 2020.79",
                ],
              },
            },
            {
              "algorithm": "ecdsa-sha2-nistp256",
              "notes": {
                "fail": [
                  "using elliptic curves that are suspected as being backdoored by the U.S. National Security Agency",
                ],
                "info": [
                  "available since OpenSSH 5.7, Dropbear SSH 2013.62",
                ],
                "warn": [
                  "using weak random number generator could reveal the key",
                ],
              },
            },
            {
              "algorithm": "ssh-ed25519",
              "notes": {
                "info": [
                  "available since OpenSSH 6.5, Dropbear SSH 2020.79",
                ],
              },
            },
          ],
          "key_exchange_algorithms": [
            {
              "algorithm": "curve25519-sha256@libssh.org",
              "notes": {
                "info": [
                  "default key exchange from OpenSSH 6.5 to 7.3",
                  "available since OpenSSH 6.4, Dropbear SSH 2013.62",
                ],
              },
            },
            {
              "algorithm": "diffie-hellman-group-exchange-sha256",
              "keysize": 3072,
              "notes": {
                "info": [
                  "OpenSSH's GEX fallback mechanism was triggered during testing. Very old SSH clients will still be able to create connections using a 2048-bit modulus, though modern clients will use 3072. This can only be disabled by recompiling the code (see https://github.com/openssh/openssh-portable/blob/V_9_4/dh.c#L477).",
                  "available since OpenSSH 4.4",
                ],
              },
            },
            {
              "algorithm": "ecdh-sha2-nistp521",
              "notes": {
                "fail": [
                  "using elliptic curves that are suspected as being backdoored by the U.S. National Security Agency",
                ],
                "info": [
                  "available since OpenSSH 5.7, Dropbear SSH 2013.62",
                ],
              },
            },
            {
              "algorithm": "ecdh-sha2-nistp384",
              "notes": {
                "fail": [
                  "using elliptic curves that are suspected as being backdoored by the U.S. National Security Agency",
                ],
                "info": [
                  "available since OpenSSH 5.7, Dropbear SSH 2013.62",
                ],
              },
            },
            {
              "algorithm": "ecdh-sha2-nistp256",
              "notes": {
                "fail": [
                  "using elliptic curves that are suspected as being backdoored by the U.S. National Security Agency",
                ],
                "info": [
                  "available since OpenSSH 5.7, Dropbear SSH 2013.62",
                ],
              },
            },
            {
              "algorithm": "kex-strict-s-v00@openssh.com",
              "notes": {
                "info": [
                  "pseudo-algorithm that denotes the peer supports a stricter key exchange method as a counter-measure to the Terrapin attack (CVE-2023-48795)",
                ],
              },
            },
          ],
          "mac_algorithms": [
            {
              "algorithm": "hmac-sha2-512-etm@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
              },
            },
            {
              "algorithm": "hmac-sha2-256-etm@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
              },
            },
            {
              "algorithm": "umac-128-etm@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
              },
            },
            {
              "algorithm": "umac-128@openssh.com",
              "notes": {
                "info": [
                  "available since OpenSSH 6.2",
                ],
                "warn": [
                  "using encrypt-and-MAC mode",
                ],
              },
            },
            {
              "algorithm": "hmac-sha2-512",
              "notes": {
                "info": [
                  "available since OpenSSH 5.9, Dropbear SSH 2013.56",
                ],
                "warn": [
                  "using encrypt-and-MAC mode",
                ],
              },
            },
            {
              "algorithm": "hmac-sha2-256",
              "notes": {
                "info": [
                  "available since OpenSSH 5.9, Dropbear SSH 2013.56",
                ],
                "warn": [
                  "using encrypt-and-MAC mode",
                ],
              },
            },
          ],
          "server_banner": "SSH-2.0-OpenSSH_8.9p1",
          "ssh_lib_cpe": "OpenSSH_8.9p1",
          "ssh_version": "2.0",
        },
        "category": "SSH Service",
        "description": "Information about Used SSH Algorithms",
        "location": "ssh://127.0.0.1",
        "name": "SSH Service",
        "osi_layer": "APPLICATION",
        "port": "29683",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "algorithms": [
            "ecdh-sha2-nistp256",
            "ecdh-sha2-nistp384",
            "ecdh-sha2-nistp521",
          ],
        },
        "category": "SSH Policy Violation",
        "description": "Discouraged SSH key exchange algorithms in use",
        "location": "ssh://127.0.0.1",
        "mitigation": "Remove these KEX algorithms",
        "name": "Insecure SSH KEX Algorithms",
        "severity": "HIGH",
      },
      {
        "attributes": {
          "algorithms": [
            "ecdsa-sha2-nistp256",
          ],
        },
        "category": "SSH Policy Violation",
        "description": "Discouraged SSH key algorithms in use",
        "location": "ssh://127.0.0.1",
        "mitigation": "Remove these key algorithms",
        "name": "Insecure SSH Key Algorithms",
        "severity": "HIGH",
      },
      {
        "attributes": {
          "algorithms": [
            "curve25519-sha256",
            "diffie-hellman-group16-sha512",
            "diffie-hellman-group18-sha512",
            "sntrup761x25519-sha512@openssh.com",
          ],
        },
        "category": "SSH Policy Violation",
        "description": "SSH key exchange algorithms missing",
        "location": "ssh://127.0.0.1",
        "mitigation": "Add these KEX algorithms",
        "name": "SSH KEX Algorithms must be added",
        "severity": "LOW",
      },
      {
        "attributes": {
          "algorithms": [
            "hmac-sha2-256",
            "hmac-sha2-512",
            "umac-128@openssh.com",
          ],
        },
        "category": "SSH Policy Violation",
        "description": "Discouraged SSH message authentication code algorithms in use",
        "location": "ssh://127.0.0.1",
        "mitigation": "Remove these MAC algorithms",
        "name": "Insecure SSH MAC Algorithms",
        "severity": "MEDIUM",
      },
    ]
  `);
});
