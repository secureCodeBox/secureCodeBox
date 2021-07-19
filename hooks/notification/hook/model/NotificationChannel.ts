// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

import { NotifierType } from "../NotifierType";

export interface NotificationChannel {
  name: string;
  type: NotifierType;
  skipNotificationOnZeroFindings?: boolean;
  template: string;
  rules: any;
  endPoint?: string;
}
