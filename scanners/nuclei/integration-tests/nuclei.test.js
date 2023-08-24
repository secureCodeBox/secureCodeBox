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

    expect(count).toBeGreaterThanOrEqual(15);
    expect(severities["informational"]).toBeGreaterThanOrEqual(15);
    expect(categories["http-missing-security-headers"]).toBeGreaterThanOrEqual(8);
    expect(categories["tomcat-detect"]).toBe(1);
  },
  3 * 60 * 1000
);
