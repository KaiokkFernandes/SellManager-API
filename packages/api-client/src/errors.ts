import type { components } from './generated/openapi';

export type ApiError = components['schemas']['ApiError'];
export type ApiErrorCode = ApiError['code'];
export type ValidationIssue = components['schemas']['ValidationIssue'];

/**
 * Erro lançado pelo `unwrap` (e pelos helpers) quando a API responde com o
 * formato padrão de erro. Decida pelo `code`; `message` é texto para humanos.
 */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | 'NETWORK_ERROR' | 'UNEXPECTED_RESPONSE';
  readonly issues: ValidationIssue[];
  readonly details: unknown;

  constructor(status: number, body: unknown) {
    const error = isApiError(body) ? body : undefined;
    super(
      error?.message ?? `Unexpected response from the API (status ${status})`,
    );
    this.name = 'ApiClientError';
    this.status = status;
    this.code =
      error?.code ?? (status === 0 ? 'NETWORK_ERROR' : 'UNEXPECTED_RESPONSE');
    this.issues = error?.issues ?? [];
    this.details = error?.details;
  }

  /** Mensagens de validação por campo (`body.email` -> mensagem). */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(
      this.issues.map(issue => [
        `${issue.segment}.${issue.path}`,
        issue.message,
      ]),
    );
  }
}

export function isApiError(body: unknown): body is ApiError {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { status?: unknown }).status === 'error' &&
    typeof (body as { code?: unknown }).code === 'string' &&
    typeof (body as { message?: unknown }).message === 'string'
  );
}
