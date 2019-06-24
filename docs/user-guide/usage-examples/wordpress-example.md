# Scanning Server Side Rendered Apps using wpscan

Scanning for Vulnerabilities in old-wordpress using wpscan and the secureCodeBox.

## Introduction

Old-wordpress uses an outdated Wordpress image (`wordpress/4.7.5-php7.1-fpm`).

In this example we'll be using wpscan controlled by the secureCodeBox to scan for vulnarabilties in the old-wordpress.

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
    "context": "old-wordpress example",
    "name": "wpscan",
    "target": {
      "name": "old-wordpress",
      "location": "http://old-wordpress:8000/"
    }
  }
]
```

This scan should finish in about two minutes and should return a couple of findings.

## Full Scan

The following example contains a fully configured Wordpress Scan for the old-wordpress.

### Start the scan via HTTP API

`PUT http://localhost:8080/box/securityTests`

### Start the scan via CLI

`run_scanner.sh --payload payloadFile.json arachni`

### Full Payload

```json
[
  {
    "context": "old-wordpress example",
    "name": "wpscan",
    "target": {
      "name": "old-wordpress",
      "location": "http://old-wordpress:8000/",
      "attributes": {
        "WP_STEALTHY": "true",
        "WP_ENUMERATE": "[Options]",
        "WP_MAX_DURATION": "[Seconds]",
        "WP_THROTTLE": "[Milliseconds]",
        "WP_REQUEST_TIMEOUT": "[Seconds]",
        "WP_DETECTION_MODE": "[Options]",
        "WP_USER_AGENT": "[userAgent]",
        "WP_HEADERS": "[headers]"
      }
    }
  }
]
```
Options for enumerate attribute:

```txt
Enumeration Process
Available Choices:
  vp  |  Vulnerable plugins
  ap  |  All plugins
  p   |  Plugins
  vt  |  Vulnerable themes
  at  |  All themes
  t   |  Themes
  tt  |  Timthumbs
  cb  |  Config backups
  dbe |  Db exports
  u   |  User IDs range. e.g: u1-5
         Range separator to use: '-'
         Value if no argument supplied: 1-10
  m   |  Media IDs range. e.g m1-15
         Note: Permalink setting must be set to "Plain" for those to be detected
         Range separator to use: '-'
         Value if no argument supplied: 1-100

Separator to use between the values: ','
Default: All Plugins, Config Backups
Value if no argument supplied: vp,vt,tt,cb,dbe,u,m
Incompatible choices (only one of each group/s can be used):
  - vp, ap, p
  - vt, at, t
```

This scan should finish in about two minutes and should return a couple of findings.