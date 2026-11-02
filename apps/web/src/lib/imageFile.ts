import { ApiClientError } from '@sellmanager/api-client';
import { IMAGE_UPLOAD, isAllowedImageType } from '@sellmanager/shared';
import { getErrorMessage } from './apiErrors';

export const IMAGE_MAX_MB = IMAGE_UPLOAD.maxBytes / 1024 / 1024;
const TOO_LARGE = `A imagem deve ter no máximo ${IMAGE_MAX_MB} MB.`;

/** Mesmos limites da API (vindos do shared). Devolve a mensagem de erro ou null. */
export function validateImageFile(file: File): string | null {
  if (!isAllowedImageType(file.type)) {
    return 'Formato não suportado. Envie uma imagem JPEG, PNG ou WebP.';
  }
  if (file.size > IMAGE_UPLOAD.maxBytes) {
    return TOO_LARGE;
  }
  return null;
}

/**
 * Mensagem de falha no envio. O 413 pode vir da API ou da própria Vercel, que
 * responde antes de a requisição chegar ao código.
 */
export function getUploadErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 413) {
    return TOO_LARGE;
  }
  return getErrorMessage(error);
}

/** Valor do atributo `accept` do <input type="file">. */
export const IMAGE_ACCEPT = IMAGE_UPLOAD.mimeTypes.join(',');
