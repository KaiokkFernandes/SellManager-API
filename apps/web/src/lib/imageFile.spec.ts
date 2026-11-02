import { ApiClientError } from '@sellmanager/api-client';
import { describe, expect, it } from 'vitest';
import { getUploadErrorMessage, validateImageFile } from './imageFile';

describe('imageFile', () => {
  it('recusa arquivo acima do limite já no navegador', () => {
    const file = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'a.png', {
      type: 'image/png',
    });

    expect(validateImageFile(file)).toBe('A imagem deve ter no máximo 4 MB.');
  });

  it('o 413 da API ou da Vercel mostra o limite', () => {
    const fromVercel = new ApiClientError(413, 'Request Entity Too Large');

    expect(getUploadErrorMessage(fromVercel)).toBe(
      'A imagem deve ter no máximo 4 MB.',
    );
  });

  it('demais erros seguem o texto padrão', () => {
    expect(getUploadErrorMessage(new ApiClientError(0, undefined))).toMatch(
      /conectar ao servidor/,
    );
  });
});
