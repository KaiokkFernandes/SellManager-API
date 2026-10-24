import nodemailer, { Transporter } from 'nodemailer';
import { IMailTemplateProvider } from '../MailTemplateProvider/IMailTemplateProvider';
import { IMailProvider, ISendMailDTO } from './IMailProvider';

const defaultFrom = {
  name: 'Equipe SellManager',
  email: 'equipe@sellmanager.dev',
};

/** Provider de desenvolvimento: envia para uma caixa de teste do Ethereal. */
export class EtherealMailProvider implements IMailProvider {
  private transporter?: Promise<Transporter>;

  constructor(private readonly mailTemplateProvider: IMailTemplateProvider) {}

  // A conta de teste é criada uma vez e reaproveitada (antes era uma por e-mail).
  private getTransporter(): Promise<Transporter> {
    this.transporter ??= nodemailer.createTestAccount().then(account =>
      nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      }),
    );
    return this.transporter;
  }

  public async sendMail({
    to,
    from,
    subject,
    templateData,
  }: ISendMailDTO): Promise<void> {
    const transporter = await this.getTransporter();
    const sender = from ?? defaultFrom;

    const message = (await transporter.sendMail({
      from: { name: sender.name, address: sender.email },
      to: { name: to.name, address: to.email },
      subject,
      html: await this.mailTemplateProvider.parse(templateData),
    })) as Parameters<typeof nodemailer.getTestMessageUrl>[0];

    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(message));
  }
}
