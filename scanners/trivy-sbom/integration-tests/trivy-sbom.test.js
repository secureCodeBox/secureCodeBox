// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { scan } from "../../../tests/integration/helpers.js";

test(
  "trivy-sbom image scan for juiceshop should create sbom",
  async () => {
    const { categories, severities, count } = await scan(
      "trivy-juice-test",
      "trivy-sbom-image",
      ["bkimminich/juice-shop:v18.0.0"],
      90,
    );

    expect(count).toEqual(1);
    expect(categories["SBOM"]).toEqual(1);
    expect(severities["informational"]).toEqual(1);
  },
  { timeout: 3 * 60 * 1000 },
);

test(
  "Invalid argument should be marked as errored",
  async () => {
    await expect(
      scan(
        "trivy-invalid-arg",
        "trivy-sbom-image",
        ["--invalidArg", "not/a-valid-image:v0.0.0"],
        90,
      ),
    ).rejects.toThrow(
      'Scan failed with description "Failed to run the Scan Container, check k8s Job and its logs for more details"',
    );
  },
  { timeout: 3 * 60 * 1000 },
);
