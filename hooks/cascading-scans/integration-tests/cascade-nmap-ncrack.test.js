// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { cascadingScan } = require("../../../tests/integration/helpers");

jest.retryTimes(3);

test(
  "Cascading Scan nmap -> ncrack on dummy-ssh",
  async () => {
    const { categories, severities, count } = await cascadingScan(
      "nmap-dummy-ssh",
      "nmap",
      ["-Pn", "-sV", "dummy-ssh.demo-targets.svc"],
      {
        nameCascade: "ncrack-ssh",
        matchLabels: {
          "securecodebox.io/invasive": "invasive",
          "securecodebox.io/intensive": "high",
        },
      },
      120
    );

    expect(count).toBe(1);
    expect(categories).toEqual({
      "Discovered Credentials": 1,
    });
    expect(severities).toEqual({
      high: 1,
    });
  },
  3 * 60 * 1000
);
