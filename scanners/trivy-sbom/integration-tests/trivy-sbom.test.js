// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

jest.retryTimes(3);

test(
  "trivy-sbom image scan for juiceshop should create sbom",
  async () => {
    const { categories, severities, count } = await scan(
      "trivy-juice-test",
      "trivy-sbom-image",
      ["bkimminich/juice-shop:v15.0.0"],
      90
    );

    expect(count).toEqual(1);
    expect(categories["SBOM"]).toEqual(1);
    expect(severities["informational"]).toEqual(1);
  },
  3 * 60 * 1000
);

test(
  "Invalid argument should be marked as errored",
  async () => {
    await expect(
      scan(
        "trivy-invalidArg",
        "trivy-sbom-image",
        ["--invalidArg", "not/a-valid-image:v0.0.0"],
        90
      )
    ).rejects.toThrow("HTTP request failed");
  },
  3 * 60 * 1000
);
