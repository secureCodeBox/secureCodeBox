// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

// todo: Integrate into github ci pipeline
const {scan} = require("../../helpers");

jest.retryTimes(3);

test(
  "ssh-scan should find a couple of findings for a dummy ssh service",
  async () => {
    const {categories, severities, count} = await scan(
      "ssh-scan-dummy-ssh",
      "ssh-scan",
      ["-t", "dummy-ssh.demo-targets.svc"],
      90
    );

    expect(count).toBe(4);
    expect(categories).toMatchInlineSnapshot(`
      {
        "SSH Policy Violation": 3,
        "SSH Service": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      {
        "informational": 1,
        "medium": 3,
      }
    `);
  },
  3 * 60 * 1000
);

test(
  "ssh-scan should gracefully handle a non-existing target",
  async () => {
    await expect(
      scan(
        "ssh-scan-non-existing",
        "ssh-scan",
        ["-t", "this-target-doesnt-exist.demo-targets.svc"],
        180
      )
    ).rejects.toThrow(
      'Scan failed with description "Failed to run the Scan Container, check k8s Job and its logs for more details"'
    );
  },
  3 * 60 * 1000
);
