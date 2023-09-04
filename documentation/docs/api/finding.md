---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Finding"
---

All scanners integrated in the secureCodeBox create a JSON-Array of Findings objects.
The 'findings.json' file that contains these Findings complies with the following JSON Schema (Draft-04).

```yaml
{
  "$schema": "http://json-schema.org/draft-04/schema",
  "type": "array",
  "description": "Array of Findings.",
  "items": {
    "$ref": "#/$defs/finding"
  },
  "$defs": {
    "finding": {
      "type": "object",
      "additionalProperties": true,
      "properties": {
        "id": {
          "description": "The unique identifier for a Finding according to RFC4122.",
          "type": "string",
          "format": "uuid"
        },
        "identified_at": {
          "description": "Date-Time when the Finding was exactly identified according to ISO8601. This information will often not be present.",
          "type": "string",
          "format": "date-time"
        },
        "parsed_at": {
          "description": "Date-Time when the Finding was parsed according to ISO8601. This information will always be present.",
          "type": "string",
          "format": "date-time"
        },
        "name": {
          "description": "Contains a short description of the Finding.",
          "type": "string"
        },
        "description": {
          "description": "In depth description, can span multiple paragraphs.",
          "type": "string",
          "nullable": true
        },
        "category": {
          "description": "Is often used to group finding based on their types.",
          "type": "string"
        },
        "severity": {
          "description": "Indicates the severity of the finding.",
          "type": "string",
          "enum": [
            "INFORMATIONAL",
            "LOW",
            "MEDIUM",
            "HIGH"
          ]
        },
        "mitigation": {
          "description": "Contains a short description of how to mitigate the issue.",
          "type": "string",
          "nullable": true
        },
        "references": {
          "nullable": true,
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "type": {
                "type": "string"
              },
              "value": {
                "type": "string"
              }
            },
            "required": ["type", "value"]
          }
        },
        "attributes": {
          "description": "Attributes are not standardized. They differ from Scanner to Scanner.",
          "type": "object"
        },
        "location": {
          "description": "Full URL with protocol, port, and path if existing.",
          "type": "string",
          "nullable": true
        }
      },
      "required": [
        "id",
        "parsed_at",
        "severity",
        "category",
        "name"
      ]
    }
  }
}
```

An example findings object is shown below:

```yaml
{
    "id": "eef8dd78-5079-4d1d-8a4c-68e3268c439c",
    "name": "Vulnerability in Dependency apk-tools (2.10.4-r3)",
    "description": "libfetch before 2021-07-26, as used in apk-tools, xbps, and other products, mishandles numeric strings for the FTP and HTTP protocols. The FTP passive mode implementation allows an out-of-bounds read because strtol is used to parse the relevant numbers into address bytes. It does not check if the line ends prematurely. If it does, the for-loop condition checks for the '\\0' terminator one byte too late.",
    "category": "Image Vulnerability",
    "location": "bkimminich/juice-shop:v10.2.0",
    "osi_layer": "NOT_APPLICABLE",
    "severity": "HIGH",
    "mitigation": "Update the affected package apk-tools to the fixed version: 2.10.7-r0 or remove the package from the image.",
    "references": [{
        "type": "CVE",
        "value": "CVE-2021-36159"
    },
    {
        "type": "URL",
        "value": "https://lists.apache.org/thread.html/rbf4ce74b0d1fa9810dec50ba3ace0caeea677af7c27a97111c06ccb7@%3Cusers.kafka.apache.org%3E"
    }]
    ,
    "attributes": {
        "installedVersion": "2.10.4-r3",
        "fixedVersion": "2.10.7-r0",
        "packageName": "apk-tools",
        "vulnerabilityId": "CVE-2021-36159",
        "foundIn": "bkimminich/juice-shop:v10.2.0 (alpine 3.11.5)"
    },
    "parsed_at": "2023-04-05T15:46:46.601Z"
}
```
