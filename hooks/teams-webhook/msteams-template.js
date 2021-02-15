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
 * @param {Object} scan The scan as object.
 * @param {Object} vulnerabilityManagement A vulnerabilityManagement configuration object.
 */
function getMessageCardByTemplate(scan, vulnerabilityManagement) {
  const messageCard = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    summary: `Scan ${scan.metadata.uid}`,
    themeColor: "0078D7",
    title: `New ${scan.spec.scanType} security scan results are available!`,
    sections: [
      {
        activityTitle: `Scan: **'${scan.metadata.name}'**`,
        activitySubtitle: `Created at ${scan.metadata.creationTimestamp}`,
        activityImage: "https://www.securecodebox.io/favicon.png",
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
      getMessageCardActionPayload(scan, vulnerabilityManagement)),
  };

  return messageCard;
}

/**
 * Returns a MS Teams Webhook potentialAction message object, based on the given vulnerabilityManagement configuration data.
 * @param {Object} vulnerabilityManagement A vulnerabilityManagement configuration object.
 */
function getMessageCardActionPayload(scan, vulnerabilityManagement) {
  if (vulnerabilityManagement && vulnerabilityManagement.dashboardUrl) {
    vulnerabilityManagement.dashboardUrl = vulnerabilityManagement.dashboardUrl.replace(
      "{{uid}}",
      scan.metadata.uid
    );
  }
  if (vulnerabilityManagement && vulnerabilityManagement.dashboardFindingsUrl) {
    vulnerabilityManagement.dashboardFindingsUrl = vulnerabilityManagement.dashboardFindingsUrl.replace(
      "{{uid}}",
      scan.metadata.uid
    );
  }

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
 * @param {Object} scanData The scan data as object.
 */
function getMessageCardFactsPayload(scanData) {
  return scanData != null
    ? Object.entries(scanData).map(([name, value]) => ({ name, value }))
    : [];
}

module.exports.getMessageCardByTemplate = getMessageCardByTemplate;
