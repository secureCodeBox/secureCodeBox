// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
import axios from 'axios';
import { Scan } from "../model/Scan";
import { Finding } from "../model/Finding"
import { NotifierType } from "../NotifierType"
import type { AxiosRequestConfig } from 'axios';
import { AbstractNotifier } from "./AbstractNotifier"
import { NotificationChannel } from "../model/NotificationChannel";

export abstract class AbstractWebHookNotifier extends AbstractNotifier {

  protected abstract type: NotifierType;

  constructor(channel: NotificationChannel, scan: Scan, findings: Finding[], args: Object) {
    super(channel, scan, findings, args);
  }

  public async sendMessage(): Promise<void> {
    await this.sendPostRequest(this.renderMessage());
  }

  protected async sendPostRequest(message: string, options?: AxiosRequestConfig) {
    try {
      const response = await axios.post(this.resolveEndPoint(), message, options)
      console.log(`Notifier sent out request for notification, got response code: ${response.status}`)
    } catch (e) {
      console.log(`There was an error sending the message for notifier  "${this.channel.name}" of type "${this.type}":`);
      console.log(e);
    }
  }
}
