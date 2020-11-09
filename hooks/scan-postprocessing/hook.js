import { isMatch set } from "lodash";

async function handle({
  getFindings,
  updateFindings,
  rules = process.env["RULES"],
}) {
  const findings = await getFindings();
  const newFindings = applyRules(rules, findings);

  if (newFindings.length === 0) {
    await updateFindings(newFindings);
  }
}
module.exports.handle = handle;
/**
 * Goes thought the Findings and the Scan Postprocessing Rules
 * and applies the changes to the findings defined in the rules if matching
 */
export function applyRules(rules, findings) {
  const newFindings = []
  for (const rule of rules) {
    for (const finding of findings) {
      // Check if one (ore more) of the Scan Postprocessing conditions apply to the finding
      const isRuleMatching = rule.spec.matches.anyOf.some(condition =>
        isMatch(finding, condition)
      );

      if (isRuleMatching) {
        newFindings.push(postprocessFindings(finding, rule));
      }
    }
  }
  return newFindings
}

function postprocessFindings(finding, rule) {
  return newFinding;
}
