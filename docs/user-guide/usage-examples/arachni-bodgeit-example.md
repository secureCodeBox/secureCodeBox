# Scanning modern Server Side Rendered Apps using arachni

Scanning for Vulnerabilities in BodgeIt using arachni and the secureCodeBox API.

## Introduction

BodgeIt is a intentionally vulnarable web application written in JSPs with only very few usages of JavaScript.
This makes the app relativly straight forward to scan using pretty much any tool.

In this example we'll be using arachni controlled by the secureCodeBox to scan for vulnarabilties in the BodgeIt Store.

## Testing the setup

This is a straight forward configuration.
This configuration could be improved by configuring a login method for the scanner.

`PUT http://localhost:8080/box/processes/arachni_webapplicationscan`

```json
[
    {
        "name": "Arachni BodgeIt Scan",
        "location": "http://bodgeit:8080/",
        "attributes": {
            "ARACHNI_DOM_DEPTH_LIMIT": 15,
            "ARACHNI_DIR_DEPTH_LIMIT": 5,
            "ARACHNI_PAGE_LIMIT": 50,
            "ARACHNI_EXCLUDE_PATTERNS": [
                ".*\\.png",
                ".*util\\.js",
                ".*style\\.css"
            ],
            "ARACHNI_SCAN_METHODS": "*"
        }
    }
]
```

This scan should finish in about a minute and should return a couple of findings.
