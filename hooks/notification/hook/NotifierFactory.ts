// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { createTransport } from "nodemailer";

import { NotifierType } from "./NotifierType.js";
import { SlackNotifier } from "./Notifiers/SlackNotifier.js";
import { SlackAppNotifier } from "./Notifiers/SlackAppNotifier.js";
import { EMailNotifier } from "./Notifiers/EMailNotifier.js";
import { MSTeamsNotifier } from "./Notifiers/MSTeamsNotifier.js";
import { TrelloNotifier } from "./Notifiers/TrelloNotifier.js";
import { NotificationChannel } from "./model/NotificationChannel.js";
import { RocketChatNotifier } from "./Notifiers/RocketChat.js";

import type { Notifier } from "./Notifier";
import type { Scan } from "./model/Scan";
import type { Finding } from "./model/Finding";

export class NotifierFactory {
  static create(
    channel: NotificationChannel,
    scan: Scan,
    findings: Finding[],
    args: any,
  ): Notifier {
    switch (channel.type) {
      case NotifierType.SLACK:
        return new SlackNotifier(channel, scan, findings, args);
      case NotifierType.EMAIL:
        return new EMailNotifier(channel, scan, findings, args, createTransport);
      case NotifierType.SLACK_APP:
        return new SlackAppNotifier(channel, scan, findings, args);
      case NotifierType.MS_TEAMS:
        return new MSTeamsNotifier(channel, scan, findings, args);
      case NotifierType.TRELLO:
        return new TrelloNotifier(channel, scan, findings, args);
      case NotifierType.ROCKET_CHAT:
        return new RocketChatNotifier(channel, scan, findings, args);
      default:
        throw new Error(
          `Notifier of Type: "${channel.type}"  is not implemented :( Check with the notification hooks documentation for a list of available notifiers.`,
        );
    }
  }
}
