import { Notifier } from "./Notifier"
import { NotifierType } from "./NotifierType";
import { SlackNotifier } from "./Notifiers/SlackNotifier"
import { NotificationChannel } from "./model/notification-channel";

export class NotifierFactory {
  static create(channel: NotificationChannel): Notifier {
    switch (channel.type) {
      case NotifierType.SLACK:
        return new SlackNotifier(channel);
      default:
        throw new Error("This Type is not Implemented :(")
    }
  }
}
