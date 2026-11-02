import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { IMAGE_EXTENSIONS } from '@shared/domain/imageType';
import { logger } from '@shared/logger';
import { IFileToStore, IStorageProvider } from './IStorageProvider';

/** Provider de desenvolvimento: grava na pasta local, servida pela própria API. */
export class DiskStorageProvider implements IStorageProvider {
  constructor(
    private readonly uploadsFolder: string,
    private readonly publicUrl: string,
  ) {}

  public async save({ content, contentType }: IFileToStore): Promise<string> {
    const name = `${crypto.randomUUID()}${IMAGE_EXTENSIONS[contentType]}`;
    await fs.promises.mkdir(this.uploadsFolder, { recursive: true });
    await fs.promises.writeFile(
      path.resolve(this.uploadsFolder, name),
      content,
    );
    return `${this.publicUrl}/${name}`;
  }

  public async delete(url: string): Promise<void> {
    try {
      // basename: o caminho nunca sai da pasta, seja qual for o valor do banco
      await fs.promises.rm(
        path.resolve(this.uploadsFolder, path.basename(url)),
        {
          force: true,
        },
      );
    } catch (error) {
      logger.error({ err: error }, 'Falha ao apagar o arquivo');
    }
  }
}
