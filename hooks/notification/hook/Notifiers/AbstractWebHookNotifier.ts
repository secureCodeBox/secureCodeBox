// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
import { NotifierType } from "../NotifierType.js";
import { AbstractNotifier } from "./AbstractNotifier.js";

import type { Scan } from "../model/Scan";
import type { Finding } from "../model/Finding";
import type { NotificationChannel } from "../model/NotificationChannel";

export interface FetchRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export abstract class AbstractWebHookNotifier extends AbstractNotifier {
  protected abstract type: NotifierType;

  constructor(
    channel: NotificationChannel,
    scan: Scan,
    findings: Finding[],
    args: Object,
  ) {
    super(channel, scan, findings, args);
  }

  public async sendMessage(): Promise<void> {
    await this.sendPostRequest(this.renderMessage());
  }

  protected async sendPostRequest(
    message: string,
    options?: FetchRequestOptions,
  ) {
    try {
      const response = await fetch(
        this.resolveEndPoint(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {})
          },
          body: message,
          ...options
        }
      );
      console.log(
        `Notifier sent out request for notification, got response code: ${response.status}`,
      );
    } catch (e) {
      console.log(
        `There was an error sending the message for notifier  "${this.channel.name}" of type "${this.type}":`,
      );
      console.log(e);
    }
  }
}
