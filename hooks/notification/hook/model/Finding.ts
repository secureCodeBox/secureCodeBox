// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

export interface Finding {
  name: string;
  location: string;
  category: string;
  severity: string;
  osi_layer: string;
  attributes: Map<string, string | number>;
}
