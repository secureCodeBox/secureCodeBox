import { Notifier } from "./Notifier"
import { NotifierType } from "./NotifierType";
import { SlackNotifier } from "./Notifiers/SlackNotifier"

export class NotifierFactory {
  static create(type: NotifierType, template: string): Notifier {
    switch (type) {
      case NotifierType.SLACK:
        return new SlackNotifier(template);
    }
  }
}
