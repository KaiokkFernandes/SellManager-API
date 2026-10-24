import fs from 'node:fs';
import path from 'node:path';
import { IStorageProvider } from './IStorageProvider';

export class DiskStorageProvider implements IStorageProvider {
  constructor(
    private readonly tmpFolder: string,
    private readonly uploadsFolder: string,
  ) {}

  public async saveFile(file: string): Promise<string> {
    await fs.promises.mkdir(this.uploadsFolder, { recursive: true });
    await fs.promises.rename(
      path.resolve(this.tmpFolder, file),
      path.resolve(this.uploadsFolder, file),
    );
    return file;
  }

  public async deleteFile(file: string): Promise<void> {
    await fs.promises.rm(path.resolve(this.uploadsFolder, file), {
      force: true,
    });
  }
}
