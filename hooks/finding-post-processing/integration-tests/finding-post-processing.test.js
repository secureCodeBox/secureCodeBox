// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { scan } from "../../../tests/integration/helpers";

test(
  "finding-post-processing after test-scan",
  async () => {
    const { severities, count } = await scan(
      "finding-post-processing",
      "test-scan",
      ["placeholder"],
      90,
    );

    expect(count).toBe(2);
    expect(severities.high).toBe(1);
  },
  3 * 60 * 1000,
);
