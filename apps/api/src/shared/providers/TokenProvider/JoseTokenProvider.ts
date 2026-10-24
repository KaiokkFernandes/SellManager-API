import { jwtVerify, SignJWT } from 'jose';
import { ITokenPayload, ITokenProvider } from './ITokenProvider';

export class JoseTokenProvider implements ITokenProvider {
  private readonly secret: Uint8Array;

  constructor(
    secret: string,
    private readonly expiresIn: string,
  ) {
    this.secret = new TextEncoder().encode(secret);
  }

  public async sign({ subject }: ITokenPayload): Promise<string> {
    return new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(subject)
      .setIssuedAt()
      .setExpirationTime(this.expiresIn)
      .sign(this.secret);
  }

  public async verify(token: string): Promise<ITokenPayload> {
    const { payload } = await jwtVerify(token, this.secret, {
      algorithms: ['HS256'],
    });

    if (!payload.sub) {
      throw new Error('Token without subject');
    }

    return { subject: payload.sub };
  }
}
