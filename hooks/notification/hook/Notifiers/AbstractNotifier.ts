// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { Notifier } from "../Notifier";
import { NotifierType } from "../NotifierType";
import { Finding } from "../model/Finding";
import { NotificationChannel } from "../model/NotificationChannel";
import * as jsyaml from "js-yaml";
import { Scan } from "../model/Scan";
import * as path from "path";
import * as nunjucks from "nunjucks";

export abstract class AbstractNotifier implements Notifier {
  private static readonly TEMPLATE_DIR: string = path.join(
    __dirname,
    "../notification-templates"
  );
  private static readonly TEMPLATE_FILE_TYPE = "njk";
  protected channel: NotificationChannel;
  protected scan: Scan;
  protected findings: Finding[];
  protected template: string;
  protected abstract type: NotifierType;
  protected args: Object;

  constructor(
    channel: NotificationChannel,
    scan: Scan,
    findings: Finding[],
    args: Object
  ) {
    this.channel = channel;
    this.scan = scan;
    this.findings = findings;
    this.args = args;
  }

  public abstract sendMessage(): Promise<void>;

  protected renderMessage(): string {
    return JSON.stringify(this.renderYamlTemplate());
  }


  /**
   * By default the value of the endpoint channel config is mapped to a environment variable to be able to store these values securely
   * This behavior can be overwritten for hooks where it doesn't make sense as the endpoint is not considered sensitive.
   * 
   * @param envName value of the channels endpoint
   * @returns string actual EndPoint value
   */
  public resolveEndPoint(): string {
    return process.env[this.channel.endPoint];
  }

  protected renderYamlTemplate(): any {
    nunjucks.configure(AbstractNotifier.TEMPLATE_DIR);
    const renderedTemplate = nunjucks.render(
      `${this.channel.template}.${AbstractNotifier.TEMPLATE_FILE_TYPE}`,
      {
        findings: this.findings,
        scan: this.scan,
        args: this.args,
        renderString: nunjucks.renderString,
      }
    );
    try {
      const templateObject = jsyaml.load(renderedTemplate);
      return templateObject;
    } catch (e) {
      console.log(e);
    }
  }
}
