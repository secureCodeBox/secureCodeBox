import { NotifierType } from "../NotifierType"
import { AbstractNotifier } from "./AbstractNotifier"
import { Finding } from "../model/Finding"
import * as Mustache from 'mustache';
import { TemplateType } from "../templateType";

export class SlackNotifier extends AbstractNotifier {
  protected type: NotifierType = NotifierType.SLACK
  constructor() {
    super();
  }

  public async sendMessage(findings: Finding[]): Promise<void> {
    console.log("Render Slack Message");
    let template = Mustache.render(this.template, { scanner: "nmap" });
    await this.sendPostRequest(template);
  }


  public async initTemplate(templateType: string): Promise<void> {
    switch (templateType) {
      case TemplateType.MESSAGE_CARD:
        await this.loadTemplate(templateType)
        break;
      default:
        throw new Error(`The Template Type "${templateType}" is not implemented for this Notifier :(`)
    }
  }

  private async sendPostRequest(template: string) {
    console.log(`Template: ${template}`);
  }
}
