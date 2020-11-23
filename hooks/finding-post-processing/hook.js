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
const { isMatch, merge } = require("lodash")
async function handle({
  getFindings,
  updateFindings,
  rules =JSON.parse(process.env["RULES"]),
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
  const newFindings = findings.map(finding => {
    let newFinding;
    for (const rule of rules) {
      const isRuleMatching = rule.matches.anyOf.some(condition => isMatch(finding, condition));
      if (isRuleMatching) {
        hasChanged = true;
        newFinding = postProcessFinding(finding, rule);
      }
    }
    return newFinding;
  });
  return { hasChanged, findings: newFindings }
}

function postProcessFinding(finding, rule) {
  return merge(finding, rule.override);
}
