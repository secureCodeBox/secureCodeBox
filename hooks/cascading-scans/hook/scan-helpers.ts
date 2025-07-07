// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { isEqual } from "lodash";
import {
  CustomObjectsApi,
  KubeConfig,
  V1Container,
  V1EnvVar,
  V1Toleration,
  V1Volume,
  V1VolumeMount,
  type V1ObjectMeta,
} from "@kubernetes/client-node";

import { getScanChain } from "./hook.js";
import { ScopeLimiterRequirement } from "./scope-limiter.js";
import {
  generateSelectorString,
  LabelSelector,
} from "./kubernetes-label-selector.js";

// configure k8s client
const kc = new KubeConfig();
kc.loadFromDefault();

const k8sApiCRD = kc.makeApiClient(CustomObjectsApi);

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
  metadata: V1ObjectMeta;
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
  metadata: V1ObjectMeta;
  spec: ScanSpec;
  status?: ScanStatus;
}

export interface ScanSpec {
  scanType: string;
  parameters: Array<string>;
  cascades: LabelSelector & CascadingInheritance;
  env?: Array<V1EnvVar>;
  volumes?: Array<V1Volume>;
  volumeMounts?: Array<V1VolumeMount>;
  initContainers?: Array<V1Container>;
  hookSelector?: LabelSelector;
  tolerations?: Array<V1Toleration>;
  affinity?: V1Toleration;
  resourceMode: "clusterWide" | "namespaceLocal";
}

export interface ScopeLimiter {
  validOnMissingRender: boolean;
  anyOf?: Array<ScopeLimiterRequirement>;
  allOf?: Array<ScopeLimiterRequirement>;
  noneOf?: Array<ScopeLimiterRequirement>;
}

export interface CascadingInheritance {
  scopeLimiter: ScopeLimiter;
  inheritLabels: boolean;
  inheritAnnotations: boolean;
  inheritEnv: boolean;
  inheritVolumes: boolean;
  inheritInitContainers: boolean;
  inheritHookSelector: boolean;
  inheritAffinity: boolean;
  inheritTolerations: boolean;
}

export interface ScanStatus {
  rawResultType: string;
}

export interface ParseDefinition {
  metadata: V1ObjectMeta;
  spec: ParseDefinitionSpec;
}

export interface ParseDefinitionSpec {
  scopeLimiterAliases: ScopeLimiterAliases;
}

export type ScopeLimiterAliases = { [key: string]: string };

export function mergeInheritedMap(
  parentProps,
  ruleProps,
  inherit: boolean = true,
) {
  if (!inherit) {
    parentProps = {};
  }
  if (ruleProps === undefined) {
    return parentProps;
  }
  return {
    ...parentProps,
    ...ruleProps, // ruleProps overwrites any duplicate keys from parentProps
  };
}

export function mergeInheritedArray(
  parentArray = [],
  ruleArray = [],
  inherit: boolean = false,
) {
  if (!inherit) {
    parentArray = [];
  }
  return (parentArray || []).concat(ruleArray); // CascadingRule's env overwrites scan's env
}

export function mergeInheritedSelector(
  parentSelector: LabelSelector = {},
  ruleSelector: LabelSelector = {},
  inherit: boolean = false,
): LabelSelector {
  let labelSelector: LabelSelector = {};
  if (parentSelector.matchExpressions || ruleSelector.matchExpressions) {
    labelSelector.matchExpressions = mergeInheritedArray(
      parentSelector.matchExpressions,
      ruleSelector.matchExpressions,
      inherit,
    );
  }
  if (parentSelector.matchLabels || ruleSelector.matchLabels) {
    labelSelector.matchLabels = mergeInheritedMap(
      parentSelector.matchLabels,
      ruleSelector.matchLabels,
      inherit,
    );
  }
  return labelSelector;
}

