# SecureCodeBox API Documentation


<a name="overview"></a>
## Overview
This Document describes the public API of the SecureCodeBox. It's mostly used for scanners to retrieve scan jobs from the engine and send results to the engine.


### Contact information
*Contact* : SecureCodeBox-Team


### License information
*License* : Apache 2.0  
*License URL* : https://github.com/secureCodeBox/engine/blob/master/LICENSE.txt  
*Terms of service* : null


### URI scheme
*Host* : localhost  
*BasePath* : /


### Tags

* scan-job-resource : Scan Jobs Resource
* scan-process-resource : Scan Process Resource


### Consumes

* `application/json`


### Produces

* `application/json`




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

|Type|Name|Description|Schema|Default|
|---|---|---|---|---|
|**Path**|**scannerId**  <br>*required*|UUID of the job.|string (uuid)|`"29bf7fd3-8512-4d73-a28f-608e493cd726"`|
|**Path**|**topic**  <br>*required*|Topic name for the Process, be shure only to use: [A-Za-z0-9-_]|string|`"nmap_portscan"`|


#### Responses

|HTTP Code|Description|Schema|
|---|---|---|
|**200**|Successful retrieval of the scan Job|[ScanConfiguration](#scanconfiguration)|
|**204**|No scanjob available|[ScanConfiguration](#scanconfiguration)|
|**400**|Incomplete or inconsistent Request|No Content|
|**500**|Unknown technical error occurred.|No Content|


#### Tags

* scan-job-resource


#### Example HTTP request

##### Request path
```
/box/jobs/lock/nmap_portscan/29bf7fd3-8512-4d73-a28f-608e493cd726
```


#### Example HTTP response

##### Response 200
```
json :
{
  "jobId" : "string",
  "targets" : [ {
    "attributes" : {
      "NMAP_START_PORT" : 34,
      "NMAP_IP" : "162.222.1.3",
      "NMAP_END_PORT" : 125
    },
    "location" : "162.222.1.3",
    "name" : "SecureCodeBox Demo Instance"
  } ]
}
```


##### Response 204
```
json :
{
  "jobId" : "string",
  "targets" : [ {
    "attributes" : {
      "NMAP_START_PORT" : 34,
      "NMAP_IP" : "162.222.1.3",
      "NMAP_END_PORT" : 125
    },
    "location" : "162.222.1.3",
    "name" : "SecureCodeBox Demo Instance"
  } ]
}
```


<a name="failjobusingpost"></a>
### Send a scan failure for the previously locked job.
```
POST /box/jobs/{id}/failure
```


#### Parameters

|Type|Name|Description|Schema|Default|
|---|---|---|---|---|
|**Path**|**id**  <br>*required*|UUID of the job.|string (uuid)|`"29bf7fd3-8512-4d73-a28f-608e493cd726"`|
|**Body**|**result**  <br>*required*|result|[ScanFailure](#scanfailure)||


#### Responses

|HTTP Code|Description|Schema|
|---|---|---|
|**200**|Successful delivery of the failure.|[ResponseEntity](#responseentity)|
|**400**|Incomplete or inconsistent Request|No Content|
|**500**|Unknown technical error occurred.|No Content|


#### Tags

* scan-job-resource


#### Example HTTP request

##### Request path
```
/box/jobs/29bf7fd3-8512-4d73-a28f-608e493cd726/failure
```


##### Request body
```
json :
{
  "errorDetails" : "It was not possible to resolve a DNS entry!",
  "errorMessage" : "The host down.securecodebox.io is nor reachable!",
  "scannerId" : "5dd0840c-81ae-4fed-90b5-b3eea3d4c701"
}
```


#### Example HTTP response

##### Response 200
```
json :
{
  "body" : "object",
  "statusCode" : "string",
  "statusCodeValue" : 0
}
```


<a name="completejobusingpost"></a>
### Send a scan result for the previously locked job.
```
POST /box/jobs/{id}/result
```


#### Parameters

|Type|Name|Description|Schema|Default|
|---|---|---|---|---|
|**Path**|**id**  <br>*required*|UUID of the job.|string (uuid)|`"29bf7fd3-8512-4d73-a28f-608e493cd726"`|
|**Body**|**result**  <br>*required*|result|[ScanResult](#scanresult)||


#### Responses

|HTTP Code|Description|Schema|
|---|---|---|
|**200**|Successful delivery of the result.|[ResponseEntity](#responseentity)|
|**400**|Incomplete or inconsistent Request|No Content|
|**500**|Unknown technical error occurred.|No Content|


#### Tags

* scan-job-resource


#### Example HTTP request

##### Request path
```
/box/jobs/29bf7fd3-8512-4d73-a28f-608e493cd726/result
```


##### Request body
```
json :
{
  "findings" : [ {
    "attributes" : {
      "NMAP_PORT" : 34,
      "NMAP_IP" : "162.222.1.3"
    },
    "category" : "Infrastructure",
    "description" : "The DNS Port is open.",
    "hint" : "SQL-Injection: Please think about using prepared statements.",
    "id" : "3dd4840c-81ae-4fed-90b5-b3eea3d4c701",
    "location" : "tcp://162.222.1.3:53",
    "name" : "Open Port",
    "osi_layer" : "NETWORK",
    "reference" : {
      "id" : "CVE-2017-15707",
      "source" : "https://www.cvedetails.com/cve/CVE-2017-15707/"
    },
    "severity" : "HIGH"
  } ],
  "rawFindings" : "string",
  "scannerId" : "5dd0840c-81ae-4fed-90b5-b3eea3d4c701",
  "scannerType" : "nmap"
}
```


#### Example HTTP response

##### Response 200
```
json :
{
  "body" : "object",
  "statusCode" : "string",
  "statusCodeValue" : 0
}
```


<a name="getprocessesusingget"></a>
### Returns all possible processes.
```
GET /box/processes/
```


#### Responses

|HTTP Code|Description|Schema|
|---|---|---|
|**200**|Returns a list of all available processes.|< [Process](#process) > array|
|**400**|Incomplete or inconsistent Request|No Content|
|**500**|Unknown technical error occurred.|No Content|


#### Tags

* scan-process-resource


#### Example HTTP request

##### Request path
```
/box/processes/
```


#### Example HTTP response

##### Response 200
```
json :
[ {
  "id" : "string",
  "key" : "string",
  "name" : "string"
} ]
```


<a name="getprocessesusingput"></a>
### Creates a new scan process.
```
PUT /box/processes/{processKey}
```


#### Parameters

|Type|Name|Description|Schema|
|---|---|---|---|
|**Path**|**processKey**  <br>*required*|The key of the process to be started. See GET /box/processes.|string|
|**Body**|**targets**  <br>*required*|targets|< [Target](#target) > array|


#### Responses

|HTTP Code|Description|Schema|
|---|---|---|
|**200**|OK|string (uuid)|
|**201**|Successful created a new process returns the process id.|string (uuid)|
|**300**|For some reason multiple processes could be adressed by the given processKey.|No Content|
|**400**|Incomplete or inconsistent Request|No Content|
|**500**|Unknown technical error occurred.|No Content|


#### Tags

* scan-process-resource


#### Example HTTP request

##### Request path
```
/box/processes/nmap-process
```


##### Request body
```
json :
[ {
  "attributes" : {
    "NMAP_START_PORT" : 34,
    "NMAP_IP" : "162.222.1.3",
    "NMAP_END_PORT" : 125
  },
  "location" : "162.222.1.3",
  "name" : "SecureCodeBox Demo Instance"
} ]
```


#### Example HTTP response

##### Response 200
```
json :
"string"
```


##### Response 201
```
json :
"string"
```




<a name="definitions"></a>
## Definitions

<a name="finding"></a>
### Finding
This type represents findings found by a scanner.


|Name|Description|Schema|
|---|---|---|
|**attributes**  <br>*optional*|Key value pairs of scanner specific values.  <br>**Example** : `{<br>  "NMAP_PORT" : 34,<br>  "NMAP_IP" : "162.222.1.3"<br>}`|object|
|**category**  <br>*required*|The category of this finding.  <br>**Example** : `"Infrastructure"`|string|
|**description**  <br>*optional*|The name of the finding.  <br>**Example** : `"The DNS Port is open."`|string|
|**hint**  <br>*optional*|An additional solution hint for a finding found.  <br>**Example** : `"SQL-Injection: Please think about using prepared statements."`|string|
|**id**  <br>*required*|The id of the finding.  <br>**Example** : `"3dd4840c-81ae-4fed-90b5-b3eea3d4c701"`|string (uuid)|
|**location**  <br>*required*|The location of this finding.  <br>**Example** : `"tcp://162.222.1.3:53"`|string|
|**name**  <br>*required*|The name of the finding.  <br>**Example** : `"Open Port"`|string|
|**osi_layer**  <br>*optional*|The osi layer of this finding.  <br>**Example** : `"NETWORK"`|enum (APPLICATION, PRESENTATION, SESSION, TRANSPORT, NETWORK, DATA_LINK, PHYSICAL, NOT_APPLICABLE)|
|**reference**  <br>*optional*|An additional external Reference.  <br>**Example** : `"[reference](#reference)"`|[Reference](#reference)|
|**severity**  <br>*optional*|The severity of this finding.  <br>**Example** : `"HIGH"`|enum (INFORMATIONAL, LOW, MEDIUM, HIGH)|


<a name="process"></a>
### Process
The representation of a camunda process.


|Name|Description|Schema|
|---|---|---|
|**id**  <br>*optional*|**Example** : `"string"`|string|
|**key**  <br>*optional*|**Example** : `"string"`|string|
|**name**  <br>*optional*|**Example** : `"string"`|string|


<a name="reference"></a>
### Reference
Reference to further details. This can be a reference to Common Vulnerabilities and Exposures, node security, owasp or other...


|Name|Description|Schema|
|---|---|---|
|**id**  <br>*required*|The id of this reverence.  <br>**Example** : `"CVE-2017-15707"`|string|
|**source**  <br>*required*|The source of this reverence.  <br>**Example** : `"https://www.cvedetails.com/cve/CVE-2017-15707/"`|string|


<a name="responseentity"></a>
### ResponseEntity

|Name|Description|Schema|
|---|---|---|
|**body**  <br>*optional*|**Example** : `"object"`|object|
|**statusCode**  <br>*optional*|**Example** : `"string"`|enum (100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511)|
|**statusCodeValue**  <br>*optional*|**Example** : `0`|integer (int32)|


<a name="scanconfiguration"></a>
### ScanConfiguration

|Name|Description|Schema|
|---|---|---|
|**jobId**  <br>*required*|**Example** : `"string"`|string (uuid)|
|**targets**  <br>*optional*|**Example** : `[ "[target](#target)" ]`|< [Target](#target) > array|


<a name="scanfailure"></a>
### ScanFailure
The failure result of an external scan.


|Name|Description|Schema|
|---|---|---|
|**errorDetails**  <br>*optional*|Provide more details, if there are any, why this failure happened.  <br>**Example** : `"It was not possible to resolve a DNS entry!"`|string|
|**errorMessage**  <br>*optional*|Short error message why this failure happened.  <br>**Example** : `"The host down.securecodebox.io is nor reachable!"`|string|
|**scannerId**  <br>*required*|The id of the external scanner, which provides this failure.  <br>**Example** : `"5dd0840c-81ae-4fed-90b5-b3eea3d4c701"`|string (uuid)|


<a name="scanresult"></a>
### ScanResult
The result of an external scan.


|Name|Description|Schema|
|---|---|---|
|**findings**  <br>*optional*|The prepared findings of an external scan result.  <br>**Example** : `[ "[finding](#finding)" ]`|< [Finding](#finding) > array|
|**rawFindings**  <br>*optional*|The raw findings provided by the scanner. This can be nearly everything.  <br>**Example** : `"string"`|string|
|**scannerId**  <br>*required*|The id of the external scanner, which provides this result.  <br>**Example** : `"5dd0840c-81ae-4fed-90b5-b3eea3d4c701"`|string (uuid)|
|**scannerType**  <br>*required*|The type of the external scanner, which provides this result.  <br>**Example** : `"nmap"`|string|


<a name="target"></a>
### Target
This type represents targets to scan by a scanner.


|Name|Description|Schema|
|---|---|---|
|**attributes**  <br>*optional*|Key value pairs of target / scanner specific values.  <br>**Example** : `{<br>  "NMAP_START_PORT" : 34,<br>  "NMAP_IP" : "162.222.1.3",<br>  "NMAP_END_PORT" : 125<br>}`|object|
|**location**  <br>*required*|The location of this target.  <br>**Example** : `"162.222.1.3"`|string|
|**name**  <br>*required*|The name of this target.  <br>**Example** : `"SecureCodeBox Demo Instance"`|string|





