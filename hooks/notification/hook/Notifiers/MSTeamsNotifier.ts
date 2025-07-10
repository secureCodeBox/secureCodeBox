// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { NotifierType } from "../NotifierType.js";
import { AbstractWebHookNotifier } from "./AbstractWebHookNotifier.js";

import type { Finding } from "../model/Finding";
import type { NotificationChannel } from "../model/NotificationChannel";
import type { Scan } from "../model/Scan";

export class MSTeamsNotifier extends AbstractWebHookNotifier {
  protected type: NotifierType = NotifierType.MS_TEAMS;

  constructor(
    channel: NotificationChannel,
    scan: Scan,
    findings: Finding[],
    args: Object,
  ) {
    super(channel, scan, findings, args);
  }

  public async sendMessage(): Promise<void> {
    await this.sendPostRequest(this.renderMessage(), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
