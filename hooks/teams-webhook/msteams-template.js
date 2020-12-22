/**
Copyright 2020 iteratec GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

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

module.exports.getMessageCardByTemplate = getMessageCardByTemplate;
