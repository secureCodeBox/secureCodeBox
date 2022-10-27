// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

jest.retryTimes(3);

test(
  "Nuclei scan for a vulnerable bodgeit demo target",
  async () => {
    const { categories, severities, count } = await scan(
      "nuclei-bodgeit",
      "nuclei",
      ["-no-interactsh", "-u", "http://bodgeit.demo-targets.svc.cluster.local:8080"],
      180
    );

    expect(count).toBeGreaterThanOrEqual(20);
    expect(severities["informational"]).toBeGreaterThanOrEqual(20);
    expect(categories["http-missing-security-headers"]).toBeGreaterThanOrEqual(15);
    expect(categories["tomcat-detect"]).toBe(1);
  },
  3 * 60 * 1000
);

test.skip(
  "Nuclei scan for a vulnerable demo target",
  async () => {
    const { categories, severities, count } = await scan(
      "nuclei-scb",
      "nuclei",
      ["-no-interactsh", "-u", "http://www.secureCodeBox.io"],
      300
    );

    expect(count).toBeGreaterThanOrEqual(1);
    expect(severities["informational"]).toBeGreaterThanOrEqual(1);
  },
  5 * 60 * 1000
);
