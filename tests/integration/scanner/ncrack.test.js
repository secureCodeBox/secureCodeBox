// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const retry = require("../retry");

const { scan } = require("../helpers");

retry(
  "ncrack should find 1 credential in vulnerable ssh service",
  3,
  async () => {
    const { categories, severities, count } = await scan(
      "ncrack-dummy-ssh",
      "ncrack",
      [
        "-v",
        "--user=root,admin",
        "--pass=THEPASSWORDYOUCREATED,12345",
        "ssh://dummy-ssh.demo-apps.svc",
      ],
      90
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
