// SPDX-FileCopyrightText: 2022 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

// Fixed settings for the script
const monitorApiVersion = "2016-04-01";

async function handle({
  getFindings,
  scan,
  workspaceId = process.env["MONITOR_WORKSPACE_ID"],
  sharedKey = process.env["MONITOR_SHARED_KEY"],
  logTypePrefix = process.env["MONITOR_LOGTYPE_PREFIX"],
  processingDate = new Date().toUTCString(),
  crypto = require("crypto"),
  fetch = require("node-fetch"),
}) {
  if (!(workspaceId && sharedKey)) {
    console.error(
      "Missing Workspace ID or shared key. Please provide them in the MONITOR_WORKSPACE_ID and MONITOR_SHARED_KEY environment variables"
    );
    process.exit(1);
  }

  const findings = await getFindings();

  if (findings.length < 1) {
    console.log("No findings, nothing to do.");
    return;
  }
  console.log(`Persisting ${findings.length} findings to Azure Monitor`);

  // Add metadata to finding: Scan ID, name, scan type, parameters and labels and convert the result to a string
  const processedFindings = JSON.stringify(
    findings.map((value) => ({
      ...value,
      scan_id: scan.metadata.uid,
      scan_name: scan.metadata.name,
      scan_type: scan.spec.scanType,
      scan_parameters: scan.spec.parameters,
      scan_labels: scan.metadata.labels || {},
    }))
  );

  // Derive the LogType from the logTypePrefix and the scan type.
  // Final name will be something like SCB_nmap
  const logType = logTypePrefix + "_" + scan.spec.scanType;

  // TODO: Currently, we do not validate the size limitations of the API. They are:
  // - 30 MB per POST
  // - 32 KB per Field value
  // - 50 Characters per Column name
  // The consequences for not respecting the field value and column name size limitations are truncation of the data.
  // Too large POST requests will likely be rejected by the system with a HTTP error (not explicitly specified in docs).
  // See https://docs.microsoft.com/en-us/azure/azure-monitor/logs/data-collector-api#data-limits

  // Start building the headers.
  // This code is loosely based on the Azure-Log-Analytics-Node-Function by sportsmgmt-labs, licensed under the MIT license.
  // Source: https://github.com/sportsmgmt-labs/Azure-Log-Analytics-Node-Function
  // It also incorporates parts of the azure-log-analytics-data-collector-client by sxwei123, licensed under the MIT license.
  // Source: https://github.com/sxwei123/azure-log-analytics-data-collector-client

  // Calculate content length
  const contentLength = Buffer.byteLength(processedFindings, "utf8");
  // Create the headers that we will need to authenticate
  const headersToAuthenticate =
    "POST\n" +
    contentLength +
    "\napplication/json\nx-ms-date:" +
    processingDate +
    "\n/api/logs";
  // Calculate the HMAC authenticator header
  const signature = crypto
    .createHmac("sha256", Buffer.from(sharedKey, "base64"))
    .update(headersToAuthenticate, "utf-8")
    .digest("base64");

  // Create the header in the correct form
  const auth = "SharedKey " + workspaceId + ":" + signature;
  // Create the header dictionary
  const headers = {
    "content-type": "application/json",
    Authorization: auth,
    "Log-Type": logType,
    "x-ms-date": processingDate,
  };

  // Generate API URL
  const apiUrl =
    "https://" +
    workspaceId +
    ".ods.opinsights.azure.com/api/logs?api-version=" +
    monitorApiVersion;

  // Send the request, handle the response
  fetch(apiUrl, { method: "POST", body: processedFindings, headers }).then(
    (response) => {
      if (response.status == 200) {
        console.log(`Data successfully sent to Azure Monitor.`);
        return;
      }
      const { Error: errorCode, Message: errorMsg } = response.json();
      console.error(
        `An error occurred. Status Code: ${response.status}, status text: ${response.statusText}, Error: ${errorCode}, ErrorMsg: ${errorMsg}`
      );
    }
  );
}
module.exports.handle = handle;
