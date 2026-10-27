import { ApiClientError, type ApiErrorCode } from '@sellmanager/api-client';

/**
 * Mapeamento ÚNICO do erro da API para texto amigável. Decide pelo `code`
 * (estável), nunca pelo `message` da API, que é para logs e pode mudar.
 */
const MESSAGES: Record<
  ApiErrorCode | 'NETWORK_ERROR' | 'UNEXPECTED_RESPONSE',
  string
> = {
  VALIDATION_FAILED: 'Confira os campos informados.',
  BAD_REQUEST: 'A requisição é inválida.',
  INVALID_UPLOAD: 'O arquivo enviado não é válido.',
  UNAUTHORIZED: 'Sessão inválida ou expirada. Entre novamente.',
  NOT_FOUND: 'O item não foi encontrado.',
  CONFLICT: 'Essa operação conflita com o estado atual dos dados.',
  ALREADY_EXISTS: 'Já existe um registro com esses dados.',
  INSUFFICIENT_STOCK: 'Estoque insuficiente para concluir o pedido.',
  RESOURCE_IN_USE: 'Este item está em uso e não pode ser removido.',
  PAYLOAD_TOO_LARGE: 'Os dados enviados são grandes demais.',
  RATE_LIMITED: 'Muitas tentativas. Aguarde um instante e tente de novo.',
  INTERNAL_ERROR: 'Algo deu errado no servidor. Tente novamente.',
  NETWORK_ERROR:
    'Não foi possível conectar ao servidor. Verifique sua conexão.',
  UNEXPECTED_RESPONSE: 'Resposta inesperada do servidor. Tente novamente.',
};

const FALLBACK = 'Ocorreu um erro inesperado. Tente novamente.';

/** Mensagem amigável para qualquer erro capturado. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return MESSAGES[error.code];
  }
  return FALLBACK;
}

/** Erros de validação por campo, na chave do campo do formulário (`email`, `products.0.id`). */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiClientError)) return {};
  return Object.fromEntries(
    error.issues
      .filter(issue => issue.segment === 'body')
      .map(issue => [
        issue.path,
        // campo único em conflito (e-mail, nome): texto em pt-BR, decidido pelo code
        error.code === 'ALREADY_EXISTS'
          ? 'Já está em uso por outro cadastro.'
          : issue.message,
      ]),
  );
}

/** `orders_count` do erro RESOURCE_IN_USE (exclusão barrada por pedidos). */
export function getInUseOrdersCount(error: unknown): number | undefined {
  if (!(error instanceof ApiClientError) || error.code !== 'RESOURCE_IN_USE')
    return undefined;
  const count = (error.details as { orders_count?: unknown } | undefined)
    ?.orders_count;
  return typeof count === 'number' ? count : undefined;
}

/** True se o erro é um ApiClientError com esse `code`. */
export function isApiErrorCode(error: unknown, code: ApiErrorCode): boolean {
  return error instanceof ApiClientError && error.code === code;
}
