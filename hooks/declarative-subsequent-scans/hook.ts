import { isMatch, isMatchWith, isString } from "lodash";
import * as Mustache from "mustache";

import {
  startSubsequentSecureCodeBoxScan,
  getCascadingRulesForScan,
  // types
  Scan,
  Finding,
  CascadingRule,
  ExtendedScanSpec
} from "./scan-helpers";

interface HandleArgs {
  scan: Scan;
  getFindings: () => Array<Finding>;
}

export async function handle({ scan, getFindings }: HandleArgs) {
  const findings = await getFindings();
  const cascadingRules = await getCascadingRules(scan);

  const cascadingScans = getCascadingScans(scan, findings, cascadingRules);

  for (const { name, scanType, parameters, generatedBy, env } of cascadingScans) {
    await startSubsequentSecureCodeBoxScan({
      name,
      parentScan: scan,
      generatedBy,
      scanType,
      parameters,
      env,
    });
  }
}

async function getCascadingRules(scan: Scan): Promise<Array<CascadingRule>> {
  // Explicit Cast to the proper Type
  return <Array<CascadingRule>>await getCascadingRulesForScan(scan);
}

/**
 * Goes thought the Findings and the CascadingRules
 * and returns a List of Scans which should be started based on both.
 */
export function getCascadingScans(
  parentScan: Scan,
  findings: Array<Finding>,
  cascadingRules: Array<CascadingRule>
): Array<ExtendedScanSpec> {
  const cascadingScans: Array<ExtendedScanSpec> = [];

  const cascadingRuleChain = new Set<string>();

  // Get the current Scan Chain (meaning which CascadingRules were used to start this scan and its parents) and convert it to a set, which makes it easier to query.
  if (
    parentScan.metadata.annotations &&
    parentScan.metadata.annotations["cascading.securecodebox.io/chain"]
  ) {
    const chainElements = parentScan.metadata.annotations[
      "cascading.securecodebox.io/chain"
    ].split(",");

    for (const element of chainElements) {
      cascadingRuleChain.add(element);
    }
  }

  for (const cascadingRule of cascadingRules) {
    // Check if the Same CascadingRule was already applied in the Cascading Chain
    // If it has already been used skip this rule as it could potentially lead to loops
    if (cascadingRuleChain.has(cascadingRule.metadata.name)) {
      console.log(
        `Skipping Rule "${cascadingRule.metadata.name}" as it was already applied in this chain.`
      );
      continue;
    }

    for (const finding of findings) {
      // Check if one (ore more) of the CascadingRule matchers apply to the finding
      const matches = cascadingRule.spec.matches.anyOf.some(matchesRule =>
        isMatch(finding, matchesRule) || isMatchWith(finding, matchesRule, wildcardMatcher)
      );

      if (matches) {
        const { scanType, parameters, env } = cascadingRule.spec.scanSpec;

        const templateArgs = {
          ...finding,
          // Attribute "$" hold special non finding helper attributes
          $: {
            hostOrIP:
              finding.attributes["hostname"] || finding.attributes["ip_address"]
          }
        };

        cascadingScans.push({
          name: generateCascadingScanName(parentScan, cascadingRule),
          scanType: Mustache.render(scanType, templateArgs),
          parameters: parameters.map(parameter =>
            Mustache.render(parameter, templateArgs)
          ),
          cascades: null,
          generatedBy: cascadingRule.metadata.name,
          env,
        });
      }
    }
  }

  return cascadingScans;
}

function generateCascadingScanName(
  parentScan: Scan,
  cascadingRule: CascadingRule
): string {
  let namePrefix = parentScan.metadata.name;

  // 🧙‍ If the Parent Scan start with its scanType we'll replace it with the ScanType of the CascadingScan
  // Otherwise scans like nmap-network would have cascading scans like nmap-network-nikto-http-12345 which would be confusing as it is not clear from the name anymore which scanType is actually used.
  if (namePrefix.startsWith(parentScan.spec.scanType)) {
    namePrefix = namePrefix.replace(
      parentScan.spec.scanType,
      cascadingRule.spec.scanSpec.scanType
    );
  }
  return `${namePrefix}-${cascadingRule.metadata.name}`;
}

function wildcardMatcher(
  findingValue: any,
  matchesRuleValue: any
) : boolean {
  if(isString(matchesRuleValue)){
    try{
      return new RegExp('^' + new String(matchesRuleValue).replace(/\*/g, '.*') + '$').test(findingValue);
    } catch(error) {
      return false;
    }
  }
}
