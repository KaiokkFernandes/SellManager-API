import { ITokenPayload, ITokenProvider } from './ITokenProvider';

export class FakeTokenProvider implements ITokenProvider {
  public sign({ subject }: ITokenPayload): Promise<string> {
    return Promise.resolve(`token:${subject}`);
  }

  public verify(token: string): Promise<ITokenPayload> {
    if (!token.startsWith('token:')) {
      return Promise.reject(new Error('Invalid token'));
    }
    return Promise.resolve({ subject: token.slice('token:'.length) });
  }
}
