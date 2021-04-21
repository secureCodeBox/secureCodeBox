import { NotifierType } from "../NotifierType";
import { AbstractNotifier } from "./AbstractNotifier";
import { createTransport } from "nodemailer"
import * as jsyaml from "js-yaml";

export class EMailNotifier extends AbstractNotifier {
  public static readonly SMTP_CONFIG = 'SMTP_CONFIG';
  protected type: NotifierType.EMAIL;

  public async sendMessage(): Promise<void> {
    const message = this.prepareMessage();
    const smtpConfig = this.getSMTPConfig();
    await this.sendMail(message, smtpConfig);
  }

  private getSMTPConfig(): any {
    return jsyaml.load(process.env[EMailNotifier.SMTP_CONFIG]);
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
    message.to = this.channel.endPoint;
    message.from = this.getSMTPConfig().from;
    return message;
  }
}
