# Scanning Server Side Rendered Apps using arachni

Scanning for Vulnerabilities in BodgeIt using Arachni and the secureCodeBox.

## Introduction

BodgeIt is a intentionally vulnarable web application written in JSPs with only very few usages of JavaScript.
This makes the app relativly straight forward to scan using pretty much any tool.

In this example we'll be using Arachni controlled by the secureCodeBox to scan for vulnarabilties in the BodgeIt Store.

## Testing the setup

This is a straight forward configuration by simply configuring the target.

### Start the scan via HTTP API

`PUT http://localhost:8080/box/securityTests`

### Start the scan via CLI

`run_scanner.sh --payload payloadFile.json`

### Test Payload

```json
[
  {
    "context": "BodgeIt",
    "name": "arachni",
    "target": {
      "name": "BodgeIt-local",
      "location": "http://bodgeit:8080/bodgeit/"
    }
  }
]
```

This scan should finish in about a minute and should return a couple of findings.

## Full Scan

The following example contains a fully configured Arachni Scan for the BodgeIt Store. This can be improved by
configuring login credentials and/or providing a login script.

### Start the scan via HTTP API

`PUT http://localhost:8080/box/securityTests`

### Start the scan via CLI

`run_scanner.sh --payload payloadFile.json arachni`

### Full Payload

```json
[
  {
    "context": "BodgeIt",
    "name": "arachni",
    "target": {
      "name": "BodgeIt-local",
      "location": "http://bodgeit:8080/bodgeit/",
      "attributes": {
        "ARACHNI_DOM_DEPTH_LIMIT": 15,
        "ARACHNI_DIR_DEPTH_LIMIT": 5,
        "ARACHNI_PAGE_LIMIT": 50,
        "ARACHNI_EXCLUDE_PATTERNS": [
          ".*\\.png",
          ".*util\\.js",
          ".*style\\.css"
        ],
        "ARACHNI_SCAN_METHODS": "*",
        "ARACHNI_REQUESTS_PER_SECOND": 20,
        "ARACHNI_POOL_SIZE": 6,
        "ARACHNI_REQUEST_CONCURRENCY": 20
      }
    }
  }
]
```

This scan should finish in about a minute and should return a couple of findings.
