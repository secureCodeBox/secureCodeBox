import { Notifier } from "../Notifier";
import * as fs from "fs";
import * as util from "util";
import { NotifierType } from "../NotifierType";
import { Finding } from "../model/Finding";
import axios from 'axios';
import { TemplateType } from "../templateType";

export abstract class AbstractNotifier implements Notifier {
  private readonly TEMPLATE_DIR: string = "./templates";
  protected template: string;
  protected abstract type: NotifierType;

  constructor() { }

  public async initCustomTemplate(): Promise<void> {
    if (this.template == null || this.template === "") {
      console.log("No Custom Template found. Loading Default Template")
      await this.loadDefaultTemplate();
    }
  }

  public abstract initTemplate(templateName: string): Promise<void>;

  protected async load(templateName: string) {
    await this.loadTemplate(`${this.TEMPLATE_DIR}/${this.type}/${templateName}`)
  }

  public abstract sendMessage(findings: Finding[]): string

  private async loadDefaultTemplate(): Promise<void> {
    await this.loadTemplate(`${this.TEMPLATE_DIR}/${this.type}/${TemplateType.MESSAGE_CARD}.json`)
  }

  private async loadTemplate(template: string): Promise<void> {
    const readFile = util.promisify(fs.readFile)
    const buf = await readFile(template, "utf8");
    this.template = buf.toString();
  }
}
