// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

import * as k8s from "@kubernetes/client-node";

import {
  generateSelectorString,
  LabelSelector
} from "./kubernetes-label-selector";
import {isEqual} from "lodash";

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
}

export interface ScanSpec {
  scanType: string;
  parameters: Array<string>;
  cascades: LabelSelector & CascadingInheritance;
  env?: Array<k8s.V1EnvVar>;
  volumes?: Array<k8s.V1Volume>;
  volumeMounts?: Array<k8s.V1VolumeMount>;
}

export interface CascadingInheritance {
  inheritLabels: boolean,
  inheritAnnotations: boolean
}

export interface ExtendedScanSpec extends ScanSpec {
  // This is the name of the scan. Its not "really" part of the scan spec
  // But this makes the object smaller
  name: string;

  // Indicates which CascadingRule was used to generate the resulting Scan
  generatedBy: string;

  // Additional label to be added to the resulting scan
  scanLabels: {
    [key: string]: string;
  };

  // Additional annotations to be added to the resulting scan
  scanAnnotations: {
    [key: string]: string;
  };

  // Finding that triggered the scan
  finding: Finding
}

export function getCascadingScanDefinition({
   name,
   scanType,
   parameters,
   generatedBy,
   env,
   volumes,
   volumeMounts,
   cascades,
   scanLabels,
   scanAnnotations,
   finding
 }: ExtendedScanSpec, parentScan: Scan) {
  function mergeInherited(parentProps, ruleProps, inherit: boolean = true) {
    if (!inherit) {
      parentProps = {};
    }
    return {
      ...parentProps,
      ...ruleProps // ruleProps overwrites any duplicate keys from parentProps
    }
  }

  let annotations = mergeInherited(
    parentScan.metadata.annotations, scanAnnotations, parentScan.spec.cascades.inheritAnnotations);
  let labels = mergeInherited(
    parentScan.metadata.labels, scanLabels, parentScan.spec.cascades.inheritLabels);

  let cascadingChain: Array<string> = [];

  if (parentScan.metadata.annotations && parentScan.metadata.annotations["cascading.securecodebox.io/chain"]) {
    cascadingChain = parentScan.metadata.annotations[
      "cascading.securecodebox.io/chain"
    ].split(",");
  }

  return {
    apiVersion: "execution.securecodebox.io/v1",
    kind: "Scan",
    metadata: {
      generateName: `${name}-`,
      labels: {
        ...labels
      },
      annotations: {
        "securecodebox.io/hook": "cascading-scans",
        "cascading.securecodebox.io/parent-scan": parentScan.metadata.name,
        "cascading.securecodebox.io/matched-finding": finding.id,
        "cascading.securecodebox.io/chain": [
          ...cascadingChain,
          generatedBy
        ].join(","),
        ...annotations,
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
      scanType,
      parameters,
      cascades,
      env: (parentScan.spec.env || []).concat(env), // CascadingRule's env overwrites scan's env
      volumes: (parentScan.spec.volumes || []).concat(volumes),
      volumeMounts: (parentScan.spec.volumeMounts || []).concat(volumeMounts),
    }
  };
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

export function purgeCascadedRuleFromScan(scan: Scan, cascadedRule?: CascadingRule) : Scan {
  if (cascadedRule === undefined) return scan;

  if (scan.spec.env !== undefined && cascadedRule.spec.scanSpec.env !== undefined) {
    scan.spec.env = scan.spec.env.filter(scanEnv =>
      !cascadedRule.spec.scanSpec.env.some(ruleEnv => isEqual(scanEnv, ruleEnv))
    );
  }

  if (scan.spec.volumes !== undefined && cascadedRule.spec.scanSpec.volumes !== undefined) {
    scan.spec.volumes = scan.spec.volumes.filter(scanVolume =>
      !cascadedRule.spec.scanSpec.volumes.some(ruleVolume => isEqual(scanVolume, ruleVolume))
    );
  }

  if (scan.spec.volumeMounts !== undefined && cascadedRule.spec.scanSpec.volumeMounts !== undefined) {
    scan.spec.volumeMounts = scan.spec.volumeMounts.filter(scanVolumeMount =>
      !cascadedRule.spec.scanSpec.volumeMounts.some(ruleVolumeMount => isEqual(scanVolumeMount, ruleVolumeMount))
    );
  }

  return scan
}

export async function getCascadedRuleForScan(scan: Scan) {
  if (scan.metadata.generation === 1) return undefined;

  const cascadingChain = scan.metadata.annotations["cascading.securecodebox.io/chain"].split(",")
  return await getCascadingRule(cascadingChain[cascadingChain.length - 1]);
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