export async function startSubsequentSecureCodeBoxScan(scan: Scan) {
  console.log(`Starting Scan ${scan.metadata.generateName}`);

  try {
    // Submitting the Scan to the kubernetes api
    const createdScan = await k8sApiCRD.createNamespacedCustomObject({
      version: "v1",
      group: "execution.securecodebox.io",
      plural: "scans",
      namespace: namespace,
      body: scan,
    });
    console.log(`-> Created scan ${createdScan.metadata.name}`);
  } catch (error) {
    console.error(`Failed to start Scan ${scan.metadata.generateName}`);
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
      `Fetching CascadingScans using LabelSelector: "${labelSelector}"`,
    );

    const response: any = await k8sApiCRD.listNamespacedCustomObject({
      group: "cascading.securecodebox.io",
      version: "v1",
      namespace: namespace,
      plural: "cascadingrules",
      labelSelector: labelSelector,
    });

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
    const response: ParseDefinition = await k8sApiCRD.getNamespacedCustomObject(
      {
        group: "execution.securecodebox.io",
        version: "v1",
        namespace: namespace,
        plural: "parsedefinitions",
        name: scan.status.rawResultType,
      },
    );

    return response;
  } catch (err) {
    console.error(
      `Failed to get ParseDefinition ${scan.status.rawResultType} from the kubernetes api`,
    );
    console.error(err);
    process.exit(1);
  }
}

// To ensure that the environment variables and volumes from the cascading rule are only applied to the matched scan
// (and not its children), this function purges the cascading rule spec from the parent scan when inheriting them.
export function purgeCascadedRuleFromScan(
  scan: Scan,
  cascadedRuleUsedForParentScan?: CascadingRule,
): Scan {
  // If there was no cascading rule applied to the parent scan, then ignore no purging is necessary.
  if (cascadedRuleUsedForParentScan === undefined) return scan;

  if (
    scan.spec.env !== undefined &&
    cascadedRuleUsedForParentScan.spec.scanSpec.env !== undefined
  ) {
    scan.spec.env = scan.spec.env.filter(
      (scanEnv) =>
        !cascadedRuleUsedForParentScan.spec.scanSpec.env.some((ruleEnv) =>
          isEqual(scanEnv, ruleEnv),
        ),
    );
  }

  if (
    scan.spec.volumes !== undefined &&
    cascadedRuleUsedForParentScan.spec.scanSpec.volumes !== undefined
  ) {
    scan.spec.volumes = scan.spec.volumes.filter(
      (scanVolume) =>
        !cascadedRuleUsedForParentScan.spec.scanSpec.volumes.some(
          (ruleVolume) => isEqual(scanVolume, ruleVolume),
        ),
    );
  }

  if (
    scan.spec.volumeMounts !== undefined &&
    cascadedRuleUsedForParentScan.spec.scanSpec.volumeMounts !== undefined
  ) {
    scan.spec.volumeMounts = scan.spec.volumeMounts.filter(
      (scanVolumeMount) =>
        !cascadedRuleUsedForParentScan.spec.scanSpec.volumeMounts.some(
          (ruleVolumeMount) => isEqual(scanVolumeMount, ruleVolumeMount),
        ),
    );
  }

  if (
    scan.spec.hookSelector !== undefined &&
    cascadedRuleUsedForParentScan.spec.scanSpec.hookSelector !== undefined
  ) {
    if (
      scan.spec.hookSelector.matchExpressions !== undefined &&
      cascadedRuleUsedForParentScan.spec.scanSpec.hookSelector
        .matchExpressions !== undefined
    ) {
      scan.spec.hookSelector.matchExpressions =
        scan.spec.hookSelector.matchExpressions.filter(
          (scanHookSelector) =>
            !cascadedRuleUsedForParentScan.spec.scanSpec.hookSelector.matchExpressions.some(
              (ruleHookSelector) => isEqual(scanHookSelector, ruleHookSelector),
            ),
        );
    }
    if (
      scan.spec.hookSelector.matchLabels !== undefined &&
      cascadedRuleUsedForParentScan.spec.scanSpec.hookSelector.matchLabels !==
        undefined
    ) {
      for (const label in cascadedRuleUsedForParentScan.spec.scanSpec
        .hookSelector.matchLabels) {
        delete scan.spec.hookSelector.matchLabels[label];
      }
    }
  }

  return scan;
}

export async function getCascadedRuleForScan(scan: Scan) {
  const chain = getScanChain(scan);

  if (chain.length === 0) return undefined;

  return <CascadingRule>await getCascadingRule(chain[chain.length - 1]);
}

async function getCascadingRule(ruleName) {
  try {
    const response: CascadingRule = await k8sApiCRD.getNamespacedCustomObject({
      group: "cascading.securecodebox.io",
      version: "v1",
      namespace: namespace,
      plural: "cascadingrules",
      name: ruleName,
    });

    console.log(
      `Fetched CascadingRule "${ruleName}" that triggered parent scan`,
    );
    return response;
  } catch (err) {
    console.error(
      `Failed to get CascadingRule "${ruleName}" from the kubernetes api`,
    );
    console.error(err);
    process.exit(1);
  }
}
