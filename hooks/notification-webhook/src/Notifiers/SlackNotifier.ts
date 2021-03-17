import { NotifierType } from "../NotifierType"
import { AbstractNotifier } from "./AbstractNotifier"
import { Finding } from "../model/Finding"
import axios from 'axios';
import { NotificationChannel } from "../model/NotificationChannel";

export class SlackNotifier extends AbstractNotifier {

  protected type: NotifierType = NotifierType.SLACK

  constructor(channel: NotificationChannel) {
    super(channel);
  }

  public async sendMessage(findings: Finding[]): Promise<void> {
    await this.sendPostRequest(this.renderMessage(findings));
  }

  protected async sendPostRequest(message: string) {
    try {
      await axios.post(this.channel.endPoint, message)
    } catch (error) {
      console.log(`There was an Error sending the Message for the Slack Notifier "${this.channel.name}"`);
    }
  }
}
