import { describe, expect, it } from 'vitest';
import { detectImageType } from './imageType';

const webp = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.alloc(4),
  Buffer.from('WEBPVP8 '),
]);

describe('detectImageType', () => {
  it.each([
    ['image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00])],
    [
      'image/png',
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
    ],
    ['image/webp', webp],
  ])('reconhece %s pelo conteúdo', (type, content) => {
    expect(detectImageType(content)).toBe(type);
  });

  it.each([
    ['HTML', Buffer.from('<script>alert(1)</script>')],
    ['PDF', Buffer.from('%PDF-1.7')],
    ['SVG', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')],
    ['RIFF que não é WebP', Buffer.from('RIFF0000WAVEfmt ')],
    ['arquivo vazio', Buffer.alloc(0)],
  ])('recusa %s', (_name, content) => {
    expect(detectImageType(content)).toBeUndefined();
  });
});
