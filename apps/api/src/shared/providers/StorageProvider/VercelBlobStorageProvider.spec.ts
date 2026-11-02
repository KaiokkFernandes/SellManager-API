import { del, put } from '@vercel/blob';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VercelBlobStorageProvider } from './VercelBlobStorageProvider';

vi.mock('@vercel/blob', () => ({ put: vi.fn(), del: vi.fn() }));

describe('VercelBlobStorageProvider', () => {
  const storage = new VercelBlobStorageProvider('token-de-teste');
  const url = 'https://x.public.blob.vercel-storage.com/uploads/a.png';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia público, com o tipo confirmado, e devolve a URL do Blob', async () => {
    vi.mocked(put).mockResolvedValue({ url } as never);
    const content = Buffer.from('imagem');

    const saved = await storage.save({ content, contentType: 'image/png' });

    expect(saved).toBe(url);
    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^uploads\/[0-9a-f-]{36}\.png$/),
      content,
      {
        access: 'public',
        contentType: 'image/png',
        token: 'token-de-teste',
      },
    );
  });

  it('apaga pela URL', async () => {
    await storage.delete(url);

    expect(del).toHaveBeenCalledWith(url, { token: 'token-de-teste' });
  });

  it('falha ao apagar não vira erro: o registro já foi salvo', async () => {
    vi.mocked(del).mockRejectedValue(new Error('blob fora do ar'));

    await expect(storage.delete(url)).resolves.toBeUndefined();
  });
});
