// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

import * as k8s from "@kubernetes/client-node";

import {
  generateSelectorString,
  LabelSelector
} from "./kubernetes-label-selector";

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
}

export function getCascadingScanDefinition({
   name,
   parentScan,
   scanType,
   parameters,
   generatedBy,
   env,
   scanLabels,
   scanAnnotations
 }) {
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
      cascades: parentScan.spec.cascades,
      env,
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
