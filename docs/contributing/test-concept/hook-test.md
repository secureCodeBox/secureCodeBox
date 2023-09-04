---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Hook Testing"
sidebar_position: 4
---
## Hook

Hooks work in securecodeBox to provide extra functionalities between the different modules implemented.

For example, A Notification WebHook would fetch the findings of a scan, and send them to messaging programs such as E-Mail or Slack. The Cascading Scans Hook can be used to orchestrate security scanners based on defined rule sets, and as result launch new scans.

We would like to test if given the correct circumstances, the hook would behave as expected. For that we employ two types of tests: Unit tests and integration-tests. Both types of tests are based upon the [Jest](https://jestjs.io/) testing framework.

### Unit Tests
The hooks are usually agnostic to the existence of the running scanners. For example the cascading scan hook, only looks at the findings of the scans, and checks if the any of the finding's attribute match the cascading rule. So to test its functionality, it is sufficient to define a scan, its findings and the casdingrule, and see if the expected cascading scan is triggered. For this purpose the beforeEach() function of the jest framework comes in handy. 

```js
let parentScan = undefined;
let sslyzeCascadingRules = undefined;
let parseDefinition = undefined;

beforeEach(() => {
  parentScan = {
    apiVersion: "execution.securecodebox.io/v1",
    kind: "Scan",
    metadata: {
      name: "nmap-foobar.com",
      annotations: {},
    },
    spec: {
      scanType: "nmap",
      parameters: "foobar.com",
      cascades: {},
    },
  };
  parseDefinition = {
    meta: {},
    spec: {
      scopeLimiterAliases: {},
    },
  };

  sslyzeCascadingRules = [
    {
      apiVersion: "cascading.securecodebox.io/v1",
      kind: "CascadingRule",
      metadata: {
        name: "tls-scans",
      },
      spec: {
        matches: {
          anyOf: [
            {
              category: "Open Port",
              attributes: {
                port: 443,
                service: "https",
              },
            },
            {
              category: "Open Port",
              attributes: {
                service: "https",
              },
            },
          ],
        },
        scanSpec: {
          scanType: "sslyze",
          parameters: ["--regular", "{{$.hostOrIP}}:{{attributes.port}}"],
        },
      },
    },
  ];
});

```
Here we set the parent scan as an nmap scan. And also set a cascading rule that launches an sslyze scan if certain ports are open i.e 443. These variables are set before each actual test case (documentation [here](https://jestjs.io/docs/api#beforeeachfn-timeout)).

Depending on the functionality that we want to test. The findings variable, or any relevant variable to the hook is set in the test case as seen here.

```js
test("Should create subsequent scans for open HTTPS ports (NMAP findings)", () => {
  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https",
      },
    },
  ];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    sslyzeCascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans).toMatchInlineSnapshot(`
    Array [
      Object {
        "apiVersion": "execution.securecodebox.io/v1",
        "kind": "Scan",
        "metadata": Object {
          "annotations": Object {
            "cascading.securecodebox.io/chain": "tls-scans",
            "cascading.securecodebox.io/matched-finding": undefined,
            "cascading.securecodebox.io/parent-scan": "nmap-foobar.com",
            "securecodebox.io/hook": "cascading-scans",
          },
          "generateName": "sslyze-foobar.com-tls-scans-",
          "labels": Object {},
          "ownerReferences": Array [
            Object {
              "apiVersion": "execution.securecodebox.io/v1",
              "blockOwnerDeletion": true,
              "controller": true,
              "kind": "Scan",
              "name": "nmap-foobar.com",
              "uid": undefined,
            },
          ],
        },
        "spec": Object {
          "affinity": undefined,
          "cascades": Object {},
          "env": Array [],
          "hookSelector": Object {},
          "initContainers": Array [],
          "parameters": Array [
            "--regular",
            "foobar.com:443",
          ],
          "scanType": "sslyze",
          "tolerations": undefined,
          "volumeMounts": Array [],
          "volumes": Array [],
        },
      },
    ]
  `);
});

```

The findings are set to include an open 443 port. We expect the cascading scan hook to create an sslyze scan. We compare the created scan from function getCascadingScans() with an inline snapshot containing the expected scan. If it's a match then the test was successful.

The initial variable set in the beforeEach() function can also be overwritten if the test case obliges. For example here, we want to make sure that no additional scan is created, if no matching cascading rule is present. For that we overwrite the cascadingRules variable with an empty array.
```js
test("Should create no subsequent scans if there are no rules", () => {
  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https",
      },
    },
  ];

  const cascadingRules = [];

  const cascadedScans = getCascadingScans(
    parentScan,
    findings,
    cascadingRules,
    undefined,
    parseDefinition
  );

  expect(cascadedScans).toMatchInlineSnapshot(`Array []`);
});
```

### How to Run a Unit Test

To run a unit-test, it suffices to run
```bash
make unit-tests
```
in the hook's directory.

### Integration Tests

It is of importance to us, that our CI runs efficiently and quickly. The purpose of that, is to provide quick feedback to the developers about the state of the feature they are currently working on. This speed is usually not feasible in the case of hooks, since they require various applications to be deployed. In the case of a Notification WebHook, in addition to the SCB stack, A Slack or any other kind of messaging service would have to be setup during the integration test
process. As expected, this lengthens the time required for the CI to run. 
The sole exception is hooks that are self contained in the SCB stack e.g. The cascading scan hook. In this case, the integration test is very similar to how [scanners integration tests](/docs/contributing/test-concept/scanner-test#integration-tests) are run.

The hook has a folder named `integration tests` where tests are defined. In the example below, we run an nmap scan, and expect results from an Ncrack scan to be present. An actual SCB scan in then run in the CI's Kind Cluster (Through the [Scan CRD](/docs/api/crds/scan)).

```js
test(
  "Cascading Scan nmap -> ncrack on dummy-ssh",
  async () => {
    const { categories, severities, count } = await cascadingScan(
      "nmap-dummy-ssh",
      "nmap",
      ["-Pn", "-sV", "dummy-ssh.demo-targets.svc"],
      {
        nameCascade: "ncrack-ssh",
        matchLabels: {
          "securecodebox.io/invasive": "invasive",
          "securecodebox.io/intensive": "high",
        },
      },
      120
    );

    expect(count).toBe(1);
    expect(categories).toEqual({
      "Discovered Credentials": 1,
    });
    expect(severities).toEqual({
      high: 1,
    });
  },
  3 * 60 * 1000
);

```
For this test to be considered successful, it has to match the expected condition. In this case, the condition is that the count of the findings is 1, have one "Discovered Credentials" vulnerability category that is of severity high.
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
