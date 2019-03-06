# SecureCodeBox API Documentation

> NOTE: This is just a static exported version of the swagger docs. If you got a running instance of the secureCodeBox engine we'd recommend to access the docs there. You can find them by under: `<<Engine_Address>>/swagger-ui.html`

<a name="overview"></a>

## Overview

This Document describes the public API of the SecureCodeBox. It's mostly used for scanners to retrieve scan jobs from the engine and send results to the engine.

### Version information

_Version_ : 1.0

### Contact information

_Contact_ : SecureCodeBox-Team

### License information

_License_ : Apache 2.0  
_License URL_ : https://github.com/secureCodeBox/engine/blob/master/LICENSE.txt  
_Terms of service_ : null

### URI scheme

_Host_ : localhost  
_BasePath_ : /

### Tags

- scan-job-resource : For scanner-wrappers to engine communication
- security-test-definition-resource : Lists available definitions of securityTests.
- security-test-resource : Manage securityTests.

### Consumes

- `application/json`

### Produces

- `application/json`

<a name="paths"></a>

## Paths

<a name="lockjobusingpost"></a>

### Lock a scan job for the given topic

```
POST /box/jobs/lock/{topic}/{scannerId}
```

#### Description

Returns a scan job for the given topic / capability, if there is one.

#### Parameters

| Type     | Name                         | Description                                                    | Schema        | Default                                  |
| -------- | ---------------------------- | -------------------------------------------------------------- | ------------- | ---------------------------------------- |
| **Path** | **scannerId** <br>_required_ | UUID identifying the scanner instance.                         | string (uuid) | `"29bf7fd3-8512-4d73-a28f-608e493cd726"` |
| **Path** | **topic** <br>_required_     | Topic name for the Process, be sure only to use: [A-Za-z0-9-_] | string        | `"nmap_portscan"`                        |

#### Responses

