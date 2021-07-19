// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

import { Notifier } from "./Notifier";
import { NotifierType } from "./NotifierType";
import { SlackNotifier } from "./Notifiers/SlackNotifier";
import { SlackAppNotifier } from "./Notifiers/SlackAppNotifier";
import { EMailNotifier } from "./Notifiers/EMailNotifier";
import { MSTeamsNotifier } from "./Notifiers/MSTeamsNotifier";
import { NotificationChannel } from "./model/NotificationChannel";
import { Scan } from "./model/Scan";
import { Finding } from "./model/Finding";

export class NotifierFactory {
  static create(
    channel: NotificationChannel,
    scan: Scan,
    findings: Finding[],
    args: any
  ): Notifier {
    switch (channel.type) {
      case NotifierType.SLACK:
        return new SlackNotifier(channel, scan, findings, args);
      case NotifierType.EMAIL:
        return new EMailNotifier(channel, scan, findings, args);
      case NotifierType.SLACK_APP:
        return new SlackAppNotifier(channel, scan, findings, args);
      case NotifierType.MS_TEAMS:
        return new MSTeamsNotifier(channel, scan, findings, args);
      default:
        throw new Error("This Type is not Implemented :(");
    }
  }
}
