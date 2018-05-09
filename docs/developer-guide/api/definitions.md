
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



