// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {scan} = require("../../helpers");

jest.retryTimes(3);

test(
  "FFuf scan with config YAML against 'juiceshop'",
  async () => {
    const { categories, severities, count } = await scan(
      "ffuf-scan-juiceshop-demo",
      "ffuf",
      ["-u", "http://juiceshop.demo-targets.svc:3000/FUZZ", "-w", "/config/wordlist.txt"],
      60 * 2,
      // volumes
      [{
        "name": "ffuf-wordlist-config",
        "configMap": {"name": "ffuf-wordlist-config-map"}
      }],
      // volumeMounts
      [{
        "name": "ffuf-wordlist-config",
        "mountPath": "/config/wordlist.txt",
        "subPath": "wordlist.txt"
      }]
    );

    // There must be at least one finding
    expect(count).toBe(2);
    expect(categories).toEqual({
      "Webserver Content": 2,
    });
    expect(severities).toEqual({
      informational: 2
    });
  },
  60 * 3 * 1000
);
