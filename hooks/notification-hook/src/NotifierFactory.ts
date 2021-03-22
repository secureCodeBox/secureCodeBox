import { Notifier } from "./Notifier"
import { NotifierType } from "./NotifierType";
import { SlackNotifier } from "./Notifiers/SlackNotifier"
import { NotificationChannel } from "./model/NotificationChannel";
import { Scan } from "./model/Scan";
import { Finding } from "./model/Finding";

export class NotifierFactory {
  static create(channel: NotificationChannel, scan: Scan, findings: Finding[]): Notifier {
    switch (channel.type) {
      case NotifierType.SLACK:
        return new SlackNotifier(channel, scan, findings);
      default:
        throw new Error("This Type is not Implemented :(")
    }
  }
}
