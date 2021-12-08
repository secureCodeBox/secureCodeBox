// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

import * as k8s from "@kubernetes/client-node";

import {
  generateSelectorString,
  LabelSelector
} from "./kubernetes-label-selector";
import {isEqual} from "lodash";
import {getScanChain} from "./hook";
import {ScopeLimiterRequirement} from "./scope-limiter";

// configure k8s client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApiCRD = kc.makeApiClient(k8s.CustomObjectsApi);

const namespace = process.env["NAMESPACE"];

export interface Finding {
  name: string;
  location: string;
  category: string;
  severity: string;
  osi_layer: string;
  attributes: Map<string, string | number>;
  id: string;
}

export interface CascadingRule {
  metadata: k8s.V1ObjectMeta;
  spec: CascadingRuleSpec;
}

export interface CascadingRuleSpec {
  matches: Matches;
  scanSpec: ScanSpec;
  scanLabels: {
    [key: string]: string;
  };
  scanAnnotations: {
    [key: string]: string;
  };
}

export interface Matches {
  anyOf: Array<Finding>;
}

export interface Scan {
  metadata: k8s.V1ObjectMeta;
  spec: ScanSpec;
  status?: ScanStatus;
}

export interface ScanSpec {
  scanType: string;
  parameters: Array<string>;
  cascades: LabelSelector & CascadingInheritance;
  env?: Array<k8s.V1EnvVar>;
  volumes?: Array<k8s.V1Volume>;
  volumeMounts?: Array<k8s.V1VolumeMount>;
  initContainers?: Array<k8s.V1Container>;
  hookSelector?: LabelSelector;
  tolerations?: Array<k8s.V1Toleration>;
  affinity?: k8s.V1Toleration;
}

export interface ScopeLimiter {
  validOnMissingRender: boolean,
  anyOf?: Array<ScopeLimiterRequirement>,
  allOf?: Array<ScopeLimiterRequirement>,
  noneOf?: Array<ScopeLimiterRequirement>,
}

export interface CascadingInheritance {
  scopeLimiter: ScopeLimiter,
  inheritLabels: boolean,
  inheritAnnotations: boolean,
  inheritEnv: boolean,
  inheritVolumes: boolean,
  inheritInitContainers: boolean,
  inheritHookSelector: boolean,
  inheritAffinity: boolean,
  inheritTolerations: boolean,
}

export interface ScanStatus {
  rawResultType: string,
}

export interface ParseDefinition {
  metadata: k8s.V1ObjectMeta;
  spec: ParseDefinitionSpec;
}

export interface ParseDefinitionSpec {
	scopeLimiterAliases: ScopeLimiterAliases,
}

export type ScopeLimiterAliases = { [key: string]: string; };

export function mergeInheritedMap(parentProps, ruleProps, inherit: boolean = true) {
  if (!inherit) {
    parentProps = {};
  }
  if (ruleProps === undefined) {
    return parentProps;
  }
  return {
    ...parentProps,
    ...ruleProps // ruleProps overwrites any duplicate keys from parentProps
  }
}

export function mergeInheritedArray(parentArray = [], ruleArray = [], inherit: boolean = false) {
  if (!inherit) {
    parentArray = [];
  }
  return (parentArray || []).concat(ruleArray)  // CascadingRule's env overwrites scan's env
}

export function mergeInheritedSelector(parentSelector: LabelSelector = {}, ruleSelector: LabelSelector = {}, inherit: boolean = false): LabelSelector {
  let labelSelector: LabelSelector = {};
  if (parentSelector.matchExpressions || ruleSelector.matchExpressions) {
    labelSelector.matchExpressions = mergeInheritedArray(parentSelector.matchExpressions, ruleSelector.matchExpressions, inherit);
  }
  if (parentSelector.matchLabels || ruleSelector.matchLabels) {
    labelSelector.matchLabels = mergeInheritedMap(parentSelector.matchLabels, ruleSelector.matchLabels, inherit);
  }
  return labelSelector
}

export async function startSubsequentSecureCodeBoxScan(scan: Scan) {
  console.log(`Starting Scan ${scan.metadata.name}`);

  try {
    // Submitting the Scan to the kubernetes api
    await k8sApiCRD.createNamespacedCustomObject(
      "execution.securecodebox.io",
      "v1",
      namespace,
      "scans",
      scan,
      "false"
    );
  } catch (error) {
    console.error(`Failed to start Scan ${scan.metadata.name}`);
    console.error(error);
  }
}

