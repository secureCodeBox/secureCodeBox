const axios = require("axios");

async function handle({
  getFindings,
  scan,
  webhookUrl = process.env["WEBHOOK_URL"],
}) {
  const findings = await getFindings();

  console.log(`Sending ${findings.length} findings to ${webhookUrl}`);
  console.log(scan);
  console.log(findings);

  const paylod = getMessageCard(scan);

  await axios.post(webhookUrl, {paylod, findings });
}

/**
 * Returns a MS Teams WebHook Payload in the classic "MessageCard" style.
 * @param {*} scan 
 */
function getMessageCard(scan) {
  var result = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": "Scan " + scan.metadata.uid,
    "themeColor": "0078D7",
    "title": "New security scan "+ scan.spec.scanType +" results are available!",
    "sections": [
        {
            "activityTitle": "Scheduled scan: **'"+ scan.metadata.name +"'**",
            "activitySubtitle": "Finished at "+ scan.status.finishedAt,
            "activityImage": "https://raw.githubusercontent.com/secureCodeBox/securecodebox.github.io/gh-source/static/Favicon.png",
            "startGroup": true,
            "facts": [
                {
                    "name": "High:",
                    "value": ""+ scan.status.findings.severities.high +""
                },
                {
                    "name": "Medium:",
                    "value": ""+ scan.status.findings.severities.medium +""
                },
                {
                    "name": "Low:",
                    "value": ""+ scan.status.findings.severities.low +""
                },
                {
                    "name": "Informational",
                    "value": ""+ scan.status.findings.severities.informational +""
                }
            ],
            "text": "__Findings Severity Overview:__"
        },
        {
            "facts": [
                {
                    "name": "Open Ports:",
                    "value": "3"
                },
                {
                    "name": "Hosts:",
                    "value": "8"
                }
            ],
            "text": "__Findings Category Overview:__"
        }
    ],
    "potentialAction": [
        {
            "@type": "OpenUri",
            "name": "Open Dashboard",
            "targets": [
                {
                    "os": "default",
                    "uri": "https://your-dashboard.url/"
                }
            ]
        },
        {
            "@type": "OpenUri",
            "name": "Show Results in Dashboard",
            "targets": [
                {
                    "os": "default",
                    "uri": "https://your-dashboard.url/"
                }
            ]
        }
    ]
  }
  return result;
}

module.exports.handle = handle;
module.exports.axios = axios;
