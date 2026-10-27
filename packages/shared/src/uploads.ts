import { z } from 'zod';

/**
 * Limites de upload de imagem (avatar e produto). Fonte única: o multer da API
 * e a validação do front usam estas mesmas constantes.
 */
export const IMAGE_UPLOAD = {
  maxBytes: 2 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export type ImageMimeType = (typeof IMAGE_UPLOAD.mimeTypes)[number];

export function isAllowedImageType(type: string): type is ImageMimeType {
  return (IMAGE_UPLOAD.mimeTypes as readonly string[]).includes(type);
}

/** Campo de arquivo binário em multipart/form-data. */
export function imageFileSchema() {
  return z.string().meta({
    format: 'binary',
    description: 'Imagem jpeg, png ou webp até 2 MB',
  });
}