| HTTP Code | Description                                                                   | Schema                                  |
| --------- | ----------------------------------------------------------------------------- | --------------------------------------- |
| **200**   | Successful retrieval of the scan job                                          | [ScanConfiguration](#scanconfiguration) |
| **204**   | No scan job available                                                         | [ScanConfiguration](#scanconfiguration) |
| **400**   | Incomplete or inconsistent Request                                            | No Content                              |
| **401**   | Unauthenticated                                                               | No Content                              |
| **403**   | Unauthorized, the user is missing the required rights to perform this action. | No Content                              |
| **500**   | Unknown technical error occurred.                                             | No Content                              |

#### Tags

- scan-job-resource

#### Security

| Type      | Name                        |
| --------- | --------------------------- |
| **basic** | **[basicAuth](#basicauth)** |

#### Example HTTP request

##### Request path

```
/box/jobs/lock/nmap_portscan/29bf7fd3-8512-4d73-a28f-608e493cd726
```

#### Example HTTP response

##### Response 200

```json
{
  "jobId": "string",
  "targets": [
    {
      "attributes": {
        "NMAP_PARAMETER": "-Pn"
      },
      "location": "127.0.0.1",
      "name": "SecureCodeBox Demo Website"
    }
  ]
}
```

##### Response 204

```json
{
  "jobId": "string",
  "targets": [
    {
      "attributes": {
        "NMAP_PARAMETER": "-Pn"
      },
      "location": "127.0.0.1",
      "name": "SecureCodeBox Demo Website"
    }
  ]
}
```

<a name="failjobusingpost"></a>

### Send a scan failure for the previously locked job.

```
POST /box/jobs/{id}/failure
```

#### Parameters

| Type     | Name                      | Description      | Schema                      | Default                                  |
| -------- | ------------------------- | ---------------- | --------------------------- | ---------------------------------------- |
| **Path** | **id** <br>_required_     | UUID of the job. | string (uuid)               | `"29bf7fd3-8512-4d73-a28f-608e493cd726"` |
| **Body** | **result** <br>_required_ | result           | [ScanFailure](#scanfailure) |                                          |

#### Responses

| HTTP Code | Description                                                                   | Schema                            |
| --------- | ----------------------------------------------------------------------------- | --------------------------------- |
| **200**   | Successful delivery of the failure.                                           | [ResponseEntity](#responseentity) |
| **400**   | Incomplete or inconsistent Request                                            | No Content                        |
| **401**   | Unauthenticated                                                               | No Content                        |
| **403**   | Unauthorized, the user is missing the required rights to perform this action. | No Content                        |
| **404**   | Unable to find jobId                                                          | No Content                        |
| **500**   | Unknown technical error occurred.                                             | No Content                        |

#### Tags

- scan-job-resource

#### Security

| Type      | Name                        |
| --------- | --------------------------- |
| **basic** | **[basicAuth](#basicauth)** |

#### Example HTTP request

##### Request path

```
/box/jobs/29bf7fd3-8512-4d73-a28f-608e493cd726/failure
```

##### Request body

```json
{
  "errorDetails": "It was not possible to resolve a DNS entry!",
  "errorMessage": "The host down.securecodebox.io is nor reachable!",
  "scannerId": "5dd0840c-81ae-4fed-90b5-b3eea3d4c701"
}
```

#### Example HTTP response

##### Response 200

```json
{
  "body": "object",
  "statusCode": "string",
  "statusCodeValue": 0
}
```

<a name="completejobusingpost"></a>

### Send a scan result for the previously locked job.

```
POST /box/jobs/{id}/result
```

#### Parameters

| Type     | Name                      | Description      | Schema                    | Default                                  |
| -------- | ------------------------- | ---------------- | ------------------------- | ---------------------------------------- |
| **Path** | **id** <br>_required_     | UUID of the job. | string (uuid)             | `"29bf7fd3-8512-4d73-a28f-608e493cd726"` |
| **Body** | **result** <br>_required_ | result           | [ScanResult](#scanresult) |                                          |

#### Responses

| HTTP Code | Description                                                                   | Schema                            |
| --------- | ----------------------------------------------------------------------------- | --------------------------------- |
| **200**   | Successful delivery of the result.                                            | [ResponseEntity](#responseentity) |
| **400**   | Incomplete or inconsistent Request                                            | No Content                        |
| **401**   | Unauthenticated                                                               | No Content                        |
| **403**   | Unauthorized, the user is missing the required rights to perform this action. | No Content                        |
| **404**   | Unable to find jobId                                                          | No Content                        |
| **500**   | Unknown technical error occurred.                                             | No Content                        |

#### Tags

- scan-job-resource

#### Security

| Type      | Name                        |
| --------- | --------------------------- |
| **basic** | **[basicAuth](#basicauth)** |

#### Example HTTP request

##### Request path

```
/box/jobs/29bf7fd3-8512-4d73-a28f-608e493cd726/result
```

##### Request body

```json
{
  "findings": [
    {
      "attributes": {
        "NMAP_PORT": 34,
        "NMAP_IP": "162.222.1.3"
      },
      "category": "Infrastructure",
      "description": "The DNS Port is open.",
      "false_positive": false,
      "hint": "SQL-Injection: Please think about using prepared statements.",
      "id": "3dd4840c-81ae-4fed-90b5-b3eea3d4c701",
      "location": "tcp://162.222.1.3:53",
      "name": "Open Port",
      "osi_layer": "NETWORK",
      "reference": {
        "id": "CVE-2017-15707",
        "source": "https://www.cvedetails.com/cve/CVE-2017-15707/"
      },
      "severity": "HIGH"
    }
  ],
  "rawFindings": "string",
  "scannerId": "5dd0840c-81ae-4fed-90b5-b3eea3d4c701",
  "scannerType": "nmap"
}
```

#### Example HTTP response

##### Response 200

```json
{
  "body": "object",
  "statusCode": "string",
  "statusCodeValue": 0
}
```

<a name="startsecuritytestsusingput"></a>

### Starts new securityTests.

```
PUT /box/securityTests
```

#### Description

Starts new securityTests, based on a given list of securityTest configurations.

#### Parameters

| Type     | Name                             | Description                                             | Schema                                                            |
| -------- | -------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| **Body** | **securityTests** <br>_required_ | A list with all securityTest which should be performed. | < [SecurityTestConfiguration](#securitytestconfiguration) > array |

#### Responses

| HTTP Code | Description                                                                                          | Schema                  |
| --------- | ---------------------------------------------------------------------------------------------------- | ----------------------- |
| **200**   | OK                                                                                                   | < string (uuid) > array |
| **201**   | Successful created a new securityTest returns the process id.                                        | < string (uuid) > array |
| **300**   | For some reason multiple securityTest definitions could be addressed by the given securityTest name. | No Content              |
| **400**   | Incomplete or inconsistent Request.                                                                  | No Content              |
| **401**   | Unauthenticated                                                                                      | No Content              |
| **403**   | Unauthorized, the user is missing the required rights to perform this action.                        | No Content              |
| **404**   | Could not find definition for specified securityTest.                                                | No Content              |
| **500**   | Unknown technical error occurred.                                                                    | No Content              |

#### Tags

- security-test-resource

#### Security

| Type      | Name                        |
| --------- | --------------------------- |
| **basic** | **[basicAuth](#basicauth)** |

#### Example HTTP request

##### Request path

```
/box/securityTests
```

##### Request body

```json
[
  {
    "context": "Feature Team 1",
    "metaData": {
      "string": "string"
    },
    "name": "nmap",
    "target": {
      "attributes": {
        "NMAP_PARAMETER": "-Pn"
      },
      "location": "127.0.0.1",
      "name": "SecureCodeBox Demo Website"
    }
  }
]
```

#### Example HTTP response

##### Response 200

```json
["string"]
```

##### Response 201

```json
["string"]
```

<a name="getsecuritytestdefinitionsusingget"></a>

### Lists all available securityTest definitions.

```
GET /box/securityTests/definitions
```

#### Responses

| HTTP Code | Description                                                                   | Schema                  |
| --------- | ----------------------------------------------------------------------------- | ----------------------- |
| **200**   | Successfully listed all available securityTest definitions.                   | < string (uuid) > array |
| **401**   | Unauthenticated                                                               | No Content              |
| **403**   | Unauthorized, the user is missing the required rights to perform this action. | No Content              |
| **500**   | Unknown technical error occurred.                                             | No Content              |

#### Tags

- security-test-definition-resource

#### Security

| Type      | Name                        |
| --------- | --------------------------- |
| **basic** | **[basicAuth](#basicauth)** |

#### Example HTTP request

##### Request path

```
/box/securityTests/definitions
```

#### Example HTTP response

##### Response 200

```json
["string"]
```

<a name="getsecuritytestusingget"></a>

### Returns the state of a securityTests.

```
GET /box/securityTests/{id}
```

#### Description

Currently only supports finished securityTests.

#### Parameters

| Type     | Name                  | Description                                                       | Schema        |
| -------- | --------------------- | ----------------------------------------------------------------- | ------------- |
| **Path** | **id** <br>_required_ | UUID of the security-test for which the report should be fetched. | string (uuid) |

#### Responses

| HTTP Code | Description                                                                   | Schema                        |
| --------- | ----------------------------------------------------------------------------- | ----------------------------- |
| **200**   | Successful fetched the complete securityTest.                                 | [SecurityTest](#securitytest) |
| **206**   | Partial result as the SecurityTest hasn't finished yet.                       | [SecurityTest](#securitytest) |
| **400**   | Incomplete or inconsistent Request.                                           | No Content                    |
| **401**   | Unauthenticated                                                               | No Content                    |
| **403**   | Unauthorized, the user is missing the required rights to perform this action. | No Content                    |
| **404**   | Could not find definition for specified securityTest.                         | No Content                    |
| **500**   | Unknown technical error occurred.                                             | No Content                    |

#### Tags

- security-test-resource

#### Security

| Type      | Name                        |
| --------- | --------------------------- |
| **basic** | **[basicAuth](#basicauth)** |

#### Example HTTP request

##### Request path

```
/box/securityTests/string
```

#### Example HTTP response

##### Response 200

```json
{
  "context": "Feature Team 1",
  "finished": true,
  "id": "string",
  "metaData": {
    "string": "string"
  },
  "name": "nmap",
  "report": {
    "findings": [
      {
        "attributes": {
          "NMAP_PORT": 34,
          "NMAP_IP": "162.222.1.3"
        },
        "category": "Infrastructure",
        "description": "The DNS Port is open.",
        "false_positive": false,
        "hint": "SQL-Injection: Please think about using prepared statements.",
        "id": "3dd4840c-81ae-4fed-90b5-b3eea3d4c701",
        "location": "tcp://162.222.1.3:53",
        "name": "Open Port",
        "osi_layer": "NETWORK",
        "reference": {
          "id": "CVE-2017-15707",
          "source": "https://www.cvedetails.com/cve/CVE-2017-15707/"
        },
        "severity": "HIGH"
      }
    ],
    "raw_findings": "string",
    "report_id": "4e598d7c-5872-4aa0-8e01-770312a00847",
    "severity_highest": "HIGH",
    "severity_overview": {
      "INFORMATIONAL": 13
    }
  },
  "target": {
    "attributes": {
      "NMAP_PARAMETER": "-Pn"
    },
    "location": "127.0.0.1",
    "name": "SecureCodeBox Demo Website"
  }
}
```

##### Response 206

```json
{
  "context": "Feature Team 1",
  "finished": true,
  "id": "string",
  "metaData": {
    "string": "string"
  },
  "name": "nmap",
  "report": {
    "findings": [
      {
        "attributes": {
          "NMAP_PORT": 34,
          "NMAP_IP": "162.222.1.3"
        },
        "category": "Infrastructure",
        "description": "The DNS Port is open.",
        "false_positive": false,
        "hint": "SQL-Injection: Please think about using prepared statements.",
        "id": "3dd4840c-81ae-4fed-90b5-b3eea3d4c701",
        "location": "tcp://162.222.1.3:53",
        "name": "Open Port",
        "osi_layer": "NETWORK",
        "reference": {
          "id": "CVE-2017-15707",
          "source": "https://www.cvedetails.com/cve/CVE-2017-15707/"
        },
        "severity": "HIGH"
      }
    ],
    "raw_findings": "string",
    "report_id": "4e598d7c-5872-4aa0-8e01-770312a00847",
    "severity_highest": "HIGH",
    "severity_overview": {
      "INFORMATIONAL": 13
    }
  },
  "target": {
    "attributes": {
      "NMAP_PARAMETER": "-Pn"
    },
    "location": "127.0.0.1",
    "name": "SecureCodeBox Demo Website"
  }
}
```

<a name="definitions"></a>

## Definitions

<a name="finding"></a>

### Finding

This type represents findings found by a scanner.

| Name                              | Description                                                                                                                         | Schema                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **attributes** <br>_optional_     | Key value pairs of scanner specific values. <br>**Example** : `{<br> "NMAP_PORT" : 34,<br> "NMAP_IP" : "162.222.1.3"<br>}`          | object                                                                                             |
| **category** <br>_required_       | The category of this finding. <br>**Example** : `"Infrastructure"`                                                                  | string                                                                                             |
| **description** <br>_optional_    | The name of the finding. <br>**Example** : `"The DNS Port is open."`                                                                | string                                                                                             |
| **false_positive** <br>_optional_ | If the finding is a false positive. <br>**Example** : `false`                                                                       | boolean                                                                                            |
| **hint** <br>_optional_           | An additional solution hint for a finding found. <br>**Example** : `"SQL-Injection: Please think about using prepared statements."` | string                                                                                             |
| **id** <br>_required_             | The id of the finding. <br>**Example** : `"3dd4840c-81ae-4fed-90b5-b3eea3d4c701"`                                                   | string (uuid)                                                                                      |
| **location** <br>_required_       | The location of this finding. <br>**Example** : `"tcp://162.222.1.3:53"`                                                            | string                                                                                             |
| **name** <br>_required_           | The name of the finding. <br>**Example** : `"Open Port"`                                                                            | string                                                                                             |
| **osi_layer** <br>_optional_      | The osi layer of this finding. <br>**Example** : `"NETWORK"`                                                                        | enum (APPLICATION, PRESENTATION, SESSION, TRANSPORT, NETWORK, DATA_LINK, PHYSICAL, NOT_APPLICABLE) |
| **reference** <br>_optional_      | An additional external Reference. <br>**Example** : `"[reference](#reference)"`                                                     | [Reference](#reference)                                                                            |
| **severity** <br>_optional_       | The severity of this finding. <br>**Example** : `"HIGH"`                                                                            | enum (INFORMATIONAL, LOW, MEDIUM, HIGH)                                                            |

<a name="reference"></a>

### Reference

Reference to further details. This can be a reference to Common Vulnerabilities and Exposures, node security, owasp or other...

| Name                      | Description                                                                                        | Schema |
| ------------------------- | -------------------------------------------------------------------------------------------------- | ------ |
| **id** <br>_required_     | The id of this reverence. <br>**Example** : `"CVE-2017-15707"`                                     | string |
| **source** <br>_required_ | The source of this reverence. <br>**Example** : `"https://www.cvedetails.com/cve/CVE-2017-15707/"` | string |

<a name="report"></a>

### Report

| Name                                 | Description                                                                                                                       | Schema                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **findings** <br>_optional_          | **Example** : `[ "[finding](#finding)" ]`                                                                                         | < [Finding](#finding) > array           |
| **raw_findings** <br>_optional_      | **Example** : `"string"`                                                                                                          | string                                  |
| **report_id** <br>_optional_         | Id for the report. <br>**Example** : `"4e598d7c-5872-4aa0-8e01-770312a00847"`                                                     | string (uuid)                           |
| **severity_highest** <br>_optional_  | The most severe severity in the findings. <br>**Example** : `"HIGH"`                                                              | enum (INFORMATIONAL, LOW, MEDIUM, HIGH) |
| **severity_overview** <br>_optional_ | Gives an overview of the occurrences of different severities in the findings. <br>**Example** : `{<br> "INFORMATIONAL" : 13<br>}` | < string, integer (int64) > map         |

<a name="responseentity"></a>

### ResponseEntity

| Name                               | Description              | Schema                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **body** <br>_optional_            | **Example** : `"object"` | object                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **statusCode** <br>_optional_      | **Example** : `"string"` | enum (100 CONTINUE, 101 SWITCHING_PROTOCOLS, 102 PROCESSING, 103 CHECKPOINT, 200 OK, 201 CREATED, 202 ACCEPTED, 203 NON_AUTHORITATIVE_INFORMATION, 204 NO_CONTENT, 205 RESET_CONTENT, 206 PARTIAL_CONTENT, 207 MULTI_STATUS, 208 ALREADY_REPORTED, 226 IM_USED, 300 MULTIPLE_CHOICES, 301 MOVED_PERMANENTLY, 302 FOUND, 302 MOVED_TEMPORARILY, 303 SEE_OTHER, 304 NOT_MODIFIED, 305 USE_PROXY, 307 TEMPORARY_REDIRECT, 308 PERMANENT_REDIRECT, 400 BAD_REQUEST, 401 UNAUTHORIZED, 402 PAYMENT_REQUIRED, 403 FORBIDDEN, 404 NOT_FOUND, 405 METHOD_NOT_ALLOWED, 406 NOT_ACCEPTABLE, 407 PROXY_AUTHENTICATION_REQUIRED, 408 REQUEST_TIMEOUT, 409 CONFLICT, 410 GONE, 411 LENGTH_REQUIRED, 412 PRECONDITION_FAILED, 413 PAYLOAD_TOO_LARGE, 413 REQUEST_ENTITY_TOO_LARGE, 414 URI_TOO_LONG, 414 REQUEST_URI_TOO_LONG, 415 UNSUPPORTED_MEDIA_TYPE, 416 REQUESTED_RANGE_NOT_SATISFIABLE, 417 EXPECTATION_FAILED, 418 I_AM_A_TEAPOT, 419 INSUFFICIENT_SPACE_ON_RESOURCE, 420 METHOD_FAILURE, 421 DESTINATION_LOCKED, 422 UNPROCESSABLE_ENTITY, 423 LOCKED, 424 FAILED_DEPENDENCY, 426 UPGRADE_REQUIRED, 428 PRECONDITION_REQUIRED, 429 TOO_MANY_REQUESTS, 431 REQUEST_HEADER_FIELDS_TOO_LARGE, 451 UNAVAILABLE_FOR_LEGAL_REASONS, 500 INTERNAL_SERVER_ERROR, 501 NOT_IMPLEMENTED, 502 BAD_GATEWAY, 503 SERVICE_UNAVAILABLE, 504 GATEWAY_TIMEOUT, 505 HTTP_VERSION_NOT_SUPPORTED, 506 VARIANT_ALSO_NEGOTIATES, 507 INSUFFICIENT_STORAGE, 508 LOOP_DETECTED, 509 BANDWIDTH_LIMIT_EXCEEDED, 510 NOT_EXTENDED, 511 NETWORK_AUTHENTICATION_REQUIRED) |
| **statusCodeValue** <br>_optional_ | **Example** : `0`        | integer (int32)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

<a name="scanconfiguration"></a>

### ScanConfiguration

| Name                       | Description                             | Schema                      |
| -------------------------- | --------------------------------------- | --------------------------- |
| **jobId** <br>_required_   | **Example** : `"string"`                | string (uuid)               |
| **targets** <br>_optional_ | **Example** : `[ "[target](#target)" ]` | < [Target](#target) > array |

<a name="scanfailure"></a>

### ScanFailure

The failure result of an external scan.

| Name                            | Description                                                                                                                          | Schema        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| **errorDetails** <br>_optional_ | Provide more details, if there are any, why this failure happened. <br>**Example** : `"It was not possible to resolve a DNS entry!"` | string        |
| **errorMessage** <br>_optional_ | Short error message why this failure happened. <br>**Example** : `"The host down.securecodebox.io is nor reachable!"`                | string        |
| **scannerId** <br>_required_    | The id of the external scanner, which provides this failure. <br>**Example** : `"5dd0840c-81ae-4fed-90b5-b3eea3d4c701"`              | string (uuid) |

<a name="scanresult"></a>

### ScanResult

The result of an external scan.

| Name                           | Description                                                                                                            | Schema                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **findings** <br>_optional_    | The prepared findings of an external scan result. <br>**Example** : `[ "[finding](#finding)" ]`                        | < [Finding](#finding) > array |
| **rawFindings** <br>_optional_ | The raw findings provided by the scanner. This can be nearly everything. <br>**Example** : `"string"`                  | string                        |
| **scannerId** <br>_required_   | The id of the external scanner, which provides this result. <br>**Example** : `"5dd0840c-81ae-4fed-90b5-b3eea3d4c701"` | string (uuid)                 |
| **scannerType** <br>_required_ | The type of the external scanner, which provides this result. <br>**Example** : `"nmap"`                               | string                        |

<a name="securitytest"></a>

### SecurityTest

| Name                        | Description                                                                                                                                                                | Schema                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **context** <br>_optional_  | Context references the larger scope the security test. In most cases this is equal to the name of the project, team name or a domain. <br>**Example** : `"Feature Team 1"` | string                 |
| **finished** <br>_optional_ | Indicates weather the process was completed. <br>**Example** : `true`                                                                                                      | boolean                |
| **id** <br>_optional_       | **Example** : `"string"`                                                                                                                                                   | string (uuid)          |
| **metaData** <br>_optional_ | **Example** : `{<br> "string" : "string"<br>}`                                                                                                                             | < string, string > map |
| **name** <br>_optional_     | The Name of the security test to perform on the target. <br>**Example** : `"nmap"`                                                                                         | string                 |
| **report** <br>_optional_   | **Example** : `"[report](#report)"`                                                                                                                                        | [Report](#report)      |
| **target** <br>_optional_   | The target configuration of the security test. <br>**Example** : `"[target](#target)"`                                                                                     | [Target](#target)      |

<a name="securitytestconfiguration"></a>

### SecurityTestConfiguration

| Name                        | Description                                                                                                                                                                | Schema                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **context** <br>_optional_  | Context references the larger scope the security test. In most cases this is equal to the name of the project, team name or a domain. <br>**Example** : `"Feature Team 1"` | string                 |
| **metaData** <br>_optional_ | **Example** : `{<br> "string" : "string"<br>}`                                                                                                                             | < string, string > map |
| **name** <br>_optional_     | The Name of the security test to perform on the target. <br>**Example** : `"nmap"`                                                                                         | string                 |
| **target** <br>_optional_   | The target configuration of the security test. <br>**Example** : `"[target](#target)"`                                                                                     | [Target](#target)      |

<a name="target"></a>

### Target

This type represents targets to scan by a scanner.

| Name                          | Description                                                                                                                                   | Schema |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **attributes** <br>_optional_ | Key (in upper case) / value pairs of target / scanner specific configuration options. <br>**Example** : `{<br> "NMAP_PARAMETER" : "-Pn"<br>}` | object |
| **location** <br>_required_   | The location of this target, this could be a URL, Hostname or IP-Address. <br>**Example** : `"127.0.0.1"`                                     | string |
| **name** <br>_required_       | The name of this target. <br>**Example** : `"SecureCodeBox Demo Website"`                                                                     | string |

<a name="securityscheme"></a>

## Security

<a name="basicauth"></a>

### basicAuth

_Type_ : basic
