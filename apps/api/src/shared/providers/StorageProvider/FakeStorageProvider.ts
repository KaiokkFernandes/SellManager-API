import { IFileToStore, IStorageProvider } from './IStorageProvider';

export class FakeStorageProvider implements IStorageProvider {
  public readonly files = new Set<string>();

  private count = 0;

  public save({ contentType }: IFileToStore): Promise<string> {
    this.count += 1;
    const url = `https://blob.test/${this.count}.${contentType.split('/')[1]}`;
    this.files.add(url);
    return Promise.resolve(url);
  }

  public delete(url: string): Promise<void> {
    this.files.delete(url);
    return Promise.resolve();
  }
}
