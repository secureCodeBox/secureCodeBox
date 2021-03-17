import { Notifier } from "../Notifier";
import * as fs from "fs";
import { NotifierType } from "../NotifierType";
import { Finding } from "../model/Finding";
import * as Mustache from "mustache";
import { NotificationChannel } from "../model/NotificationChannel";
import * as jsyaml from "js-yaml";

export abstract class AbstractNotifier implements Notifier {
  private static readonly TEMPLATE_DIR: string = "./templates";
  private static readonly TEMPLATE_FILE_TYPE = "yaml";
  protected channel: NotificationChannel;
  protected template: string;
  protected abstract type: NotifierType;

  constructor(channel: NotificationChannel) {
    this.channel = channel;
  }

  protected async loadTemplate() {
    console.log(`Try to Load Template "${this.channel.templateName}"`)
    this.template = this.loadFileAsString(`${AbstractNotifier.TEMPLATE_DIR}/${this.channel.templateName}.${AbstractNotifier.TEMPLATE_FILE_TYPE}`);
  }

  public abstract sendMessage(findings: Finding[]): Promise<void>

  private loadFileAsString(template: string): string {
    const buf = fs.readFileSync(template, "utf8");
    const yamlTemplate = jsyaml.load(buf);
    return JSON.stringify(yamlTemplate);
  }

  protected renderMessage(findings: Finding[]): string {
    this.loadTemplate();
    return Mustache.render(this.template, { scanner: "nmap" });
  }
}
