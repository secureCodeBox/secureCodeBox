// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const util = require("util");
const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const {parse} = require("./parser");

test("WPScan parser parses a successfully scan result with at least one informational finding", async () => {
  const scanResults = JSON.parse(
    await readFile(__dirname + "/__testFiles__/example-latest.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(scanResults);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "hostname": "https://www.example.com/",
          "ip_address": "192.168.200.100",
          "wp_confirmed_by": {},
          "wp_found_by": "Rss Generator (Passive Detection)",
          "wp_interesting_entries": [
            "https://www.example.com/feed/, <generator>https://wordpress.org/?v=5.3.3</generator>",
            "https://www.example.com/comments/feed/, <generator>https://wordpress.org/?v=5.3.3</generator>",
          ],
          "wp_release_date": "2020-04-29",
          "wp_release_status": "latest",
          "wp_version": "5.3.3",
          "wp_vulnerabilities": [],
          "wpscan_requests": 2335,
          "wpscan_version": "3.8.1",
        },
        "category": "WordPress Service",
        "confidence": 100,
        "description": "WordPress Service Information",
        "identified_at": "2020-06-06T21:52:22.000Z",
        "location": "https://www.example.com/",
        "name": "WordPress Service",
        "osi_layer": "APPLICATION",
        "reference": {},
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "https://www.example.com/",
          "wp_confirmed_by": {},
          "wp_found_by": "Headers (Passive Detection)",
          "wp_interesting_entries": [
            "Server: Apache/2.4.29 (Ubuntu)",
          ],
        },
        "category": "WordPress headers",
        "confidence": 100,
        "description": "Headers",
        "location": "https://www.example.com/",
        "name": "WordPress finding 'headers'",
        "osi_layer": "APPLICATION",
        "reference": {},
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "https://www.example.com/",
          "wp_confirmed_by": {},
          "wp_found_by": "Robots Txt (Aggressive Detection)",
          "wp_interesting_entries": [
            "/wp-admin/",
            "/wp-admin/admin-ajax.php",
          ],
        },
        "category": "WordPress robots_txt",
        "confidence": 100,
        "description": "https://www.example.com/robots.txt",
        "location": "https://www.example.com/robots.txt",
        "name": "WordPress finding 'robots_txt'",
        "osi_layer": "APPLICATION",
        "reference": {},
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "https://www.example.com/",
          "wp_confirmed_by": {},
          "wp_found_by": "Direct Access (Aggressive Detection)",
          "wp_interesting_entries": [],
        },
        "category": "WordPress readme",
        "confidence": 100,
        "description": "https://www.example.com/readme.html",
        "location": "https://www.example.com/readme.html",
        "name": "WordPress finding 'readme'",
        "osi_layer": "APPLICATION",
        "reference": {},
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "https://www.example.com/",
          "wp_confirmed_by": {},
          "wp_found_by": "Direct Access (Aggressive Detection)",
          "wp_interesting_entries": [],
        },
        "category": "WordPress mu_plugins",
        "confidence": 80,
        "description": "This site has 'Must Use Plugins': https://www.example.com/wp-content/mu-plugins/",
        "location": "https://www.example.com/wp-content/mu-plugins/",
        "name": "WordPress finding 'mu_plugins'",
        "osi_layer": "APPLICATION",
        "reference": {},
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "https://www.example.com/",
          "wp_confirmed_by": {},
          "wp_found_by": "Direct Access (Aggressive Detection)",
          "wp_interesting_entries": [],
        },
        "category": "WordPress wp_cron",
        "confidence": 60,
        "description": "The external WP-Cron seems to be enabled: https://www.example.com/wp-cron.php",
        "location": "https://www.example.com/wp-cron.php",
        "name": "WordPress finding 'wp_cron'",
        "osi_layer": "APPLICATION",
        "reference": {},
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});

test("WPScan parser parses a scan result file without a detected wp version correctly", async () => {
  const scanResults = JSON.parse(
    await readFile(__dirname + "/__testFiles__/no-version-detected.json", {
      encoding: "utf8",
    })
  );

  const findings = await parse(scanResults);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "hostname": "https://wp.example.com/",
          "ip_address": "203.0.113.42",
          "wp_confirmed_by": undefined,
          "wp_found_by": undefined,
          "wp_interesting_entries": undefined,
          "wp_release_date": undefined,
          "wp_release_status": undefined,
          "wp_version": undefined,
          "wp_vulnerabilities": undefined,
          "wpscan_requests": 3734,
          "wpscan_version": "3.8.17",
        },
        "category": "WordPress Service",
        "confidence": undefined,
        "description": "WordPress Service Information",
        "identified_at": "2021-05-17T14:18:06.000Z",
        "location": "https://wp.example.com/",
        "name": "WordPress Service",
        "osi_layer": "APPLICATION",
        "reference": {},
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "https://wp.example.com/",
          "wp_confirmed_by": {},
          "wp_found_by": "Headers (Passive Detection)",
          "wp_interesting_entries": [
            "Server: Apache",
            "Expect-CT: max-age=86400, enforce",
          ],
        },
        "category": "WordPress headers",
        "confidence": 100,
        "description": "Headers",
        "location": "https://wp.example.com/",
        "name": "WordPress finding 'headers'",
        "osi_layer": "APPLICATION",
        "reference": {},
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "https://wp.example.com/",
          "wp_confirmed_by": {},
          "wp_found_by": "Robots Txt (Aggressive Detection)",
          "wp_interesting_entries": [
            "/wp-admin/",
            "/wp-admin/admin-ajax.php",
          ],
        },
        "category": "WordPress robots_txt",
        "confidence": 100,
        "description": "robots.txt found: https://wp.example.com/robots.txt",
        "location": "https://wp.example.com/robots.txt",
        "name": "WordPress finding 'robots_txt'",
        "osi_layer": "APPLICATION",
        "reference": {},
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "https://wp.example.com/",
          "wp_confirmed_by": {},
          "wp_found_by": "Direct Access (Aggressive Detection)",
          "wp_interesting_entries": [],
        },
        "category": "WordPress readme",
        "confidence": 100,
        "description": "WordPress readme found: https://wp.example.com/readme.html",
        "location": "https://wp.example.com/readme.html",
        "name": "WordPress finding 'readme'",
        "osi_layer": "APPLICATION",
        "reference": {},
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "https://wp.example.com/",
          "wp_confirmed_by": {},
          "wp_found_by": "Direct Access (Aggressive Detection)",
          "wp_interesting_entries": [],
        },
        "category": "WordPress mu_plugins",
        "confidence": 80,
        "description": "This site has 'Must Use Plugins': https://wp.example.com/wp-content/mu-plugins/",
        "location": "https://wp.example.com/wp-content/mu-plugins/",
        "name": "WordPress finding 'mu_plugins'",
        "osi_layer": "APPLICATION",
        "reference": {},
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "https://wp.example.com/",
          "wp_confirmed_by": {},
          "wp_found_by": "Direct Access (Aggressive Detection)",
          "wp_interesting_entries": [],
        },
        "category": "WordPress wp_cron",
        "confidence": 60,
        "description": "The external WP-Cron seems to be enabled: https://wp.example.com/wp-cron.php",
        "location": "https://wp.example.com/wp-cron.php",
        "name": "WordPress finding 'wp_cron'",
        "osi_layer": "APPLICATION",
        "reference": {},
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});

test("should properly parse empty json file", async () => {
  const jsonContent = await readFile(
    __dirname + "/__testFiles__/empty-localhost.json",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(jsonContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});
