// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { scan } from "../../../tests/integration/helpers.js";

test(
  "Whatweb scans static nginx",
  async () => {
    const { categories, severities, count } = await scan(
      "whatweb-example",
      "whatweb",
      ["nginx.demo-targets.svc"],
      90,
    );

    expect(count).toBe(1);
    expect(categories).toMatchInlineSnapshot(`
      {
        "WEB APPLICATION": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      {
        "informational": 1,
      }
    `);
  },
  { timeout: 3 * 60 * 1000 },
);

test(
  "Invalid argument should be marked as errored",
  async () => {
    await expect(
      scan(
        "whatweb-invalid-arg",
        "whatweb",
        ["--invalidArg", "example.com"],
        90,
      ),
    ).rejects.toThrow(
      'Scan failed with description "Failed to run the Parser. This is likely a Bug, we would like to know about. Please open up a Issue on GitHub."',
    );
  },
  { timeout: 3 * 60 * 1000 },
);