export async function getCascadingRulesForScan(scan: Scan) {
  if (scan.spec.cascades === undefined || scan.spec.cascades === null) {
    console.log("Skipping cascades as no selector was defined.");
    return [];
  }

  try {
    const labelSelector = generateSelectorString(scan.spec.cascades);

    console.log(
      `Fetching CascadingScans using LabelSelector: "${labelSelector}"`
    );

    const response: any = await k8sApiCRD.listNamespacedCustomObject(
      "cascading.securecodebox.io",
      "v1",
      namespace,
      "cascadingrules",
      undefined,
      undefined,
      undefined,
      labelSelector
    );

    console.log(`Fetched ${response.body.items.length} CascadingRules`);
    return response.body.items;
  } catch (err) {
    console.error("Failed to get CascadingRules from the kubernetes api");
    console.error(err);
    process.exit(1);
  }
}

export async function getParseDefinitionForScan(scan: Scan) {
  try {
    const response: any = await k8sApiCRD.getNamespacedCustomObject(
      "execution.securecodebox.io",
      "v1",
      namespace,
      "parsedefinitions",
      scan.status.rawResultType,
    );

    return response.body;
  } catch (err) {
    console.error(`Failed to get ParseDefinition ${scan.status.rawResultType} from the kubernetes api`);
    console.error(err);
    process.exit(1);
  }
}

// To ensure that the environment variables and volumes from the cascading rule are only applied to the matched scan
// (and not its children), this function purges the cascading rule spec from the parent scan when inheriting them.
export function purgeCascadedRuleFromScan(scan: Scan, cascadedRuleUsedForParentScan?: CascadingRule) : Scan {
  // If there was no cascading rule applied to the parent scan, then ignore no purging is necessary.
  if (cascadedRuleUsedForParentScan === undefined) return scan;

  if (scan.spec.env !== undefined && cascadedRuleUsedForParentScan.spec.scanSpec.env !== undefined) {
    scan.spec.env = scan.spec.env.filter(scanEnv =>
      !cascadedRuleUsedForParentScan.spec.scanSpec.env.some(ruleEnv => isEqual(scanEnv, ruleEnv))
    );
  }

  if (scan.spec.volumes !== undefined && cascadedRuleUsedForParentScan.spec.scanSpec.volumes !== undefined) {
    scan.spec.volumes = scan.spec.volumes.filter(scanVolume =>
      !cascadedRuleUsedForParentScan.spec.scanSpec.volumes.some(ruleVolume => isEqual(scanVolume, ruleVolume))
    );
  }

  if (scan.spec.volumeMounts !== undefined && cascadedRuleUsedForParentScan.spec.scanSpec.volumeMounts !== undefined) {
    scan.spec.volumeMounts = scan.spec.volumeMounts.filter(scanVolumeMount =>
      !cascadedRuleUsedForParentScan.spec.scanSpec.volumeMounts.some(ruleVolumeMount => isEqual(scanVolumeMount, ruleVolumeMount))
    );
  }

  if (scan.spec.hookSelector !== undefined && cascadedRuleUsedForParentScan.spec.scanSpec.hookSelector !== undefined) {
    if (scan.spec.hookSelector.matchExpressions !== undefined && cascadedRuleUsedForParentScan.spec.scanSpec.hookSelector.matchExpressions !== undefined) {
      scan.spec.hookSelector.matchExpressions = scan.spec.hookSelector.matchExpressions.filter(scanHookSelector =>
        !cascadedRuleUsedForParentScan.spec.scanSpec.hookSelector.matchExpressions.some(ruleHookSelector => isEqual(scanHookSelector, ruleHookSelector))
      );
    }
    if (scan.spec.hookSelector.matchLabels !== undefined && cascadedRuleUsedForParentScan.spec.scanSpec.hookSelector.matchLabels !== undefined) {
      for (const label in cascadedRuleUsedForParentScan.spec.scanSpec.hookSelector.matchLabels) {
        delete scan.spec.hookSelector.matchLabels[label]
      }
    }
  }

  return scan
}

export async function getCascadedRuleForScan(scan: Scan) {
  const chain = getScanChain(scan)

  if (chain.length === 0) return undefined;

  return <CascadingRule> await getCascadingRule(chain[chain.length - 1]);
}

async function getCascadingRule(ruleName) {
  try {
    const response: any = await k8sApiCRD.getNamespacedCustomObject(
      "cascading.securecodebox.io",
      "v1",
      namespace,
      "cascadingrules",
      ruleName
    );

    console.log(`Fetched CascadingRule "${ruleName}" that triggered parent scan`);
    return response.body;
  } catch (err) {
    console.error(`Failed to get CascadingRule "${ruleName}" from the kubernetes api`);
    console.error(err);
    process.exit(1);
  }
}
