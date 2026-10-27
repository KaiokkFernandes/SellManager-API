import { IMAGE_UPLOAD, isAllowedImageType } from '@sellmanager/shared';

const MAX_MB = IMAGE_UPLOAD.maxBytes / 1024 / 1024;

/** Mesmos limites da API (vindos do shared). Devolve a mensagem de erro ou null. */
export function validateImageFile(file: File): string | null {
  if (!isAllowedImageType(file.type)) {
    return 'Formato não suportado. Envie uma imagem JPEG, PNG ou WebP.';
  }
  if (file.size > IMAGE_UPLOAD.maxBytes) {
    return `A imagem deve ter no máximo ${MAX_MB} MB.`;
  }
  return null;
}

/** Valor do atributo `accept` do <input type="file">. */
export const IMAGE_ACCEPT = IMAGE_UPLOAD.mimeTypes.join(',');
