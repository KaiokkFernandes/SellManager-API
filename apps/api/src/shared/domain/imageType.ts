import type { ImageMimeType } from '@sellmanager/shared';

const startsWith = (content: Buffer, bytes: number[], offset = 0) =>
  bytes.every((byte, index) => content[offset + index] === byte);

const ascii = (text: string) => [...Buffer.from(text, 'ascii')];

/**
 * Tipo real da imagem pela assinatura do conteúdo. O Content-Type do upload vem
 * do cliente e não prova nada. Devolve undefined se não for um formato aceito.
 */
export function detectImageType(content: Buffer): ImageMimeType | undefined {
  if (startsWith(content, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(content, [0x89, ...ascii('PNG'), 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }
  if (
    startsWith(content, ascii('RIFF')) &&
    startsWith(content, ascii('WEBP'), 8)
  ) {
    return 'image/webp';
  }
  return undefined;
}

/** Extensão pelo tipo confirmado, nunca pelo nome enviado pelo cliente. */
export const IMAGE_EXTENSIONS: Record<ImageMimeType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
