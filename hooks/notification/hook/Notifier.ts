// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

import { Finding } from "./model/Finding"

export interface Notifier {
  /**
   * Sends a Notification Message to the desired End-Point (e.g. Slack or MS Teams) 
   */
  sendMessage(): Promise<void>
}
