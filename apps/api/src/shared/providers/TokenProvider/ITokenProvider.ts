export interface ITokenPayload {
  subject: string;
}

export interface IVerifiedToken extends ITokenPayload {
  /** Emissão do token, em segundos desde a época (claim `iat`). */
  issuedAt: number;
}

export interface ITokenProvider {
  sign(payload: ITokenPayload): Promise<string>;
  /** Lança erro se o token for inválido ou estiver expirado. */
  verify(token: string): Promise<IVerifiedToken>;
}
