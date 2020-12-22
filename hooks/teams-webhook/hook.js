const axios = require("axios");

async function handle({
  getFindings,
  scan,
  webhookUrl = process.env["WEBHOOK_URL"],
  vulnMngmEnabled = process.env["VULNMANAG_ENABLED"],
  vulnMngmName = process.env["VULNMANAG_NAME"],
  vulnMngmDashboardUrl = process.env["VULNMANAG_DASHBOARD_URL"],
  vulnMngmDashboardFindingsUrl = process.env["VULNMANAG_DASHBOARD_FINDINGS_URL"],
}) {
  const findings = await getFindings();

  const vulnerabilityManagement = {
    enabled: vulnMngmEnabled,
    name: vulnMngmName,
    dashboardUrl: vulnMngmDashboardUrl,
    dashboardFindingsUrl: vulnMngmDashboardFindingsUrl
  };

  console.log(`Sending ${findings.length} findings to ${webhookUrl} with config: ` + JSON.stringify(vulnerabilityManagement));
  console.log(scan);

  const paylod = getMessageCardByTemplate(scan, vulnerabilityManagement);
  console.log(JSON.stringify(paylod));

  await axios.post(webhookUrl, { paylod, findings });
}

/**
 * Returns a MS Teams WebHook Payload in the classic "MessageCard" style.
 * @param {*} scan 
 */
function getMessageCardByTemplate(scan, vulnerabilityManagement) {
  let messageCard = null;

  if (vulnerabilityManagement.enabled === "true") {
    messageCard = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": `Scan ${scan.metadata.uid}`,
      "themeColor": "0078D7",
      "title": "New security scan results (Type: {{scanType}}) are available!",
      "sections": [
        {
          "activityTitle": `Scheduled scan: **'${scan.metadata.name}'**`,
          "activitySubtitle": `Finished at ${scan.finishedAt}`,
          "activityImage": "https://docs.securecodebox.io/img/Favicon.svg",
          "startGroup": true,
          "facts": getMessageCardFacts(scan.status.findings.severities),
          "text": "__Findings Severity Overview:__"
        },
        {
          "facts": getMessageCardFacts(scan.status.findings.categories),
          "text": "__Findings Category Overview:__"
        }
      ],
      "potentialAction": [
        {
          "@type": "OpenUri",
          "name": `Open ${vulnerabilityManagement.name}`,
          "targets": [
            {
              "os": "default",
              "uri": `${vulnerabilityManagement.dashboardUrl}`
            }
          ]
        },
        {
          "@type": "OpenUri",
          "name": `Show Results in ${vulnerabilityManagement.name}`,
          "targets": [
            {
              "os": "default",
              "uri": `${vulnerabilityManagement.dashboardFindingsUrl}`
            }
          ]
        }
      ]
    };

  } else {
    messageCard = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": `Scan ${scan.metadata.uid}`,
      "themeColor": "0078D7",
      "title": "New security scan results (Type: {{scanType}}) are available!",
      "sections": [
        {
          "activityTitle": `Scheduled scan: **'${scan.metadata.name}'**`,
          "activitySubtitle": `Finished at ${scan.finishedAt}`,
          "activityImage": "https://docs.securecodebox.io/img/Favicon.svg",
          "startGroup": true,
          "facts": getMessageCardFacts(scan.status.findings.severities),
          "text": "__Findings Severity Overview:__"
        },
        {
          "facts": getMessageCardFacts(scan.status.findings.categories),
          "text": "__Findings Category Overview:__"
        }
      ]
    };
  }

  console.log("Post Payload: \n" + messageCard);

  return messageCard;
}

function getMessageCardFacts(facts) {
  const result = [];
  for (var key in facts) {
    // Wonder why this call? https://dev.to/aman_singh/what-s-the-deal-with-object-prototype-hasownproperty-call-4mbj
    if (Object.prototype.hasOwnProperty.call(facts, key)) {
      // console.log(key + " -> " + facts[key]);
      result.push({
        "name": `${key}`,
        "value": `${facts[key]}`
      });
    }
  }

  return result;
}

module.exports.handle = handle;
module.exports.axios = axios;
