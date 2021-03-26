import { Notifier } from "../Notifier";
import * as fs from "fs";
import { NotifierType } from "../NotifierType";
import { Finding } from "../model/Finding";
import * as Mustache from "mustache";
import { NotificationChannel } from "../model/NotificationChannel";
import * as jsyaml from "js-yaml";
import { Scan } from "../model/Scan";
import * as path from 'path';

export abstract class AbstractNotifier implements Notifier {
  private static readonly TEMPLATE_DIR: string = path.join(__dirname, "../templates");
  private static readonly TEMPLATE_FILE_TYPE = "mustache";
  protected channel: NotificationChannel;
  protected scan: Scan;
  protected findings: Finding[];
  protected template: string;
  protected abstract type: NotifierType;

  constructor(channel: NotificationChannel, scan: Scan, findings: Finding[]) {
    this.channel = channel;
    this.scan = scan;
    this.findings = findings;
  }

  protected async loadTemplate() {
    console.log(`Try to Load Template "${this.channel.template}"`)
    this.template = this.loadFileAsString(`${AbstractNotifier.TEMPLATE_DIR}/${this.channel.template}.${AbstractNotifier.TEMPLATE_FILE_TYPE}`);
  }

  public abstract sendMessage(): Promise<void>

  private loadFileAsString(template: string): string {
    return fs.readFileSync(template, "utf8");
  }

  protected renderMessage(): string {
    this.loadTemplate();
    const renderedTemplate = Mustache.render(this.template, {
      "findings": this.findings,
      "scan": this.scan,
      "severities": this.getSeverityOverview(),
      "categories": this.getCategoryOverview(),
    });
    try {
      const templateObject = jsyaml.load(renderedTemplate);
      return JSON.stringify(templateObject);
    } catch (e) {
      console.log(e)
    }
  }

  protected getSeverityOverview(): any {
    try {
      const severities = this.getDetails(this.scan.status.findings.severities);
      return severities;
    } catch (error) {
      console.log(`There was an Error getting Severities from Scan: ${error}`)
    }
    return null;
  }

  protected getCategoryOverview(): any {
    try {
      const categories = this.getDetails(this.scan.status.findings.categories);
      return categories;
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
