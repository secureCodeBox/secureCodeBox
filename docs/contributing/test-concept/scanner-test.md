---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Scanner Testing"
sidebar_position: 3
---
## Scanner

We employ two types of tests: Unit tests for the parser and integration-tests. Both types of tests are based upon the [Jest](https://jestjs.io/) testing framework.

### Unit Tests for Parser

Each scanner has a parser and each parser has a unit test file. The unit test file is named parser.test.js. This file contains different test scenarios. In each test, the results from parser.js and the folder `_snapshots_` are compared. If they are the same, the unit test is successful. 
A unit test can look like this:

```js
test("parser parses large json result without vulnerable extensions successfully", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/localhost.json",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(JSON.parse(fileContent));
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchSnapshot();
});

```
This test for example expects a test file, i.e a raw scanner output, to be found in `/__testFiles__/localhost.json`
### How to Run a Unit Test

To run a unit-test it suffices to run
```bash
make unit-tests
```
in the scanner directory.

### Integration Tests

Each scanner has a folder with integration tests. For the integration tests we check the results of the `scan` function. This function runs an actual SCB scan in the Kind Cluster (Through the [Scan CRD](/docs/api/crds/scan)). It expects the following parameters: Name of the scan, scanType, scanner-specific parameters for the scan and the allowed timeout.

An integration test for, for example, the amass scanner looks like this:

```js
test(
  "amass should find at least 20 subdomains",
  async () => {
    const { count } = await scan(
      "amass-scanner-dummy-scan",
      "amass",
      ["-passive", "-noalts", "-norecursive", "-d", "owasp.org"],
      180
    );
    expect(count).toBeGreaterThanOrEqual(20);
  },
  6 * 60 * 1000
);
```
For this test to be considered successful, it has to match the expected condition. In this case, the condition is that the count of the findings is greater or equal to 20.
### How to Run an Integration Test

To run the test it suffices to run:
```bash
make test
```
All previous tests will be deleted and the current test will be run on a clean slate.

If no clean install is needed before running the test, it is possible to run only the tests themselves through:

```bash
make integration-tests
```
