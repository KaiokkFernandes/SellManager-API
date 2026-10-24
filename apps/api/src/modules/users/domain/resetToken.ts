import { createHash, randomBytes } from 'node:crypto';

/** Token aleatório (256 bits) enviado por e-mail para redefinir a senha. */
export function generateResetToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
