// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { scan } from "../../../tests/integration/helpers.js";

test(
  "nuclei scan for a vulnerable bodgeit demo target",
  async () => {
    const { categories, severities, count } = await scan(
      "nuclei-bodgeit",
      "nuclei",
      [
        "-no-interactsh",
        "-disable-update-check",
        "-templates",
        "/nuclei-templates/*.yaml",
        "-u",
        "http://bodgeit.demo-targets.svc.cluster.local:8080",
      ],
      180,
      [
        {
          name: "nuclei-templates",
          configMap: {
            name: "custom-test-nuclei-templates",
            namespace: "integration-tests",
          },
        },
      ],
      [{ name: "nuclei-templates", mountPath: "/nuclei-templates" }],
    );

    expect(count).toBeGreaterThanOrEqual(1);
    expect(severities["informational"]).toBeGreaterThanOrEqual(1);
    expect(categories["tomcat-detect"]).toBe(1);
  },
  {
    timeout: 3 * 60 * 1000,
  },
);
