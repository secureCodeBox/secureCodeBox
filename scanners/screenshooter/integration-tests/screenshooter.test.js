// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

test(
  "make screenshot of ngnix demo target",
  async () => {
    const { categories } = await scan(
      "demo-target-screenshot",
      "screenshooter",
      ["http://nginx.demo-targets.svc"],
      60 * 4
    );

    expect(categories).toBeDefined();
  }, 60*1000
);
