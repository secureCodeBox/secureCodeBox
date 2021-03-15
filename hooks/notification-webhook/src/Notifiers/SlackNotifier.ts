import { NotifierType } from "../NotifierType"
import { AbstractNotifier } from "./AbstractNotifier"
import { Finding } from "../model/Finding"
import Mustache from 'mustache';
import { TemplateType } from "../templateType";

export class SlackNotifier extends AbstractNotifier {
  protected type: NotifierType = NotifierType.SLACK
  constructor() {
    super();
  }

  sendMessage(findings: Finding[]): string {
    console.log("Render Slack Message");
    return Mustache.render(this.template, { scanner: "nmap" });
  }


  public async initTemplate(templateName: string): Promise<void> {
    switch (templateName) {
      case TemplateType.MESSAGE_CARD:
        await this.load(templateName)
      default:
        throw new Error(`The Template Type "${templateName}" does not exist :(`)
    }
  }
}
