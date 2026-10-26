/**
 * Lê o `exp` do JWT (em ms) SÓ para agir cedo no front (logout ao expirar).
 * Não valida assinatura e não é uma garantia de segurança: a API continua sendo
 * a fonte de verdade e responde 401 para token inválido ou expirado.
 */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const exp = (claims as { exp?: unknown }).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry <= now;
}
