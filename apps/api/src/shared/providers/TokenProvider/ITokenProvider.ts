export interface ITokenPayload {
  subject: string;
}

export interface ITokenProvider {
  sign(payload: ITokenPayload): Promise<string>;
  /** Lança erro se o token for inválido ou estiver expirado. */
  verify(token: string): Promise<ITokenPayload>;
}
