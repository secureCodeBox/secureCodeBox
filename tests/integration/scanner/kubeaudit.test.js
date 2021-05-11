// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const retry = require("../retry");

const { scan } = require("../helpers");

retry(
  "kubeaudit should run and check the jshop in kubeaudit-tests namespace",
  3,
  async () => {
    const { categories, severities } = await scan(
      "kubeaudit-tests",
      "kubeaudit",
      ["-n", "kubeaudit-tests"],
      90
    );

    expect(categories).toMatchInlineSnapshot(`
      Object {
        "Automounted ServiceAccount Token": 1,
        "No Default Deny NetworkPolicy": 1,
        "Non ReadOnly Root Filesystem": 1,
        "Non Root User Not Enforced": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      Object {
        "low": 2,
        "medium": 2,
      }
    `);
  },
  5 * 60 * 1000
);
