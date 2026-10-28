import {
  ITokenPayload,
  ITokenProvider,
  IVerifiedToken,
} from './ITokenProvider';

/** Token `token:<id>:<iat>`; `issuedAt` controlável para testar a troca de senha. */
export class FakeTokenProvider implements ITokenProvider {
  public now = () => Math.floor(Date.now() / 1000);

  public sign({ subject }: ITokenPayload): Promise<string> {
    return Promise.resolve(`token:${subject}:${this.now()}`);
  }

  public verify(token: string): Promise<IVerifiedToken> {
    const [prefix, subject, issuedAt] = token.split(':');
    if (prefix !== 'token' || !subject || !issuedAt) {
      return Promise.reject(new Error('Invalid token'));
    }
    return Promise.resolve({ subject, issuedAt: Number(issuedAt) });
  }
}
