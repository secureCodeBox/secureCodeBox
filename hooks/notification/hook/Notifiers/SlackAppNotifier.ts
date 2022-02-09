// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { NotifierType } from "../NotifierType";
import { AbstractNotifier } from "./AbstractNotifier";
import { Finding } from "../model/Finding";
import axios from "axios";
import { NotificationChannel } from "../model/NotificationChannel";
import { Scan } from "../model/Scan";

interface SlackApiResponse {
  ok: boolean;
  error?: string;
}

export class SlackAppNotifier extends AbstractNotifier {
  protected type: NotifierType = NotifierType.SLACK_APP;

  protected slackChannel: string;

  constructor(
    channel: NotificationChannel,
    scan: Scan,
    findings: Finding[],
    args: Object
  ) {
    super(channel, scan, findings, args);

    // Use slack channel configured via scan annotation or fall back to a default one configured via env args
    this.slackChannel =
      scan.metadata?.annotations?.[
        "notification.securecodebox.io/slack-channel"
      ] ?? args["SLACK_DEFAULT_CHANNEL"];

    if (this.slackChannel === undefined) {
      throw new Error(
        "Not Slack channel configured via 'notification.securecodebox.io/slack-channel' scan annotation or via the 'SLACK_DEFAULT_CHANNEL' env variable."
      );
    }
  }

  public async sendMessage(): Promise<void> {
    await this.sendPostRequest(this.renderYamlTemplate());
  }

  protected async sendPostRequest(message: any) {
    try {
      console.log(
        `Sending notification to Slack Channel: ${this.slackChannel}`
      );

      const { data: response } = await axios.post<SlackApiResponse>(
        "https://slack.com/api/chat.postMessage",
        {
          ...message,
          channel: this.slackChannel,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env["SLACK_APP_TOKEN"]}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Slack API Call Failed: ${response.error}`);
      }
    } catch (e) {
      console.log(
        `There was an Error sending the Message for the Slack App Notifier "${this.channel.name}"`
      );
      console.log(e);
    }
  }
}
