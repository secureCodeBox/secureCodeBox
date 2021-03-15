import { Notifier } from "./Notifier"
import { NotifierType } from "./NotifierType";
import { SlackNotifier } from "./Notifiers/SlackNotifier"

export class NotifierFactory {
  static create(notifierType: NotifierType): Notifier {
    switch (notifierType) {
      case NotifierType.SLACK:
        return new SlackNotifier();
      default:
        throw new Error("This Type is not Implemented :(")
    }
  }
}
