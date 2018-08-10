# Scanning Server Side Rendered Apps using OWASP Zap

Scanning for Vulnerabilities in BodgeIt using OWASP Zap and the secureCodeBox.

## Introduction

BodgeIt is a intentionally vulnarable web application written in JSPs with only very few usages of JavaScript.
This makes the app relativly straight forward to scan using pretty much any tool.

In this example we'll be using OWASP Zap controlled by the secureCodeBox to scan for vulnarabilties in the BodgeIt Store.

## Testing the setup

This is a straight forward configuration. Which should finish relativly quickly and tell us if we made misstakes in the setup and will confirm if the scanner is able to reach the target via the network.

### Start the scan via HTTP API

`PUT http://localhost:8080/box/processes/zap-process`

### Start the scan via CLI

`run_scanner.sh --payload payloadFile.json zap`

### Test Payload

```json
[
    {
        "name": "ZAP BodgeIt Scan",
        "location": "http://bodgeit:8080/bodgeit/",
        "attributes": {
            "ZAP_BASE_URL": "http://bodgeit:8080/bodgeit/",
            "ZAP_SPIDER_MAX_DEPTH": 1
        }
    }
]
```

This scan should finish in about a minute and should return a couple of findings.

## Full Scan

The following example contains a fully configured ZAP Scan for the BodgeIt Store. The scans uses Form based Authentication to archive a logged in state.

### Start the full scan via HTTP API

`PUT http://localhost:8080/box/processes/zap-process`

### Start the full scan via CLI

`run_scanner.sh --payload payloadFile.json`

### Full Payload

```json
[
    {
        "name": "Arachni BodgeIt Scan",
        "location": "http://bodgeit:8080/bodgeit/",
        "attributes": {
            "ZAP_BASE_URL": "http://bodgeit:8080/bodgeit/",
            "ZAP_AUTHENTICATION": true,
            "ZAP_LOGIN_SITE": "http://bodgeit:8080/bodgeit/login.jsp",
            "ZAP_LOGIN_USER": "test@thebodgeitstore.com",
            "ZAP_LOGIN_PW": "password",
            "ZAP_PW_FIELD_ID": "password",
            "ZAP_USERNAME_FIELD_ID": "username",
            "ZAP_LOGGED_IN_INDICATOR": "You have logged in successfully",
            "ZAP_SPIDER_MAX_DEPTH": 5
        }
    }
]
```

This scan should finish in about a minute and should return a couple of findings.
