// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

import { isMatch, isMatchWith, isString, mapValues, cloneDeep } from "lodash";
import { isMatch as wildcardIsMatch } from "matcher";
import * as Mustache from "mustache";

import {
  startSubsequentSecureCodeBoxScan,
  getCascadingRulesForScan,
  // types
  Scan,
  Finding,
  CascadingRule,
  getCascadedRuleForScan,
  purgeCascadedRuleFromScan,
  mergeInheritedMap,
  mergeInheritedArray,
  mergeInheritedSelector,
} from "./scan-helpers";

interface HandleArgs {
  scan: Scan;
  getFindings: () => Array<Finding>;
}

export async function handle({ scan, getFindings }: HandleArgs) {
  const findings = await getFindings();
  const cascadingRules = await getCascadingRules(scan);
  const cascadedRuleUsedForParentScan = await getCascadedRuleForScan(scan);

  const cascadingScans = getCascadingScans(scan, findings, cascadingRules, cascadedRuleUsedForParentScan);

  for (const cascadingScan of cascadingScans) {
    await startSubsequentSecureCodeBoxScan(cascadingScan);
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
  cascadingRules: Array<CascadingRule>,
  cascadedRuleUsedForParentScan: CascadingRule
): Array<Scan> {
  let cascadingScans: Array<Scan> = [];
  const cascadingRuleChain = getScanChain(parentScan);

  parentScan = purgeCascadedRuleFromScan(parentScan, cascadedRuleUsedForParentScan);

  for (const cascadingRule of cascadingRules) {
    // Check if the Same CascadingRule was already applied in the Cascading Chain
    // If it has already been used skip this rule as it could potentially lead to loops
    if (cascadingRuleChain.includes(cascadingRule.metadata.name)) {
      console.log(
        `Skipping Rule "${cascadingRule.metadata.name}" as it was already applied in this chain.`
      );
      continue;
    }

    cascadingScans = cascadingScans.concat(getScansMatchingRule(parentScan, findings, cascadingRule))
  }

  return cascadingScans;
}

export function getScanChain(parentScan: Scan) {
  // Get the current Scan Chain (meaning which CascadingRules were used to start this scan and its parents) and convert it to a set, which makes it easier to query.
  if (
    parentScan.metadata.annotations &&
    parentScan.metadata.annotations["cascading.securecodebox.io/chain"]
  ) {
    return parentScan.metadata.annotations[
      "cascading.securecodebox.io/chain"
    ].split(",");
  }
  return []
}

function getScansMatchingRule(parentScan: Scan, findings: Array<Finding>, cascadingRule: CascadingRule) {
  const cascadingScans: Array<Scan> = [];
  for (const finding of findings) {
    // Check if one (ore more) of the CascadingRule matchers apply to the finding
    const matches = cascadingRule.spec.matches.anyOf.some(matchesRule =>
      isMatch(finding, matchesRule) || isMatchWith(finding, matchesRule, wildcardMatcher)
    );

    if (matches) {
      cascadingScans.push(getCascadingScan(parentScan, finding, cascadingRule))
    }
  }
  return cascadingScans;
}

function getCascadingScan(
  parentScan: Scan,
  finding: Finding,
  cascadingRule: CascadingRule
) {
  // Make a deep copy of the original cascading rule so that we can template it again with different findings.
  cascadingRule = templateCascadingRule(parentScan, finding, cloneDeep(cascadingRule));

  let { scanType, parameters } = cascadingRule.spec.scanSpec;

  let { annotations, labels, env, volumes, volumeMounts, initContainers, hookSelector, affinity, tolerations } = mergeCascadingRuleWithScan(parentScan, cascadingRule);

  let cascadingChain = getScanChain(parentScan);

  return {
    apiVersion: "execution.securecodebox.io/v1",
    kind: "Scan",
    metadata: {
      generateName: `${generateCascadingScanName(parentScan, cascadingRule)}-`,
      labels,
      annotations: {
        ...annotations,
        "securecodebox.io/hook": "cascading-scans",
        "cascading.securecodebox.io/parent-scan": parentScan.metadata.name,
        "cascading.securecodebox.io/matched-finding": finding.id,
        "cascading.securecodebox.io/chain": [
          ...cascadingChain,
          cascadingRule.metadata.name
        ].join(","),
      },
      ownerReferences: [
        {
          apiVersion: "execution.securecodebox.io/v1",
          blockOwnerDeletion: true,
          controller: true,
          kind: "Scan",
          name: parentScan.metadata.name,
          uid: parentScan.metadata.uid
        }
      ]
    },
    spec: {
      hookSelector,
      scanType,
      parameters,
      cascades: parentScan.spec.cascades,
      env,
      volumes,
      volumeMounts,
      initContainers,
      tolerations,
      affinity,
    }
  };
}

function mergeCascadingRuleWithScan(
  scan: Scan,
  cascadingRule: CascadingRule
) {
  const { scanAnnotations, scanLabels } = cascadingRule.spec;
  let { env = [], volumes = [], volumeMounts = [], initContainers = [], hookSelector = {}, affinity, tolerations } = cascadingRule.spec.scanSpec;
  let { inheritAnnotations, inheritLabels, inheritEnv, inheritVolumes, inheritInitContainers, inheritHookSelector, inheritAffinity = true, inheritTolerations = true} = scan.spec.cascades;

  // We have to use a slightly complicated logic for inheriting / setting the tolerations and affinity to work around some
  // limitations in the operator. The goal is to avoid setting anything to an empty list [] or empty map {} if the keys are actually
  // missing in the specification, as this will lead to issues in the operator when pulling in default values from the templates of the
  // scanners. So, we are taking a bit more care to make sure that the value stays undefined (and thus nil in Go) unless someone explicitly
  // specified an empty list or map.
  let selectedTolerations = undefined;
  if (tolerations !== undefined) {
    selectedTolerations = mergeInheritedArray(scan.spec.tolerations, tolerations, inheritTolerations);
  } else if (inheritTolerations) {
    selectedTolerations = scan.spec.tolerations;
  }

  let selectedAffinity = undefined;
  if (affinity !== undefined) {
    selectedAffinity = affinity
  } else if (inheritAffinity) {
    selectedAffinity = scan.spec.affinity;
  }
  
  return {
    annotations: mergeInheritedMap(scan.metadata.annotations, scanAnnotations, inheritAnnotations),
    labels: mergeInheritedMap(scan.metadata.labels, scanLabels, inheritLabels),
    env: mergeInheritedArray(scan.spec.env, env, inheritEnv),
    volumes: mergeInheritedArray(scan.spec.volumes, volumes, inheritVolumes),
    volumeMounts: mergeInheritedArray(scan.spec.volumeMounts, volumeMounts, inheritVolumes),
    initContainers: mergeInheritedArray(scan.spec.initContainers, initContainers, inheritInitContainers),
    hookSelector: mergeInheritedSelector(scan.spec.hookSelector, hookSelector, inheritHookSelector),
    affinity: selectedAffinity,
    tolerations: selectedTolerations
  }
}

function templateCascadingRule(
  parentScan: Scan,
  finding: Finding,
  cascadingRule: CascadingRule
): CascadingRule {
  const templateArgs = {
    ...finding,
    ...parentScan,
    // Attribute "$" hold special non finding helper attributes
    $: {
      hostOrIP:
        finding.attributes["hostname"] || finding.attributes["ip_address"]
    }
  };

  const { scanSpec, scanAnnotations, scanLabels } = cascadingRule.spec;
  const { scanType, parameters, initContainers } = scanSpec;

  // Templating for scanType
  cascadingRule.spec.scanSpec.scanType =
    Mustache.render(scanType, templateArgs);
  // Templating for scan parameters
  cascadingRule.spec.scanSpec.parameters =
    parameters.map(parameter => Mustache.render(parameter, templateArgs))
  // Templating for environmental variables
  if (cascadingRule.spec.scanSpec.env !== undefined) {
    cascadingRule.spec.scanSpec.env.forEach(envvar => {
      // We only want to template literal envs that have a specified value.
      // If no value is set, we don't want to modify anything as it may break things for other types
      // of env variable definitions.
      if (envvar.value !== undefined) {
        envvar.value = Mustache.render(envvar.value, templateArgs)
      }
    });
  }
  // Templating inside initContainers
  cascadingRule.spec.scanSpec.initContainers = initContainers
  if (cascadingRule.spec.scanSpec.initContainers !== undefined) {
    cascadingRule.spec.scanSpec.initContainers.forEach(container => {
      // Templating for the command
      container.command = container.command.map(parameter => Mustache.render(parameter, templateArgs));
      // Templating for env variables, similar to above.
      if (container.env !== undefined) {
        container.env.forEach(envvar => {
          if (envvar.value !== undefined) {
            envvar.value = Mustache.render(envvar.value, templateArgs)
          }
        })
      }
    });
  }
  // Templating for scan annotations
  cascadingRule.spec.scanAnnotations =
    scanAnnotations === undefined ? {} :mapValues(scanAnnotations, value => Mustache.render(value, templateArgs))
  // Templating for scan labels
  cascadingRule.spec.scanLabels =
    scanLabels === undefined ? {} : mapValues(scanLabels, value => Mustache.render(value, templateArgs))

  return cascadingRule;
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
  if(isString(findingValue) && isString(matchesRuleValue)){
    try{
      return wildcardIsMatch(findingValue.toString(), matchesRuleValue.toString(), {caseSensitive: true});
      // return new RegExp('^' + new String(matchesRuleValue).replace(/\*/g, '.*') + '$').test(findingValue);
    } catch(error) {
      return false;
    }
  }
}
