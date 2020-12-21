const axios = require("axios");
const NAMESPACE = process.env["NAMESPACE"];
const SCAN_NAME = process.env["SCAN_NAME"];

function severityCount(findings, severity) {
  return findings.filter(
    ({ severity: findingSeverity }) =>
      findingSeverity.toUpperCase() === severity
  ).length;
}

async function uploadFile(url, fileContents) {
  return axios
    .put(url, fileContents, {
      headers: { "content-type": "" },
    })
    .catch(function(error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(
          `File Upload Failed with Response Code: ${error.response.status}`
        );
        console.error(`Error Response Body: ${error.response.data}`);
      } else if (error.request) {
        console.error(
          "No response received from FileStorage when uploading finding"
        );
        console.error(error);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
      }
      process.exit(1);
    });
}

async function downloadFile(url) {
  return axios.get(url);
}

module.exports.severityCount = severityCount;
module.exports.uploadFile = uploadFile;
module.exports.downloadFile = downloadFile;
module.exports.NAMESPACE = NAMESPACE;
module.exports.SCAN_NAME = SCAN_NAME;
