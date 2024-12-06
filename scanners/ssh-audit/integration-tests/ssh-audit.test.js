// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../../../tests/integration/helpers.js");

jest.retryTimes(1);

test(
  "ssh-audit should find a couple of findings for a dummy ssh service",
  async () => {
    const { categories, severities, count } = await scan(
      "ssh-audit-dummy-ssh",
      "ssh-audit",
      ["dummy-ssh.demo-targets.svc"],
      90
    );
    expect(count).toBe(7);
    expect(categories).toMatchInlineSnapshot(`
      {
        "SSH Policy Violation": 6,
        "SSH Service": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
    {
      "high": 3,
      "informational": 1,
      "medium": 3,
    }
    `);
  },
  3 * 60 * 1000
);

test(
  "ssh-audit should gracefully handle a non-existing target",
  async () => {
    await expect(
      scan(
        "ssh-audit-non-existing",
        "ssh-audit",
        ["this-target-doesnt-exist.demo-targets.svc"],
        180
      )
    ).rejects.toThrow(
      'Scan failed with description "Failed to run the Scan Container, check k8s Job and its logs for more details"'
    );
  },
  3 * 60 * 1000
);
