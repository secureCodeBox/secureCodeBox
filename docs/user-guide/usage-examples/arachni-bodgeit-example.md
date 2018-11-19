# Scanning Server Side Rendered Apps using arachni

Scanning for Vulnerabilities in BodgeIt using Arachni and the secureCodeBox.

## Introduction

BodgeIt is a intentionally vulnarable web application written in JSPs with only very few usages of JavaScript.
This makes the app relativly straight forward to scan using pretty much any tool.

In this example we'll be using Arachni controlled by the secureCodeBox to scan for vulnarabilties in the BodgeIt Store.

## Testing the setup

This is a straight forward configuration including defined rate limits. This configuration could be improved by 
defining the login credentials and/or providing a login script.

### Start the scan via HTTP API

`PUT http://localhost:8080/box/processes/arachni_webapplicationscan`

### Start the scan via CLI

`run_scanner.sh --payload payloadFile.json arachni`

### Payload

```json
[
    {
            "location": "http://bodgeit:8080/bodgeit/",
            "name": "Arachni BodgeIt Scan",
            "attributes": {
                "ARACHNI_DOM_DEPTH_LIMIT": 10,
                "ARACHNI_DIR_DEPTH_LIMIT": 62,
                "ARACHNI_PAGE_LIMIT": 22,
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
]
```

This scan should finish in about a minute and should return a couple of findings.


