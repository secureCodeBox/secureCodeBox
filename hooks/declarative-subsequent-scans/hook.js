const { startSubsequentSecureCodeBoxScan } = require("./scan-helpers");
const isMatch = require("lodash.ismatch");

async function handle({ scan, getFindings }) {
  const findings = await getFindings();
  const cascadingRules = await getCascadingRules();

  const cascadingScans = getCascadingScans(findings, cascadingRules);

  for (const { scanType, parameters } of cascadingScans) {
    await startSubsequentSecureCodeBoxScan({
      parentScan: scan,
      scanType,
      parameters,
    });
  }
}

async function getCascadingRules() {
  // Todo: Get all CascadingRules of the current Namespace via k8s api
  return [];
}

// Todo remove eslint disable
// eslint-disable-next-line no-unused-vars
function getCascadingScans(findings, cascadingRules) {
  const cascadingScans = [];

  for (const cascadingRule of cascadingRules) {
    for (const finding of findings) {
      const matches = cascadingRule.spec.matches.some((matchesRule) =>
        isMatch(finding, matchesRule)
      );

      if (matches) {
        // Todo templating
        cascadingScans.push(cascadingRule.spec.scanSpec);
      }
    }
  }

  return cascadingScans;
}

module.exports.getCascadingScans = getCascadingScans;
module.exports.handle = handle;
