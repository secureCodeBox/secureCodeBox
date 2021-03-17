import { Notifier } from "../Notifier";
import * as fs from "fs";
import { NotifierType } from "../NotifierType";
import { Finding } from "../model/Finding";
import * as Mustache from "mustache";
import { NotificationChannel } from "../model/NotificationChannel";
import * as jsyaml from "js-yaml";
import { Scan } from "../model/Scan"

export abstract class AbstractNotifier implements Notifier {
  private static readonly TEMPLATE_DIR: string = "./templates";
  private static readonly TEMPLATE_FILE_TYPE = "yaml";
  protected channel: NotificationChannel;
  protected scan: Scan;
  protected template: string;
  protected abstract type: NotifierType;

  constructor(channel: NotificationChannel, scan: Scan) {
    this.channel = channel;
    this.scan = scan;
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
    return Mustache.render(this.template, {
      "findings": findings,
      "scan": this.scan,
      "getSeverityOverview": this.getSeverityOverview(),
      "getCategoryOverview": this.getCategoryOverview(),
    });
  }

  protected getSeverityOverview(): string {
    let template = ""
    try {
      const severities = this.getDetails(this.scan.status.findings.severities);
      for (const severity of severities) {
        template += `${severity.name}: ${severity.value}\n`
      }
      return template;
    } catch (error) {
      console.log(`There was an Error getting Severities from Scan: ${error}`)
    }
    return null;
  }

  protected getCategoryOverview(): string {
    let template = "";
    try {
      const categories = this.getDetails(this.scan.status.findings.categories);
      for (const category of categories) {
        template += `${category.name}: ${category.value}\n`
      }
      return template;
    } catch (error) {
      console.log(`There was an Error getting Categories from Scan: ${error}`)
    }
    return null;
  }

  protected getDetails(data): any[] {
    return data != null
      ? Object.entries(data).map(([name, value]) => ({ name, value }))
      : [];
  }
}
