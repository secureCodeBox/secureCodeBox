import { Notifier } from "../Notifier";
import * as fs from "fs";
import * as util from "util";
import { NotifierType } from "../NotifierType";
import { Finding } from "../model/Finding";
import * as Mustache from "mustache";
import { NotificationChannel } from "../model/NotificationChannel";

export abstract class AbstractNotifier implements Notifier {
  private static readonly TEMPLATE_DIR: string = "./templates";
  private static readonly TEMPLATE_FILE_TYPE = "json";
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
    return buf.toString();
  }

  protected renderMessage(findings: Finding[]): string {
    this.loadTemplate();
    return Mustache.render(this.template, { scanner: "nmap" });
  }
}
