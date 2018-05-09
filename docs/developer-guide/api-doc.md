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
|**Path**|**topic**  <br>*optional*|Topic name for the Process, be shure only to use: [A-Za-z0-9-_]|string|`"nmap_portscan"`|


#### Responses

|HTTP Code|Description|Schema|
|---|---|---|
|**200**|Successful retrieval of the scan Job|[ScanConfiguration](#scanconfiguration)|
|**204**|No scanjob available|[ScanConfiguration](#scanconfiguration)|
|**400**|Incomplete or inconsistent Request|No Content|
|**500**|Unknown technical error occurred.|No Content|


#### Tags

* scan-job-resource


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


<a name="getprocessesusingput"></a>
### Creates a new scan process.
```
PUT /box/processes/{processKey}
```


#### Parameters

|Type|Name|Description|Schema|
|---|---|---|---|
|**Path**|**processKey**  <br>*required*|processKey|string|
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




<a name="definitions"></a>
## Definitions

<a name="finding"></a>
### Finding

|Name|Schema|
|---|---|
|**attributes**  <br>*optional*|object|
|**category**  <br>*optional*|string|
|**description**  <br>*optional*|string|
|**hint**  <br>*optional*|string|
|**id**  <br>*optional*|string (uuid)|
|**location**  <br>*optional*|string|
|**name**  <br>*optional*|string|
|**osi_layer**  <br>*optional*|enum (APPLICATION, PRESENTATION, SESSION, TRANSPORT, NETWORK, DATA_LINK, PHYSICAL, NOT_APPLICABLE)|
|**reference**  <br>*optional*|[Reference](#reference)|
|**severity**  <br>*optional*|enum (INFORMATIONAL, LOW, MEDIUM, HIGH)|


<a name="process"></a>
### Process

|Name|Schema|
|---|---|
|**id**  <br>*optional*|string|
|**key**  <br>*optional*|string|
|**name**  <br>*optional*|string|


<a name="reference"></a>
### Reference

|Name|Schema|
|---|---|
|**id**  <br>*optional*|string|
|**source**  <br>*optional*|string|


<a name="responseentity"></a>
### ResponseEntity

|Name|Schema|
|---|---|
|**body**  <br>*optional*|object|
|**statusCode**  <br>*optional*|enum (100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511)|
|**statusCodeValue**  <br>*optional*|integer (int32)|


<a name="scanconfiguration"></a>
### ScanConfiguration

|Name|Schema|
|---|---|
|**jobId**  <br>*required*|string (uuid)|
|**targets**  <br>*optional*|< [Target](#target) > array|


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
|**findings**  <br>*optional*|The prepared findings of an external scan result.|< [Finding](#finding) > array|
|**rawFindings**  <br>*optional*|The raw findings provided by the scanner. This can be nearly everything.|string|
|**scannerId**  <br>*required*|The id of the external scanner, which provides this result.  <br>**Example** : `"5dd0840c-81ae-4fed-90b5-b3eea3d4c701"`|string (uuid)|
|**scannerType**  <br>*required*|The type of the external scanner, which provides this result.  <br>**Example** : `"nmap"`|string|


<a name="target"></a>
### Target

|Name|Schema|
|---|---|
|**attributes**  <br>*optional*|object|
|**location**  <br>*optional*|string|
|**name**  <br>*optional*|string|





