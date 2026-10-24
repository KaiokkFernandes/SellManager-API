import { IMailProvider, ISendMailDTO } from './IMailProvider';

export class FakeMailProvider implements IMailProvider {
  public readonly messages: ISendMailDTO[] = [];

  public sendMail(message: ISendMailDTO): Promise<void> {
    this.messages.push(message);
    return Promise.resolve();
  }
}
