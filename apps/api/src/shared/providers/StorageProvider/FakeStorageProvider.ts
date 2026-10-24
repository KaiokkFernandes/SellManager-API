import { IStorageProvider } from './IStorageProvider';

export class FakeStorageProvider implements IStorageProvider {
  public readonly files = new Set<string>();

  public saveFile(file: string): Promise<string> {
    this.files.add(file);
    return Promise.resolve(file);
  }

  public deleteFile(file: string): Promise<void> {
    this.files.delete(file);
    return Promise.resolve();
  }
}
