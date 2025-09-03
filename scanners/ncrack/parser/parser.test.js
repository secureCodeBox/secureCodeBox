// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from "node:fs";
import { validateParser } from "@securecodebox/parser-sdk-nodejs/parser-utils";
import * as age from "age-encryption";

import { parse } from "./parser";

it("should return no findings when ncrack has not found credentials", async () => {
  const ncrackXML = readFileSync(
    __dirname + "/__testFiles__/ncrack_no_results.xml",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(ncrackXML);
  expect(validateParser(findings)).toBeUndefined();
  expect(findings.length).toBe(0);
});

it("should return findings when ncrack found credentials", async () => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const ncrackXML = readFileSync(
    __dirname + "/__testFiles__/ncrack_with_results.xml",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(ncrackXML);
  expect(validateParser(findings)).toBeUndefined();
  const [finding, ...otherFindings] = findings;
  expect(finding).toMatchInlineSnapshot(`
    {
      "attributes": {
        "ip_addresses": [
          "192.168.0.1",
        ],
        "password": "aaf076d4fe7cfb63fd1628df91",
        "port": "22",
        "protocol": "tcp",
        "service": "ssh",
        "username": "root",
      },
      "category": "Discovered Credentials",
      "description": "",
      "location": "ssh://192.168.0.1:22",
      "mitigation": "Use a more secure password or disable the service at ssh://192.168.0.1:22",
      "name": "Credentials for Service ssh://192.168.0.1:22 discovered via bruteforce.",
      "osi_layer": "APPLICATION",
      "severity": "HIGH",
    }
  `);
  expect(otherFindings.length).toBe(0);
});

it("should return no findings when ncrack has not found credentials scanning two services", async () => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const ncrackXML = readFileSync(
    __dirname + "/__testFiles__/ncrack_two_services_no_results.xml",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(ncrackXML);
  expect(validateParser(findings)).toBeUndefined();

  expect(findings.length).toBe(0);
});

it("should return findings when ncrack found two credentials scanning two services", async () => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const ncrackXML = readFileSync(
    __dirname + "/__testFiles__/ncrack_two_services_with_results.xml",
    {
      encoding: "utf8",
    },
  );
  const findings = await parse(ncrackXML);
  expect(validateParser(findings)).toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "ip_addresses": [
            "192.168.0.2",
          ],
          "password": "55994bcdabd8b0b69d4cb32919",
          "port": "22",
          "protocol": "tcp",
          "service": "ssh",
          "username": "root",
        },
        "category": "Discovered Credentials",
        "description": "",
        "location": "ssh://192.168.0.2:22",
        "mitigation": "Use a more secure password or disable the service at ssh://192.168.0.2:22",
        "name": "Credentials for Service ssh://192.168.0.2:22 discovered via bruteforce.",
        "osi_layer": "APPLICATION",
        "severity": "HIGH",
      },
      {
        "attributes": {
          "ip_addresses": [
            "192.168.0.1",
          ],
          "password": "2a4707625af87d8d4302ad226d",
          "port": "22",
          "protocol": "tcp",
          "service": "ssh",
          "username": "root",
        },
        "category": "Discovered Credentials",
        "description": "",
        "location": "ssh://192.168.0.1:22",
        "mitigation": "Use a more secure password or disable the service at ssh://192.168.0.1:22",
        "name": "Credentials for Service ssh://192.168.0.1:22 discovered via bruteforce.",
        "osi_layer": "APPLICATION",
        "severity": "HIGH",
      },
    ]
  `);
});

it("should encrypt findings when a public key is set", async () => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const ncrackXML = readFileSync(
    __dirname + "/__testFiles__/ncrack_with_results.xml",
    {
      encoding: "utf8",
    },
  );
  const [finding] = await parse(
    ncrackXML,
    null,
    __dirname + "/__testFiles__/public-key.txt",
  );

  let decryptedData = await decryptWithAGE(finding.attributes.password);

  expect(finding.attributes.password.length).toBe(377);
  expect(decryptedData).toBe("aaf076d4fe7cfb63fd1628df91");
});

async function decryptWithAGE(data) {
  const d = new age.Decrypter();
  d.addIdentity(ageSecretKey);
  const decoded = age.armor.decode(data);
  const out = await d.decrypt(decoded, "text");
  return out;
}

const ageSecretKey =
  "AGE-SECRET-KEY-1JRMTLELHHAUZ6U7SJ7HTZKUU0QX9A09PSXDVW9TVG704G9PVANXQS94G8T";
