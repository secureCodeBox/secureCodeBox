import { Notifier } from "../Notifier";
import * as fs from "fs";
import * as util from "util";
import { NotifierType } from "../NotifierType";
import { Finding } from "../model/Finding";
import * as Mustache from "mustache";

export abstract class AbstractNotifier implements Notifier {
  private static readonly TEMPLATE_DIR: string = "./templates";
  private static readonly TEMPLATE_FILE_TYPE = "json";
  protected template: string;
  protected abstract type: NotifierType;

  constructor() { }

  protected async loadTemplate(templateName: string) {
    this.template = this.loadFileAsString(`${AbstractNotifier.TEMPLATE_DIR}/${this.type}/${templateName}.${AbstractNotifier.TEMPLATE_FILE_TYPE}`);
  }

  public abstract sendMessage(findings: Finding[]): Promise<void>

  private loadFileAsString(template: string): string {
    const buf = fs.readFileSync(template, "utf8");
    return buf.toString();
  }

  protected renderMessage(findings: Finding[]): string {
    return Mustache.render(this.template, { scanner: "nmap" });
  }
}
