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

interface HandleArgs {
  scan: any;
  getFindings: () => Array<Finding>;
}

interface CascadingRules {
  metadata: k8s.V1ObjectMeta;
  spec: CascadingRuleSpec;
}

interface CascadingRuleSpec {
  matches: Array<Finding>;
  scanSpec: ScanSpec;
}

interface Scan {
  metadata: k8s.V1ObjectMeta;
  spec: ScanSpec;
}

interface ScanSpec {
  name: string;
  parameters: Array<string>;
}

export async function handle({ scan, getFindings }: HandleArgs) {
  const findings = await getFindings();
  const cascadingRules = await getCascadingRules();

  const cascadingScans = getCascadingScans(findings, cascadingRules);

  for (const { name, parameters } of cascadingScans) {
    await startSubsequentSecureCodeBoxScan({
      parentScan: scan,
      scanType: name,
      parameters,
    });
  }
}

async function getCascadingRules(): Promise<Array<CascadingRules>> {
  // Explicit Cast to the proper Type
  return <Array<CascadingRules>>await getCascadingRulesFromCluster();
}

/**
 * Goes thought the Findings and the CascadingRules
 * and returns a List of Scans which should be started based on both.
 */
export function getCascadingScans(
  findings: Array<Finding>,
  cascadingRules: Array<CascadingRules>
): Array<ScanSpec> {
  const cascadingScans: Array<ScanSpec> = [];

  for (const cascadingRule of cascadingRules) {
    for (const finding of findings) {
      const matches = cascadingRule.spec.matches.some((matchesRule) =>
        isMatch(finding, matchesRule)
      );

      if (matches) {
        const { name, parameters } = cascadingRule.spec.scanSpec;

        cascadingScans.push({
          name: Mustache.render(name, finding),
          parameters: parameters.map((parameter) =>
            Mustache.render(parameter, finding)
          ),
        });
      }
    }
  }

  return cascadingScans;
}
