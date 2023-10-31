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
      ["-no-interactsh", "-template-id", "http-missing-security-headers,tomcat-detect",
       "-u", "http://bodgeit.demo-targets.svc.cluster.local:8080"],
      180
    );

    expect(count).toBeGreaterThanOrEqual(10);
    expect(severities["informational"]).toBeGreaterThanOrEqual(10);
    expect(categories["http-missing-security-headers"]).toBeGreaterThanOrEqual(8);
    expect(categories["tomcat-detect"]).toBe(1);
  },
  3 * 60 * 1000
);
