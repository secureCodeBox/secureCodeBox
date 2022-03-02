// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const { isMatch, merge } = require("lodash");
async function handle({
  getFindings,
  updateFindings,
  rules = JSON.parse(process.env["RULES"]),
}) {
  const findings = await getFindings();
  const res = applyRules(rules, findings);
  if (res.hasChanged) {
    await updateFindings(res.findings);
  }
}
module.exports.handle = handle;
/**
 * Goes through the Findings and the Finding Post Processing Rules
 * and applies the changes to the findings defined in the rules if matching
 */
function applyRules(rules, findings) {
  let hasChanged = false;
  const newFindings = findings.map((finding) => {
    let newFinding = finding;
    for (const rule of rules) {
      const isRuleMatching = rule.matches.anyOf.some((condition) =>
        isMatch(finding, condition)
      );
      if (isRuleMatching) {
        hasChanged = true;
        newFinding = postProcessFinding(finding, rule);
      }
    }
    return newFinding;
  });
  return { hasChanged, findings: newFindings };
}

function postProcessFinding(finding, rule) {
  return merge(finding, rule.override);
}
