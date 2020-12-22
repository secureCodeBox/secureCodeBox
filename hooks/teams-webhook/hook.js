const axios = require("axios");

async function handle({
  getFindings,
  scan,
  webhookUrl = process.env["WEBHOOK_URL"],
  vulnMngmEnabled = process.env["VULNMANAG_ENABLED"],
  vulnMngmName = process.env["VULNMANAG_NAME"],
  vulnMngmDashboardUrl = process.env["VULNMANAG_DASHBOARD_URL"],
  vulnMngmDashboardFindingsUrl = process.env[
    "VULNMANAG_DASHBOARD_FINDINGS_URL"
  ],
}) {
  const findings = await getFindings();

  const vulnerabilityManagement = {
    enabled: vulnMngmEnabled,
    name: vulnMngmName,
    dashboardUrl: vulnMngmDashboardUrl,
    dashboardFindingsUrl: vulnMngmDashboardFindingsUrl,
  };

  if (webhookUrl) {
    console.log(
      `Sending ${findings.length} findings to ${webhookUrl} with config: ` +
        JSON.stringify(vulnerabilityManagement)
    );
    console.log(scan);

    const paylod = getMessageCardByTemplate(scan, vulnerabilityManagement);

    console.log(`With Payload:` + JSON.stringify(paylod));

    await axios.post(webhookUrl, { paylod, findings });
  } else {
    console.error(
      "Couldnt send any message because there is no 'WEBHOOK_URL' defined!"
    );
  }
}

/**
 * Returns a MS Teams WebHook Message Payload in the classic "MessageCard" style.
 * @param {*} scan
 * @param {*} vulnerabilityManagement
 */
function getMessageCardByTemplate(scan, vulnerabilityManagement) {
  let messageCard = null;

  messageCard = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    summary: `Scan ${scan.metadata.uid}`,
    themeColor: "0078D7",
    title: `New **'${scan.spec.scanType}'** security scan results are available!`,
    sections: [
      {
        activityTitle: `Scheduled scan: **'${scan.metadata.name}'**`,
        activitySubtitle: `Finished at ${scan.finishedAt}`,
        activityImage: "https://docs.securecodebox.io/img/Favicon.svg",
        startGroup: true,
        facts: getMessageCardFactsPayload(scan.status.findings.severities),
        text: "__Findings Severity Overview:__",
      },
      {
        facts: getMessageCardFactsPayload(scan.status.findings.categories),
        text: "__Findings Category Overview:__",
      },
    ],
    ...(vulnerabilityManagement.enabled === "true" &&
      getMessageCardActionPayload(vulnerabilityManagement)),
  };

  console.log("Post Payload: \n" + messageCard);

  return messageCard;
}

/**
 * Returns a MS Teams Webhook potentialAction message object, based on the given vulnerabilityManagement configuration data.
 * @param {*} vulnerabilityManagement A vulnerabilityManagement configuration object
 */
function getMessageCardActionPayload(vulnerabilityManagement) {
  const result = {
    potentialAction: [
      {
        "@type": "OpenUri",
        name: `Open ${vulnerabilityManagement.name}`,
        targets: [
          {
            os: "default",
            uri: `${vulnerabilityManagement.dashboardUrl}`,
          },
        ],
      },
      {
        "@type": "OpenUri",
        name: `Show Results in ${vulnerabilityManagement.name}`,
        targets: [
          {
            os: "default",
            uri: `${vulnerabilityManagement.dashboardFindingsUrl}`,
          },
        ],
      },
    ],
  };

  return result;
}

/**
 * Returns a MS Teams Webhook facts message object, based on the given facts data.
 * @param {*} scanData The scan data as array
 */
function getMessageCardFactsPayload(scanData) {
  const result = [];
  for (var key in scanData) {
    // Wonder why this call? https://dev.to/aman_singh/what-s-the-deal-with-object-prototype-hasownproperty-call-4mbj
    if (Object.prototype.hasOwnProperty.call(scanData, key)) {
      // console.log(key + " -> " + facts[key]);
      result.push({
        name: `${key}`,
        value: `${scanData[key]}`,
      });
    }
  }

  return result;
}

module.exports.handle = handle;
module.exports.axios = axios;
