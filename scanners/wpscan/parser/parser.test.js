// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const util = require("util");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

// test("WPScan parser parses errored result (no Wordpress server) to zero findings", async () => {
//   const hosts = JSON.parse(
//     await readFile(__dirname + "/__testFiles__/empty-localhost.json", {
//       encoding: "utf8"
//     })
//   );

//   expect(await parse(hosts)).toEqual([]);
// });

test("WPScan parser parses a successfull scan result with at least one informational finding", async () => {
  const scanResults = JSON.parse(
    await readFile(__dirname + "/__testFiles__/example-latest.json", {
      encoding: "utf8"
    })
  );

  expect(await parse(scanResults)).toMatchInlineSnapshot(`
    Array [
      Object {
        "attributes": Object {
          "hostname": "https://www.example.com/",
          "ip_address": "192.168.200.100",
          "wp_confirmed_by": Object {},
          "wp_found_by": "Rss Generator (Passive Detection)",
          "wp_interesting_entries": Array [
            "https://www.example.com/feed/, <generator>https://wordpress.org/?v=5.3.3</generator>",
            "https://www.example.com/comments/feed/, <generator>https://wordpress.org/?v=5.3.3</generator>",
          ],
          "wp_release_date": "2020-04-29",
          "wp_release_status": "latest",
          "wp_version": "5.3.3",
          "wp_vulnerabilities": Array [],
          "wpscan_requests": 2335,
          "wpscan_version": "3.8.1",
        },
        "category": "WordPress Service",
        "confidence": 100,
        "description": "WordPress Service Information",
        "location": "https://www.example.com/",
        "name": "WordPress Service",
        "osi_layer": "APPLICATION",
        "reference": Object {},
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "https://www.example.com/",
          "wp_confirmed_by": Object {},
          "wp_found_by": "Headers (Passive Detection)",
          "wp_interesting_entries": Array [
            "Server: Apache/2.4.29 (Ubuntu)",
          ],
        },
        "category": "WordPress headers",
        "confidence": 100,
        "description": "Headers",
        "location": "https://www.example.com/",
        "name": "WordPress finding 'headers'",
        "osi_layer": "APPLICATION",
        "reference": Object {},
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "https://www.example.com/",
          "wp_confirmed_by": Object {},
          "wp_found_by": "Robots Txt (Aggressive Detection)",
          "wp_interesting_entries": Array [
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
        "reference": Object {},
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "https://www.example.com/",
          "wp_confirmed_by": Object {},
          "wp_found_by": "Direct Access (Aggressive Detection)",
          "wp_interesting_entries": Array [],
        },
        "category": "WordPress readme",
        "confidence": 100,
        "description": "https://www.example.com/readme.html",
        "location": "https://www.example.com/readme.html",
        "name": "WordPress finding 'readme'",
        "osi_layer": "APPLICATION",
        "reference": Object {},
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "https://www.example.com/",
          "wp_confirmed_by": Object {},
          "wp_found_by": "Direct Access (Aggressive Detection)",
          "wp_interesting_entries": Array [],
        },
        "category": "WordPress mu_plugins",
        "confidence": 80,
        "description": "This site has 'Must Use Plugins': https://www.example.com/wp-content/mu-plugins/",
        "location": "https://www.example.com/wp-content/mu-plugins/",
        "name": "WordPress finding 'mu_plugins'",
        "osi_layer": "APPLICATION",
        "reference": Object {},
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "https://www.example.com/",
          "wp_confirmed_by": Object {},
          "wp_found_by": "Direct Access (Aggressive Detection)",
          "wp_interesting_entries": Array [],
        },
        "category": "WordPress wp_cron",
        "confidence": 60,
        "description": "The external WP-Cron seems to be enabled: https://www.example.com/wp-cron.php",
        "location": "https://www.example.com/wp-cron.php",
        "name": "WordPress finding 'wp_cron'",
        "osi_layer": "APPLICATION",
        "reference": Object {},
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});
