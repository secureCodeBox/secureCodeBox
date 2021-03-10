import { Notifier } from "../Notifier"

export abstract class AbstractNotifier implements Notifier {
  protected template: string

  constructor(template) {
    if (null == template || "" === template) {
      this.loadDefaultTemplate();
    } else {
      this.template = template;
    }
  }

  abstract sendNotification(): void
  abstract loadDefaultTemplate(): void
}
