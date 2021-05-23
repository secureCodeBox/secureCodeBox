// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { isMatch } = require("lodash");
const { getMessageCardByTemplate } = require("./msteams-template");

async function handle({
  getFindings,
  scan,
  webhookUrl = process.env["WEBHOOK_URL"],
  rules = process.env["RULES"] ? JSON.parse(process.env["RULES"]) : [],
  vulnMngmEnabled = process.env["VULNMANAG_ENABLED"],
  vulnMngmName = process.env["VULNMANAG_NAME"],
  vulnMngmDashboardUrl = process.env["VULNMANAG_DASHBOARD_URL"],
  vulnMngmDashboardFindingsUrl = process.env[
  "VULNMANAG_DASHBOARD_FINDINGS_URL"
  ],
  axios = require('axios')
}) {
  const findings = await getFindings();

  const vulnerabilityManagement = {
    enabled: vulnMngmEnabled,
    name: vulnMngmName,
    dashboardUrl: vulnMngmDashboardUrl,
    dashboardFindingsUrl: vulnMngmDashboardFindingsUrl,
  };

  // check if preconditions are met
  if (!webhookUrl) {
    throw new Error(
      "Couldn't send any message because there is no 'WEBHOOK_URL' defined!"
    );
  }

  if (isAnyRuleMatching(rules, findings)) {
    console.log(
      `Sending ${findings.length} findings to ${webhookUrl} with config: \n` +
      JSON.stringify(vulnerabilityManagement) +
      ` and rules: \n` + JSON.stringify(rules)
    );
    console.log(scan);

    const paylod = getMessageCardByTemplate(scan, vulnerabilityManagement);

    console.log(`With Payload:` + JSON.stringify(paylod));

    await axios.post(webhookUrl, paylod);
  } else {
    console.log(`No rules matched with the findings, nothing to do here.`);
  }
}

/**
 *
 * @param {*} rules
 * @param {*} findings
 */
function isAnyRuleMatching(rules, findings) {
  let hasMatched = false;

  if (Array.isArray(rules) && rules.length !== 0) {
    findings.map((finding) => {
      for (const rule of rules) {
        const isRuleMatching = rule.matches.anyOf.some((condition) =>
          isMatch(finding, condition)
        );
        if (isRuleMatching) {
          hasMatched = true;
        }
      }
    });
  } else {
    // empty rules should match always
    hasMatched = true;
  }

  return hasMatched;
}

module.exports.handle = handle;
module.exports.isAnyRuleMatching = isAnyRuleMatching;
