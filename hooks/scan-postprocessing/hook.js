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
const { isMatch, isEqual } = require("lodash")
async function handle({
  getFindings,
  updateFindings,
  rules = process.env["RULES"],
}) {
  const findings = await getFindings();
  const newFindings = applyRules(rules, findings);
  await updateFindings(newFindings);
}
module.exports.handle = handle;
/**
 * Goes thought the Findings and the Scan Postprocessing Rules
 * and applies the changes to the findings defined in the rules if matching
 */
function applyRules(rules, findings) {
  const newFindings = []
  findings.forEach(finding => {
    let processedFinding = {};
    Object.assign(processedFinding, finding);
    rules.forEach(rule => {
      const isRuleMatching = rule.matches.anyOf.some(condition => isMatch(processedFinding, condition));
      if (isRuleMatching) {
        processedFinding = postprocessingFindings(processedFinding, rule);
      }
    })
    if (notEqual(processedFinding, finding)) {
      newFindings.push(processedFinding);
    }
  });
  return newFindings
}

function postprocessingFindings(finding, rule) {
  const newFinding = Object.assign(finding, rule.override);
  return newFinding;
}

function notEqual(processedFinding, finding) {
  return !isEqual(processedFinding, finding)
}
