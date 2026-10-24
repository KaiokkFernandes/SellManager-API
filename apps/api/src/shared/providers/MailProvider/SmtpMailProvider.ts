import nodemailer, { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { IMailTemplateProvider } from '../MailTemplateProvider/IMailTemplateProvider';
import { IMailContact, IMailProvider, ISendMailDTO } from './IMailProvider';

export class SmtpMailProvider implements IMailProvider {
  private readonly transporter: Transporter;

  constructor(
    private readonly mailTemplateProvider: IMailTemplateProvider,
    transportOptions: SMTPTransport.Options,
    private readonly defaultFrom: IMailContact,
  ) {
    this.transporter = nodemailer.createTransport(transportOptions);
  }

  public async sendMail({
    to,
    from,
    subject,
    templateData,
  }: ISendMailDTO): Promise<void> {
    const sender = from ?? this.defaultFrom;

    await this.transporter.sendMail({
      from: { name: sender.name, address: sender.email },
      to: { name: to.name, address: to.email },
      subject,
      html: await this.mailTemplateProvider.parse(templateData),
    });
  }
}
