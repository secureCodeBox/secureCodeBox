// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {parse} = require("./parser");
const fs = require("fs");
const crypto = require("crypto");
const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

it("should return no findings when ncrack has not found credentials", async () => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const ncrackXML = fs.readFileSync(
    __dirname + "/__testFiles__/ncrack_no_results.xml",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(ncrackXML);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings.length).toBe(0);
});

it("should return findings when ncrack found credentials", async () => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const ncrackXML = fs.readFileSync(
    __dirname + "/__testFiles__/ncrack_with_results.xml",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(ncrackXML);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  const [finding, ...otherFindings] = findings;
  expect(finding).toMatchInlineSnapshot(`
    {
      "attributes": {
        "ip_address": "192.168.0.1",
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
  const ncrackXML = fs.readFileSync(
    __dirname + "/__testFiles__/ncrack_two_services_no_results.xml",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(ncrackXML);
  await expect(validateParser(findings)).resolves.toBeUndefined();

  expect(findings.length).toBe(0);
});

it("should return findings when ncrack found two credentials scanning two services", async () => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const ncrackXML = fs.readFileSync(
    __dirname + "/__testFiles__/ncrack_two_services_with_results.xml",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(ncrackXML);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "ip_address": "192.168.0.2",
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
          "ip_address": "192.168.0.1",
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
  const ncrackXML = fs.readFileSync(
    __dirname + "/__testFiles__/ncrack_with_results.xml",
    {
      encoding: "utf8",
    }
  );
  const [finding] = await parse(
    ncrackXML,
    null,
    __dirname + "/__testFiles__/public_key.pem"
  );

  let decryptedData = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(finding.attributes.password, "base64")
  );

  expect(finding.attributes.password.length).toBe(172);
  expect(decryptedData.toString()).toBe("aaf076d4fe7cfb63fd1628df91");
});

const privateKey =
  "-----BEGIN RSA PRIVATE KEY-----\n" +
  "MIICXQIBAAKBgQDftYgZ2MhLWumXTylT/nEhZ3Ulrk8xuf8EFA3ffMRgyW3n9mEp\n" +
  "VFHVXZCaEYz55/pZqnsffUosPnHtKDV4uGPVqPJkMi5WUj6oUE9O/BXArK8pJfnc\n" +
  "OKYqCQN45hKc/Plt7uvTCTS/oFKoowv1MyzLzbrLAI4I7JPgFA1nOp8UDQIDAQAB\n" +
  "AoGAV5tepkiX/7KlocS1eZg+M4exf8UobF/bd3xnBmt0+DZJ3TpGSIol1fnjRAK1\n" +
  "g7SN/QlfWDCXmIYH1YkWj6UeKvWim86OV+61QX4imLAOsi7fSA8fcNRxYVX73hhk\n" +
  "kxt10a4l+CPAb4cyJa4Ud3UHhLtRlanJtQyAXZtQ38fRSiECQQDxIhBjkU4Sf96t\n" +
  "wpEWr/RnOA2aHOUWH8GCB4DAcw5wrISDcvRsgKggjec2VAJPovqSri1lQS4hV28M\n" +
  "4iTcj+ylAkEA7YB0rAebUzbFXzMrxUPxBbjze+idw1COqCXkX+N9RYVY23D8mUlR\n" +
  "8cMru4Rauu6DluSWZCgR14+Hi0TNrUHlSQJBAJBoJgh67JaHnYPSEbHUjjmCiCLT\n" +
  "Sx6Exg5pD+IxBWTU7EcMgPS51/YnBWCzzu6CXC2bwfPxpP6yrf65L/om90ECQQDe\n" +
  "HGYAhFSkq/JFp+tlXrbHbUJ4PQFdqbbgVh+P9YYwQBbrkm0JReKWwLnjclIPxAPY\n" +
  "WAq1vCuDdr2CZ2QahifRAkBd9mv+G4WO0hOsTBypeoEnL6VECzSauDwfIP/kSdBz\n" +
  "bmkZ6DCScZa8gz1J5ZamBnP4N2dtQn/zDtNUkS+qK+s2\n" +
  "-----END RSA PRIVATE KEY-----";
