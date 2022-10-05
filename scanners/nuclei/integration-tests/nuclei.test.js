// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../../helpers");

jest.retryTimes(3);

test(
  "Nuclei scan for a vulnerable demo target",
  async () => {
      const {
        severities,
        count
      } = await scan(
        "nuclei-scb",
        "nuclei",
        ["-no-interactsh", "-system-resolvers", "-u", "http://bodgeit.demo-targets.svc:8080", "-verbose"],
        300
      );

      expect(count).toBeGreaterThanOrEqual(1);
      expect(severities["informational"]).toBeGreaterThanOrEqual(1);
    },
    5 * 60 * 1000
);
