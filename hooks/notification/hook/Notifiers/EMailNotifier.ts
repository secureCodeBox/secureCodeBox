// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { NotifierType } from "../NotifierType.js";
import { AbstractNotifier } from "./AbstractNotifier.js";

import type { NotificationChannel } from "../model/NotificationChannel";
import type { Finding } from "../model/Finding";
import type { Scan } from "../model/Scan";

import type { createTransport as createTransportType } from "nodemailer";

export class EMailNotifier extends AbstractNotifier {
  public static readonly SMTP_CONFIG = "SMTP_CONFIG";
  public static readonly EMAIL_FROM = "EMAIL_FROM";
  protected type: NotifierType.EMAIL;
  protected createTransport: typeof createTransportType;

  constructor(
    channel: NotificationChannel,
    scan: Scan,
    findings: Finding[],
    args: Object,
    createTransport: typeof createTransportType,
  ) {
    super(channel, scan, findings, args);
    this.createTransport = createTransport;
  }

  /**
   * Emails endPoints are not considered sensitive as they are just the receiver of the email.
   */
  public resolveEndPoint(): string {
    return this.channel.endPoint;
  }

  public async sendMessage(): Promise<void> {
    const message = this.prepareMessage();
    const smtpConfig = this.getSMTPConfig();
    await this.sendMail(message, smtpConfig);
  }

  private getSMTPConfig(): any {
    return process.env[EMailNotifier.SMTP_CONFIG];
  }

  protected async sendMail(message: any, smtpConfig: any) {
    const transporter = this.createTransport(smtpConfig);
    try {
      const info = await transporter.sendMail(message);
      console.log(info);
    } catch (e) {
      console.log(`There was an error sending the email: ${e}`);
    } finally {
      transporter.close();
    }
  }

  private prepareMessage(): any {
    const message = JSON.parse(this.renderMessage());
    if (!message.to) {
      // only use fixed endpoint / mail address if it isn't already defined by the template
      message.to = this.resolveEndPoint();
    }
    message.from = this.args[EMailNotifier.EMAIL_FROM];
    return message;
  }
}
