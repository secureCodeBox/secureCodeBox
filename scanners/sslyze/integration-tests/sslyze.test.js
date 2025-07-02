// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { scan } from "../../../tests/integration/helpers.js";

test(
  "Sslyze scans the self-signed unsafe-https demo-target",
  async () => {
    const { categories, severities, count } = await scan(
      "sslyze-unsafe-https",
      "sslyze",
      ["--mozilla_config=intermediate", "unsafe-https.demo-targets.svc"],
      90,
    );

    expect(count).toBe(4);
    expect(categories).toMatchInlineSnapshot(`
      {
        "Invalid Certificate": 1,
        "Outdated TLS Version": 2,
        "TLS Service Info": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      {
        "informational": 1,
        "medium": 3,
      }
    `);
  },
  { timeout: 3 * 60 * 1000 },
);

test(
  "Invalid argument should be marked as errored",
  async () => {
    await expect(
      scan("sslyze-invalid-arg", "sslyze", ["--invalidArg", "example.com"], 90),
    ).rejects.toThrow(
      'Scan failed with description "Failed to run the Scan Container, check k8s Job and its logs for more details"',
    );
  },
  { timeout: 3 * 60 * 1000 },
);
