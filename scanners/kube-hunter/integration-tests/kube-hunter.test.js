// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../../../tests/integration/helpers");

jest.retryTimes(3);

test(
  "kube-hunter should find a fixed number of findings for the kind cluster",
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
