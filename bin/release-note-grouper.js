#!/usr/bin/env node

// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

/**
Groups release notes from our SCB Bot into one group/line each per scanner
To use this script you first have to install the node.js dependencies of the bin/package.json using npm install

Example Usage: `cat release-context.txt | release-version-grouper.js`
Example Usage: `pbpaste | release-version-grouper.js`

E.g. turn this:
```md
    [SCB-Bot] Upgraded semgrep from 1.50.0 to 1.51.0 @secureCodeBoxBot (#2112)
    [SCB-Bot] Upgraded nuclei from v3.0.4 to v3.1.0 @secureCodeBoxBot (#2114)
    [SCB-Bot] Upgraded gitleaks from v8.18.0 to v8.18.1 @secureCodeBoxBot (#2103)
    [SCB-Bot] Upgraded nuclei from v3.0.3 to v3.0.4 @secureCodeBoxBot (#2104)
    [SCB-Bot] Upgraded semgrep from 1.48.0 to 1.50.0 @secureCodeBoxBot (#2101)
```
into this:
```md
 - Upgraded gitleaks from v8.18.0 to v8.18.1 @secureCodeBoxBot (#2103)
 - Upgraded nuclei from v3.0.3 to v3.1.0 @secureCodeBoxBot (#2114, #2104)
 - Upgraded semgrep from 1.48.0 to 1.51.0 @secureCodeBoxBot (#2112, #2101)
```
 */

const semver = require("semver");
const readline = require("node:readline");
const stream = require("node:stream");

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: new stream.Writable(),
  terminal: false,
});

let upgrades = {};

rl.on("line", (line) => {
  // Extract information from each line
  const match = line.match(
    /.*\[SCB-Bot\] Upgraded (.+) from ([\w\.]+) to ([\w\.]+) by @secureCodeBoxBot in (.*)/,
  );
  if (match) {
    const [, dependency, oldVersion, newVersion, pr] = match;

    // Initialize or update the record for each dependency
    if (!upgrades[dependency]) {
      upgrades[dependency] = {
        minVersion: oldVersion,
        maxVersion: newVersion,
        prs: [pr],
      };
    } else {
      // Compare and update version numbers using semver
      if (semver.lt(oldVersion, upgrades[dependency].minVersion)) {
        upgrades[dependency].minVersion = oldVersion;
      }
      if (semver.gt(newVersion, upgrades[dependency].maxVersion)) {
        upgrades[dependency].maxVersion = newVersion;
      }
      upgrades[dependency].prs.push(pr);
    }
  }
});

rl.on("close", () => {
  // Sort the dependencies alphabetically and output the grouped information
  Object.keys(upgrades)
    .sort()
    .forEach((dep) => {
      console.log(
        ` - Upgraded ${dep} from ${upgrades[dep].minVersion} to ${
          upgrades[dep].maxVersion
        } @secureCodeBoxBot (${upgrades[dep].prs.join(", ")})`,
      );
    });
});
