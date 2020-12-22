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

const axios = require("axios");
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

  if (isAnyRuleMatching(rules, findings) ) {
    console.log(
      `Sending ${findings.length} findings to ${webhookUrl} with config: \n` +
        JSON.stringify(vulnerabilityManagement) +
        ` and rules: \n` + JSON.stringify(rules)
    );
    console.log(scan);

    const paylod = getMessageCardByTemplate(scan, vulnerabilityManagement);

    console.log(`With Payload:` + JSON.stringify(paylod));

    await axios.post(webhookUrl, { paylod, findings });
  } else {
    console.log(`No rulze matched with the findings, nothing to do here.`);
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
module.exports.axios = axios;
