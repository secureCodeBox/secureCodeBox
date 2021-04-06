import { NotifierType } from "../NotifierType"
import { AbstractNotifier } from "./AbstractNotifier"
import { Finding } from "../model/Finding"
import axios from 'axios';
import { NotificationChannel } from "../model/NotificationChannel";
import { Scan } from "../model/Scan";

export class SlackNotifier extends AbstractNotifier {

  protected type: NotifierType = NotifierType.SLACK

  constructor(channel: NotificationChannel, scan: Scan, findings: Finding[], args: any[]) {
    super(channel, scan, findings, args);
  }

  public async sendMessage(): Promise<void> {
    await this.sendPostRequest(this.renderMessage());
  }

  protected async sendPostRequest(message: string) {
    try {
      await axios.post(this.channel.endPoint, message)
    } catch (e) {
      console.log(`There was an Error sending the Message for the Slack Notifier "${this.channel.name}"`);
      console.log(e);
    }
  }
}
