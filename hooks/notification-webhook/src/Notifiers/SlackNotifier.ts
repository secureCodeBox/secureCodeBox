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


  public async initTemplate(templateName: string): Promise<void> {
    switch (templateName) {
      case TemplateType.MESSAGE_CARD:
        await this.loadTemplate(templateName)
      default:
        throw new Error(`The Template Type ${templateName} does not exist :(`)
    }
  }

  private async sendPostRequest(template: string) {
    console.log(`Template: ${template}`);
  }
}
