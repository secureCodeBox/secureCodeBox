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
      "author": "Commit Author",
      "commit": "20202220306db37c13792bc672e57b0598ab680c",
      "date": "2022-01-06T15:19:51Z",
      "description": "Generic API Key",
      "email": "committer@some-domain.tld",
      "end_line": "51:45",
      "file": "hooks/persistence-azure-monitor/hook/hook.test.js",
      "line": "Key: \\"aGVsbG8taS1hbS1hLXRlc3Qta2V5\\"",
      "offender": "aGVsbG8taS1hbS1hLXRlc3Qta2V5",
      "start_line": "51:11",
      "tags": Array [],
    },
    "category": "Potential Secret",
    "description": "The name of the rule which triggered the finding: generic-api-key",
    "name": "generic-api-key",
    "osi_layer": "APPLICATION",
    "severity": "LOW",
  },
  Object {
    "attributes": Object {
      "author": "Commit Author",
      "commit": "e064eb8bd2094287fdeb64474798a8fd53e77bd3",
      "date": "2021-09-06T13:53:58Z",
      "description": "PKCS8 private key",
      "email": "committer@some-domain.tld",
      "end_line": "1:27",
      "file": "demo-targets/unsafe-https/container/site.key",
      "line": "-----BEGIN PRIVATE KEY-----",
      "offender": "-----BEGIN PRIVATE KEY-----",
      "start_line": "1:1",
      "tags": Array [
        "PrivateKey",
      ],
    },
    "category": "Potential Secret",
    "description": "The name of the rule which triggered the finding: PKCS8-PK",
    "name": "PKCS8-PK",
    "osi_layer": "APPLICATION",
    "severity": "HIGH",
  },
  Object {
    "attributes": Object {
      "author": "Commit Author",
      "commit": "ae9e923125a0409025316a970fa16e0271e1734a",
      "date": "2021-07-02T12:25:00Z",
      "description": "Slack token",
      "email": "committer@some-domain.tld",
      "end_line": "164:297",
      "file": "hooks/notification/README.md",
      "line": "xoxb-",
      "offender": "xoxb-",
      "start_line": "164:293",
      "tags": Array [],
    },
    "category": "Potential Secret",
    "description": "The name of the rule which triggered the finding: slack-access-token",
    "name": "slack-access-token",
    "osi_layer": "APPLICATION",
    "severity": "LOW",
  },
  Object {
    "attributes": Object {
      "author": "Commit Author",
      "commit": "549b29afa8644c6385c385bed3327e6131557ecb",
      "date": "2021-05-02T17:17:57Z",
      "description": "Generic API Key",
      "email": "committer@some-domain.tld",
      "end_line": "37:47",
      "file": "scanners/zap-extended/scanner/scbzapv2/__main__.py",
      "line": "api_key = 'eor898q1luuq8054e0e5r9s3jh'",
      "offender": "eor898q1luuq8054e0e5r9s3jh",
      "start_line": "37:10",
      "tags": Array [],
    },
    "category": "Potential Secret",
    "description": "The name of the rule which triggered the finding: generic-api-key",
    "name": "generic-api-key",
    "osi_layer": "APPLICATION",
    "severity": "LOW",
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
      "author": "Commit Author",
      "commit": "https://github.com/iteratec/multi-juicer/commit/604ca16251cd6e528328605420890f2d55a5464d",
      "date": "2020-10-15T11:35:39Z",
      "description": "PKCS8 private key",
      "email": "committer@some-domain.tld",
      "end_line": "167:48",
      "file": "scanners/gitleaks/parser/parser.test.js",
      "line": "-----BEGIN PRIVATE KEY-----",
      "offender": "-----BEGIN PRIVATE KEY-----",
      "start_line": "167:22",
      "tags": Array [],
    },
    "category": "Potential Secret",
    "description": "The name of the rule which triggered the finding: PKCS8-PK",
    "name": "PKCS8-PK",
    "osi_layer": "APPLICATION",
    "severity": "LOW",
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
      "author": "Commit Author",
      "commit": "https://github.com/iteratec/multi-juicer/commit/604ca16251cd6e528328605420890f2d55a5464d",
      "date": "2020-10-15T11:35:39Z",
      "description": "PKCS8 private key",
      "email": "committer@some-domain.tld",
      "end_line": "167:48",
      "file": "scanners/gitleaks/parser/parser.test.js",
      "line": "-----BEGIN PRIVATE KEY-----",
      "offender": "-----BEGIN PRIVATE KEY-----",
      "start_line": "167:22",
      "tags": Array [],
    },
    "category": "Potential Secret",
    "description": "The name of the rule which triggered the finding: PKCS8-PK",
    "name": "PKCS8-PK",
    "osi_layer": "APPLICATION",
    "severity": "LOW",
  },
]
`);
});
