import { NotifierType } from "../NotifierType"
import { AbstractNotifier } from "./AbstractNotifier"
import { Finding } from "../model/Finding"
import axios from 'axios';

export class SlackNotifier extends AbstractNotifier {

  protected type: NotifierType = NotifierType.SLACK

  constructor() {
    super();
  }

  public async sendMessage(findings: Finding[]): Promise<void> {
    await this.sendPostRequest(this.renderMessage(findings));
  }

  protected async sendPostRequest(message: string) {
    try {
      await axios.post("https://webhook.site/85040864-7cf4-4a3a-8aa9-34c1fb7c66ba", message)
    } catch (error) {
      console.log(`There was an Error sending the Message for the Slack Notifier`);
    }
  }
}
