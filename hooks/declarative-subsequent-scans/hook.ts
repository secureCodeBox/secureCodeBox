import { isMatch } from "lodash";
import * as Mustache from "mustache";
import * as k8s from "@kubernetes/client-node";

import {
  startSubsequentSecureCodeBoxScan,
  getCascadingRulesFromCluster,
} from "./scan-helpers";

interface Finding {
  name: string;
  location: string;
  category: string;
  severity: string;
  osi_layer: string;
  attributes: Map<string, string | number>;
}

interface CascadingRule {
  metadata: k8s.V1ObjectMeta;
  spec: CascadingRuleSpec;
}

interface CascadingRuleSpec {
  matches: Matches;
  scanSpec: ScanSpec;
}

interface Matches {
  anyOf: Array<Finding>;
}

interface Scan {
  metadata: k8s.V1ObjectMeta;
  spec: ScanSpec;
}

interface ScanSpec {
  scanType: string;
  parameters: Array<string>;
}

interface ExtendedScanSpec extends ScanSpec {
  // This is the name of the scan. Its not "really" part of the scan spec
  // But this makes the object smaller
  name: string;
}

interface HandleArgs {
  scan: Scan;
  getFindings: () => Array<Finding>;
}

export async function handle({ scan, getFindings }: HandleArgs) {
  const findings = await getFindings();
  const cascadingRules = await getCascadingRules();

  const cascadingScans = getCascadingScans(scan, findings, cascadingRules);

  for (const { name, scanType, parameters } of cascadingScans) {
    await startSubsequentSecureCodeBoxScan({
      name,
      parentScan: scan,
      scanType,
      parameters,
    });
  }
}

async function getCascadingRules(): Promise<Array<CascadingRule>> {
  // Explicit Cast to the proper Type
  return <Array<CascadingRule>>await getCascadingRulesFromCluster();
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

  for (const cascadingRule of cascadingRules) {
    for (const finding of findings) {
      // Check if one (ore more) of the CascadingRule matchers apply to the finding
      const matches = cascadingRule.spec.matches.anyOf.some((matchesRule) =>
        isMatch(finding, matchesRule)
      );

      if (matches) {
        const { scanType, parameters } = cascadingRule.spec.scanSpec;

        cascadingScans.push({
          name: generateCascadingScanName(parentScan, cascadingRule),
          scanType: Mustache.render(scanType, finding),
          parameters: parameters.map((parameter) =>
            Mustache.render(parameter, finding)
          ),
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
  if (namePrefix.startsWith(parentScan.spec.scanType)) {
    namePrefix = namePrefix.replace(
      parentScan.spec.scanType,
      cascadingRule.spec.scanSpec.scanType
    );
  }
  return `${namePrefix}-${cascadingRule.metadata.name}`;
}
