
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



