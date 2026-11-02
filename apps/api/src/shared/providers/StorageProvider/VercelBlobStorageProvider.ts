import crypto from 'node:crypto';
import { del, put } from '@vercel/blob';
import { IMAGE_EXTENSIONS } from '@shared/domain/imageType';
import { logger } from '@shared/logger';
import { IFileToStore, IStorageProvider } from './IStorageProvider';

/** Provider de produção: as imagens ficam públicas no Vercel Blob. */
export class VercelBlobStorageProvider implements IStorageProvider {
  constructor(private readonly token: string) {}

  public async save({ content, contentType }: IFileToStore): Promise<string> {
    const name = `uploads/${crypto.randomUUID()}${IMAGE_EXTENSIONS[contentType]}`;
    const { url } = await put(name, content, {
      access: 'public',
      contentType,
      token: this.token,
    });
    return url;
  }

  public async delete(url: string): Promise<void> {
    try {
      await del(url, { token: this.token });
    } catch (error) {
      logger.error({ err: error }, 'Falha ao apagar o arquivo do Blob');
    }
  }
}
