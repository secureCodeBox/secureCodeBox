---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: hook.js and hook.test.js
sidebar_position: 5
---

## hook.js

This file will contain the actual code of your hook.
For JavaScript, we provide a _hook-sdk_.
This _hook-sdk_ serves as helper for retrieving findings and as entrypoint for the Dockerfile.

The only function required to be created is the `handle()` function.
This function is called by the _hook-sdk_ after scans are finished.
As parameters for `handle()` the _hook-sdk_ provides the following:

- [hook.js](#hookjs)
  - [getRawResults()](#getrawresults)
  - [getFindings()](#getfindings)
  - [updateRawResults()](#updaterawresults)
  - [updateFindings()](#updatefindings)
  - [scan](#scan)
  - [Example](#example)
- [hook.test.js](#hooktestjs)

### getRawResults()

This callback function will provide all raw results to the hook as a promise.

:::caution
When the rawResults are in form of a json file, getRawResults will return the parsed representation of the data, not the json string.
:::

```js
async function handle({ getRawResults }) {
  const result = await getRawResults();
  // outputs string representation of the scan result file
  // e.g. the nmap xml output
  console.log(result);
}
module.exports.handle = handle;
```

### getFindings()

This callback function will provide all findings to the hook as an array of findings wrapped in a promise.

Example:

```js
async function handle({ getFindings }) {
  const findings = await getFindings();
  // logs the findings returned by the parser of the scantype
  console.log(findings);
}
module.exports.handle = handle;
```

### updateRawResults()

This callback function will enable you to publish desired changes to raw results.

:::note
`updateRawResults` is only available in ReadAndWrite hooks.
:::

:::caution
`updateRawResults` operates on the raw results of the scans, this means that the implementation has to be tied to the specific output format of a singular scanner. The updated raw results are also not parsed again by the parsers integrated into the secureCodeBox, making this method only viable if you are using a ReadOnly hook exporting the results into an external system like DefectDojo.

If you want to perform actions on all findings consider using the `updateFindings` hook.
:::

Example

```js
async function handle({ updateRawResults }) {
  // Overrides the raw results with a fixed nmap report
  await updateRawResults(`
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE nmaprun>
<?xml-stylesheet href="file:///usr/local/bin/../share/nmap/nmap.xsl" type="text/xsl"?>
<!-- Nmap 7.91 scan initiated Mon Dec  7 12:29:59 2020 as: nmap -oX - -p 443 fooobar.example.com -->
<nmaprun scanner="nmap" args="nmap -oX - -p 443 fooobar.example.com" start="1607340599" startstr="Mon Dec  7 12:29:59 2020" version="7.91" xmloutputversion="1.05">
<scaninfo type="connect" protocol="tcp" numservices="1" services="443"/>
<verbose level="0"/>
<debugging level="0"/>
Failed to resolve "fooobar.example.com".
WARNING: No targets were specified, so 0 hosts scanned.
<runstats><finished time="1607340599" timestr="Mon Dec  7 12:29:59 2020" summary="Nmap done at Mon Dec  7 12:29:59 2020; 0 IP addresses (0 hosts up) scanned in 0.03 seconds" elapsed="0.03" exit="success"/><hosts up="0" down="0" total="0"/>
</runstats>
</nmaprun>
`);
}
module.exports.handle = handle;
```

### updateFindings()

This callback function will enable you to publish desired updates to the findings.

:::note
`updateFindings` is only available in ReadAndWrite hooks.
:::

:::caution
If you make changes to some findings you will have to call `updateFindings()` with **_ALL_** findings not just with the ones that have changed or unchanged findings will get lost!
:::

Example:

```js
async function handle({
  updateFindings,
}) {
    // Overrides the findings with a fixed nmap finding
    await updateFindings([
        {
            "id": "7475b620-0527-4679-b738-b2c69fad025f"
            "name": "ssh",
            "description": "Port 22 is open using tcp protocol.",
            "category": "Open Port",
            "location": "tcp://45.33.32.156:22",
            "osi_layer": "NETWORK",
            "severity": "INFORMATIONAL",
            "attributes": {
                "port": 22,
                "state": "open",
                "ip_address": "45.33.32.156",
                "mac_address": null,
                "protocol": "tcp",
                "hostname": "scanme.nmap.org",
                "method": "table",
                "operating_system": null,
                "service": "ssh",
                "serviceProduct": null,
                "serviceVersion": null,
                "scripts": null
            },
        }
    ]);
}
```

### scan

### Example

This is a basic example for the _generic-webhook_
As you can see this hook defines the `handle()` function but only uses `getFindings()` and `scan` provided by the _hook-sdk_.
This is fine because the other parameters are not needed.

:::info
Maybe you notice that in line 5 ENVs are used.
If you also need ENVs or Volumes see INSERT-LINK-HERE.
:::

:::info
Notice that the `handle()` function has to be exported to use in the _hook-sdk_
:::

```js
const axios = require("axios");

async function handle({
  getFindings,
  scan,
  webhookUrl = process.env["WEBHOOK_URL"],
}) {
  const findings = await getFindings();

  console.log(`Sending ${findings.length} findings to ${webhookUrl}`);

  await axios.post(webhookUrl, { scan, findings });
}
module.exports.handle = handle;
```

## hook.test.js

This file should contain some unit test to run against your hook.
