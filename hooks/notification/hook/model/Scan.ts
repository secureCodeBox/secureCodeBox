// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import type { V1EnvVar, V1ObjectMeta } from "@kubernetes/client-node";

export interface Scan {
  metadata: V1ObjectMeta;
  spec: ScanSpec;
  status: Status;
}

export interface ScanSpec {
  scanType: string;
  parameters: Array<string>;
  env?: Array<V1EnvVar>;
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
