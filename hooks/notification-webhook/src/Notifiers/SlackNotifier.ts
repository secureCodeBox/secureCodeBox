import { AbstractNotifier } from "./AbstractNotifier"

export class SlackNotifier extends AbstractNotifier {
  constructor(template: string) {
    super(template)
  }
  loadDefaultTemplate() {
    this.template = this.template
  }
  sendNotification() {

  }
}
