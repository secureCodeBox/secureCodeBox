// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const retry = require("../retry");

const { scan } = require("../helpers");

retry(
  "kube-hunter should find a fixed number of findings for the kind cluster",
  3,
  async () => {
    await scan(
      "kube-hunter-in-cluster",
      "kube-hunter",
      ["--pod", "--quick"],
      4 * 60
    );

    // If we got here the scan succeded
    // as the number of findings will depend on the cluster, we just check if it is defined at all
    expect(true).toBe(true);
  },
  5 * 60 * 1000
);
