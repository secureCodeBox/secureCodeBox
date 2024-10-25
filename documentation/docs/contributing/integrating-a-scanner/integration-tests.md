---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Integration Tests
sidebar_position: 10
---

After you have finished the implementation, it's very much recommended to add some End-2-End Integration Tests
for your scanner to check if everything is running smoothly together.

## Write your tests

In most cases, the simplest and most effective way
to test your scanner is by running it against a `demo-target`. You can also re-use one of the examples you provided.

Let's have a look at the [nmap](https://github.com/secureCodeBox/secureCodeBox/blob/main/scanners/nmap/integration-tests/nmap.test.js) test to understand all the steps required:

```javascript
test(
  "localhost port scan should only find a host finding",
  async () => {
    const { categories, severities, count } = await scan(
      "nmap-localhost",
      "nmap",
      ["localhost"],
      90,
    );

    expect(count).toBe(1);
    expect(categories).toMatchInlineSnapshot(`
      {
        "Host": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      {
        "informational": 1,
      }
    `);
  },
  3 * 60 * 1000,
);
```

At first, we start our scan function, and we feed it with a scan name, the specific scan command and a list of parameters
for the scan. Likely, you can copy them from an example. Note that you must refer to your targeted demo-target via
`name.demp-apps.svc` if it is installed in the "demo-targets" namespace.
**Please don't use any external websites (like google.com) in your integration tests!**

The last parameter is a test timeout in seconds. This timeout should be lower than the general one for the jest test
to provide us with better information in case that the test fails.

Upon finishing successfully, the scan will give us back categories, severities and a number of findings (count).
We can then use them to create our test assertions. If you use snapshots, you don't need to copy your findings manually,
you can rather automatically update them via `npx jest --update-snapshot` (see below).

The last parameter would be the test timeout for jest in milliseconds, make sure it is high enough and
higher than the timeout provided above.

## Run your integration tests locally

Before pushing them to the repository, make sure your tests run successfully in your local cluster. You may use the [makefile](/docs/contributing/integrating-a-scanner/makefile) to run your integration tests locally.

## Integrate in ci.yaml

If your tests are successful, you can eventually integrate them in the [ci workflow](https://github.com/secureCodeBox/secureCodeBox/blob/main/.github/workflows/ci.yaml#L414). Here you have to go through the
same steps as above to install all the resources in the cluster. Please make sure to stick to the conventions
already used in the yaml file and please do not install any resources for your tests that have already been installed
or are not used in the tests.

Thank you for helping us to provide high quality open source code! :)
