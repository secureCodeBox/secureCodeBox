// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { NotifierType } from "../NotifierType"
import { AbstractNotifier } from "./AbstractNotifier"
import { Finding } from "../model/Finding"
import axios from 'axios';
import { NotificationChannel } from "../model/NotificationChannel";
import { Scan } from "../model/Scan";

export abstract class AbstractWebHookNotifier extends AbstractNotifier {

  protected abstract type: NotifierType;

  constructor(channel: NotificationChannel, scan: Scan, findings: Finding[], args: Object) {
    super(channel, scan, findings, args);
  }

  public async sendMessage(): Promise<void> {
    await this.sendPostRequest(this.renderMessage());
  }

  protected async sendPostRequest(message: string) {
    try {
      await axios.post(this.resolveEndPoint(), message)
    } catch (e) {
      console.log(`There was an Error sending the Message for the "${this.type}": "${this.channel.name}"`);
      console.log(e);
    }
  }
}
