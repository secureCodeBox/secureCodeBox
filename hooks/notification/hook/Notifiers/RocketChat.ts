// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { NotifierType } from "../NotifierType";
import { AbstractWebHookNotifier } from "./AbstractWebHookNotifier";
import { Finding } from "../model/Finding";
import { NotificationChannel } from "../model/NotificationChannel";
import { Scan } from "../model/Scan";

export class RocketChatNotifier extends AbstractWebHookNotifier {
  protected type: NotifierType = NotifierType.ROCKET_CHAT;

  constructor(
    channel: NotificationChannel,
    scan: Scan,
    findings: Finding[],
    args: Object
  ) {
    super(channel, scan, findings, args);
  }

  // rocket.chat endpoint is just the api endpoint and doesn't contain a secret, so it doesn't have to be resolved via env vars
  public resolveEndPoint(): string {
    return this.channel.endPoint;
  }

  public async sendMessage(): Promise<void> {
    console.log("Calling overwrite sendMessage");
    await this.sendPostRequest(this.renderMessage(), {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": this.args["ROCKET_CHAT_AUTH_TOKEN"],
        "X-User-Id": this.args["ROCKET_CHAT_USER_ID"],
      },
    });
  }
}
