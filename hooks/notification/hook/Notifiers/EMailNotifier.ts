// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

import { NotifierType } from "../NotifierType";
import { AbstractNotifier } from "./AbstractNotifier";
import { createTransport } from "nodemailer"

export class EMailNotifier extends AbstractNotifier {
  public static readonly SMTP_CONFIG = 'SMTP_CONFIG';
  public static readonly EMAIL_FROM = 'EMAIL_FROM';
  protected type: NotifierType.EMAIL;

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
    const transporter = createTransport(smtpConfig);
    try {
      const info = await transporter.sendMail(message);
      console.log(info);
    } catch (e) {
      console.log(`There was an error sending the email: ${e}`)
    } finally {
      transporter.close();
    }
  }

  private prepareMessage(): any {
    const message = JSON.parse(this.renderMessage());
    message.to = this.resolveEndPoint();
    message.from = this.args[EMailNotifier.EMAIL_FROM];
    return message;
  }
}
