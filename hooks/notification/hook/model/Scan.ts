// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import * as k8s from "@kubernetes/client-node"

export interface Scan {
  metadata: k8s.V1ObjectMeta;
  spec: ScanSpec;
  status: Status;
}

export interface ScanSpec {
  scanType: string;
  parameters: Array<string>;
  env?: Array<k8s.V1EnvVar>;
}

export interface Status {
  findingDownloadLink: string;
  findings: any;
  finishedAt: Date;
  rawResultDownloadLink: string;
  rawResultFile: string;
  rawResultType: string;
  state: string;
}
