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

test("should properly parse empty gitleaks json file", async () => {
  const jsonContent = await readFile(
    __dirname + "/__testFiles__/test-empty-report.json",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(JSON.parse(jsonContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchObject([]);
});

test("should properly parse gitleaks json file with null result", async () => {
  const jsonContent = await readFile(
    __dirname + "/__testFiles__/test-null-report.json",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(JSON.parse(jsonContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchObject([]);
});

test("should properly parse gitleaks json file", async () => {
  const jsonContent = await readFile(
    __dirname + "/__testFiles__/test-report.json",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(JSON.parse(jsonContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    Array [
      Object {
        "attributes": Object {
          "author": "Max Mustermann",
          "commit": "2a42fc73f76e3fd9d015d0a98030037a8972e3d1",
          "date": "2019-12-11T12:45:48+01:00",
          "email": "max.mustermann@host.de",
          "file": ".gitlab-ci.yml",
          "line": "    - aws --profile default configure set aws_access_key_id \\"AKIAS2QBEJFO232FJDO\\"",
          "line_number": 67,
          "offender": "AKIAS2QBEJFO232FJDO",
          "repo": "web-app",
          "tags": Array [
            "key",
            "AWS",
          ],
        },
        "category": "Potential Secret",
        "description": "The name of the rule which triggered the finding: AWS Manager ID",
        "name": "AWS Manager ID",
        "osi_layer": "APPLICATION",
        "severity": "HIGH",
      },
      Object {
        "attributes": Object {
          "author": "Max Mustermann",
          "commit": "2a42fc73f76e3fd9d015d0a98030037a8972e3d1",
          "date": "2019-12-11T12:45:48+01:00",
          "email": "max.mustermann@host.de",
          "file": ".gitlab-ci.yml",
          "line": "    - aws --profile default configure set aws_secret_access_key \\"IccA5EboL5foAY3uUyG+zh5OA3rWdpL4C1ePuUOv\\"",
          "line_number": 68,
          "offender": "aws_secret_access_key \\"IccA5EboL5foAY3uUyG+zh5OA3rWdpL4C1ePuUOv\\"",
          "repo": "paul-web",
          "tags": Array [
            "key",
            "AWS",
          ],
        },
        "category": "Potential Secret",
        "description": "The name of the rule which triggered the finding: AWS Secret Key",
        "name": "AWS Secret Key",
        "osi_layer": "APPLICATION",
        "severity": "HIGH",
      },
      Object {
        "attributes": Object {
          "author": "Max Mustermann",
          "commit": "eaf6864262dbbcbf19c972cd961121b340b9968f",
          "date": "2020-02-18T22:28:53+01:00",
          "email": "max.mustermann@host.de",
          "file": "helm/multi-juicer/values.yaml",
          "line": "      password: ERzCT4pwBDxfCKRGmfrMa8KQ8sXf8GKy",
          "line_number": 33,
          "offender": "password: ERzCT4pwBDxfCKRGmfrMa8KQ8sXf8GKy",
          "repo": "multi-juicer",
          "tags": Array [
            "key",
            "Generic",
          ],
        },
        "category": "Potential Secret",
        "description": "The name of the rule which triggered the finding: Generic credentials",
        "name": "Generic credentials",
        "osi_layer": "APPLICATION",
        "severity": "LOW",
      },
      Object {
        "attributes": Object {
          "author": "Max Mustermann",
          "commit": "eaf6864262dbbcbf19c972cd961121b340b9968f",
          "date": "2020-02-18T22:28:53+01:00",
          "email": "max.mustermann@host.de",
          "file": "juice-balancer/config/config.json",
          "line": "      \\"password\\": \\"dRzCT4pwBDxfjfeRel23mMlKQ8sX\\"",
          "line_number": 19,
          "offender": "password\\": \\"dRzCT4pwBDxfjfeRel23mMlKQ8sX",
          "repo": "multi-juicer",
          "tags": Array [
            "key",
            "Generic",
          ],
        },
        "category": "Potential Secret",
        "description": "The name of the rule which triggered the finding: Generic credentials",
        "name": "Generic credentials",
        "osi_layer": "APPLICATION",
        "severity": "LOW",
      },
      Object {
        "attributes": Object {
          "author": "Max Mustermann",
          "commit": "88cf8694d4202bb7361f6779588f566e8eae2ff2",
          "date": "2019-01-16T19:18:54+01:00",
          "email": "max.mustermann@host.de",
          "file": ".env",
          "line": "N/A",
          "line_number": -1,
          "offender": "Filename/path offender: .env",
          "repo": "secureCodeBox-v2",
          "tags": Array [
            "key",
            "FileName",
          ],
        },
        "category": "Potential Secret",
        "description": "The name of the rule which triggered the finding: File names with potential keys and credentials",
        "name": "File names with potential keys and credentials",
        "osi_layer": "APPLICATION",
        "severity": "LOW",
      },
      Object {
        "attributes": Object {
          "author": "Max Mustermann",
          "commit": "eaf6864262dbbcbf19c972cd961121b340b9968f",
          "date": "2019-01-16T19:18:54+01:00",
          "email": "max.mustermann@host.de",
          "file": ".env",
          "line": " facebook_api_key: sj20gj2ß0kofepo2ṕf02",
          "line_number": 30,
          "offender": "sj20gj2ß0kofepo2ṕf02",
          "repo": "madeuprepo",
          "tags": Array [
            "key",
            "Facebook",
          ],
        },
        "category": "Potential Secret",
        "description": "The name of the rule which triggered the finding: Facebook Secret Key",
        "name": "Facebook Secret Key",
        "osi_layer": "APPLICATION",
        "severity": "MEDIUM",
      },
      Object {
        "attributes": Object {
          "author": "Max Mustermann",
          "commit": "2a42fc73f76e3fd9d015d0a98030037a8972e3d1",
          "date": "2019-01-16T19:18:54+01:00",
          "email": "max.mustermann@host.de",
          "file": "key.pem",
          "line": " -----BEGIN PRIVATE KEY-----",
          "line_number": 1,
          "offender": "-----BEGIN PRIVATE KEY-----",
          "repo": "madeuprepo",
          "tags": Array [
            "key",
            "PrivateKey",
          ],
        },
        "category": "Potential Secret",
        "description": "The name of the rule which triggered the finding: Asymmetric Private Key",
        "name": "Asymmetric Private Key",
        "osi_layer": "APPLICATION",
        "severity": "HIGH",
      },
    ]
  `);
});

test("should properly construct commit URL if present with -r option", async () => {
  const scan = {
    spec: {
      scanType: "gitleaks", 
      parameters: [
        "-r",
        "https://github.com/iteratec/multi-juicer",
        "--config",
        "/home/config_all.toml",
      ],
    },
  };

  const jsonContent = await readFile(
    __dirname + "/__testFiles__/test-report-small.json",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(JSON.parse(jsonContent), scan);
  await expect(validateParser(findings)).resolves.toBeUndefined();

  expect(findings).toMatchInlineSnapshot(`
    Array [
      Object {
        "attributes": Object {
          "author": "Max Mustermann",
          "commit": "https://github.com/iteratec/multi-juicer/commit/2a42fc73f76e3fd9d015d0a98030037a8972e3d1",
          "date": "2019-12-11T12:45:48+01:00",
          "email": "max.mustermann@host.de",
          "file": ".gitlab-ci.yml",
          "line": "    - aws --profile default configure set aws_access_key_id \\"AKIAS2QBEJFO232FJDO\\"",
          "line_number": 67,
          "offender": "AKIAS2QBEJFO232FJDO",
          "repo": "web-app",
          "tags": Array [
            "key",
            "AWS",
          ],
        },
        "category": "Potential Secret",
        "description": "The name of the rule which triggered the finding: AWS Manager ID",
        "name": "AWS Manager ID",
        "osi_layer": "APPLICATION",
        "severity": "HIGH",
      },
    ]
  `);
});

test("should properly construct commit URL if present with --repo option", async () => {
  const scan = {
    spec: {
      scanType: "gitleaks",
      parameters: [
        "--repo",
        "https://github.com/iteratec/multi-juicer/",
        "--config",
        "/home/config_all.toml",
      ],
    },
  };

  const jsonContent = await readFile(
    __dirname + "/__testFiles__/test-report-small.json",
    {
      encoding: "utf8",
    }
  );

  const findings = await parse(JSON.parse(jsonContent), scan);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    Array [
      Object {
        "attributes": Object {
          "author": "Max Mustermann",
          "commit": "https://github.com/iteratec/multi-juicer/commit/2a42fc73f76e3fd9d015d0a98030037a8972e3d1",
          "date": "2019-12-11T12:45:48+01:00",
          "email": "max.mustermann@host.de",
          "file": ".gitlab-ci.yml",
          "line": "    - aws --profile default configure set aws_access_key_id \\"AKIAS2QBEJFO232FJDO\\"",
          "line_number": 67,
          "offender": "AKIAS2QBEJFO232FJDO",
          "repo": "web-app",
          "tags": Array [
            "key",
            "AWS",
          ],
        },
        "category": "Potential Secret",
        "description": "The name of the rule which triggered the finding: AWS Manager ID",
        "name": "AWS Manager ID",
        "osi_layer": "APPLICATION",
        "severity": "HIGH",
      },
    ]
  `);
});
