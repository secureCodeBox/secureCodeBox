import { NotifierType } from "../NotifierType"
import { AbstractNotifier } from "./AbstractNotifier"
import { Finding } from "../model/Finding"
import Mustache from 'mustache';

export class SlackNotifier extends AbstractNotifier {
  protected type: NotifierType = NotifierType.SLACK
  constructor() {
    super();
  }

  sendMessage(findings: Finding[]): string {
    console.log("Render Slack Message");
    return Mustache.render(this.template, { scanner: "nmap" });
  }
}
