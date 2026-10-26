/**
 * Aceita só caminhos internos do app (`/products?page=2`). Impede open redirect
 * via `?redirect=https://site-malicioso` ou `//site-malicioso`.
 */
export function safeRedirect(value: string | undefined): string | undefined {
  if (!value?.startsWith('/')) return undefined;
  if (value.startsWith('//') || value.startsWith('/\\')) return undefined;
  if (value === '/login' || value.startsWith('/login?')) return undefined;
  return value;
}
