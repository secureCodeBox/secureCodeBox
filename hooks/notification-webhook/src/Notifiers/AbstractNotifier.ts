import { Notifier } from "../Notifier";
import * as fs from "fs";
import * as util from "util";
import { NotifierType } from "../NotifierType";
import { Finding } from "../model/Finding";
import { TemplateType } from "../templateType";

export abstract class AbstractNotifier implements Notifier {
  private static readonly TEMPLATE_DIR: string = "./templates";
  private static readonly TEMPLATE_FILE_TYPE = "json";
  protected template: string;
  protected abstract type: NotifierType;

  constructor() { }

  public async initCustomTemplate(template: string): Promise<void> {
    if (template == null || template === "") {
      console.log("No Custom Template found. Loading Default Template")
      await this.loadDefaultTemplate();
    }
    this.template = template;
  }

  public abstract initTemplate(templateName: string): Promise<void>;

  protected async loadTemplate(templateName: string) {
    await this.loadFile(`${AbstractNotifier.TEMPLATE_DIR}/${this.type}/${templateName}.${AbstractNotifier.TEMPLATE_FILE_TYPE}`)
  }

  public abstract sendMessage(findings: Finding[]): Promise<void>

  private async loadDefaultTemplate(): Promise<void> {
    await this.loadTemplate(TemplateType.MESSAGE_CARD)
  }

  private async loadFile(template: string): Promise<void> {
    const readFile = util.promisify(fs.readFile)
    const buf = await readFile(template, "utf8");
    this.template = buf.toString();
  }
}
