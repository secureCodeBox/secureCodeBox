// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

jest.retryTimes(3);

// test(
//   "Nuclei scan for a vulnerable bodgeit demo target",
//   async () => {
//     const { categories, severities, count } = await scan(
//       "nuclei-juiceshop",
//       "nuclei",
//       ["-no-interactsh", "-u", "http://bodgeit.demo-targets.svc:8080"],
//       180
//     );

//     expect(count).toBeGreaterThanOrEqual(4);
//     // expect(categories["Image Vulnerability"]).toBeGreaterThanOrEqual(10);
//     // expect(categories["NPM Package Vulnerability"]).toBeGreaterThanOrEqual(30);
//     // expect(severities["high"]).toBeGreaterThanOrEqual(20);
//     // expect(severities["medium"]).toBeGreaterThanOrEqual(10);
//     expect(severities["low"]).toBeGreaterThanOrEqual(1);
//   },
//   3 * 60 * 1000
// );

test(
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