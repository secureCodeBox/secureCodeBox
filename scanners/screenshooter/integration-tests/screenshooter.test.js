// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { scan } from "../../../tests/integration/helpers.js";

test(
  "make screenshot of nginx demo target",
  async () => {
    const { categories } = await scan(
      "demo-target-screenshot",
      "screenshooter",
      ["http://nginx.demo-targets.svc"],
      60 * 4,
    );

    expect(categories).toEqual({ Screenshot: 1 });
  },
  { timeout: 60 * 1000 },
);
