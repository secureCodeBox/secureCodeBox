// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { scan } from "../../../tests/integration/helpers.js";

test(
  "FFuf scan with config YAML against 'juice-shop'",
  async () => {
    const { categories, severities, count } = await scan(
      "ffuf-scan-juice-shop-demo",
      "ffuf",
      [
        "-u",
        "http://juice-shop.demo-targets.svc:3000/FUZZ",
        "-w",
        "/config/wordlist.txt",
      ],
      60 * 2,
      // volumes
      [
        {
          name: "ffuf-wordlist-config",
          configMap: { name: "ffuf-wordlist-config-map" },
        },
      ],
      // volumeMounts
      [
        {
          name: "ffuf-wordlist-config",
          mountPath: "/config/wordlist.txt",
          subPath: "wordlist.txt",
        },
      ],
    );

    // There must be at least one finding
    expect(count).toBe(2);
    expect(categories).toEqual({
      "Webserver Content": 2,
    });
    expect(severities).toEqual({
      informational: 2,
    });
  },
  {
    timeout: 60 * 3 * 1000,
  },
);
