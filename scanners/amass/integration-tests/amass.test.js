// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { scan } from "../../../tests/integration/helpers.js";

test(
  "amass should find at least 20 subdomains",
  async () => {
    const { count } = await scan(
      "amass-scanner-dummy-scan",
      "amass",
      ["-norecursive", "-timeout", "1", "-d", "owasp.org"],
      180,
    );
    expect(count).toBeGreaterThanOrEqual(20); // The scan is passive, so we can expect a lot of subdomains
  },
  {
    timeout: 10 * 60 * 1000,
  },
);
