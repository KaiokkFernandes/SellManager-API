import { IParseMailTemplateDTO } from '../MailTemplateProvider/IMailTemplateProvider';

export interface IMailContact {
  name: string;
  email: string;
}

export interface ISendMailDTO {
  to: IMailContact;
  from?: IMailContact;
  subject: string;
  templateData: IParseMailTemplateDTO;
}

export interface IMailProvider {
  sendMail(data: ISendMailDTO): Promise<void>;
}
