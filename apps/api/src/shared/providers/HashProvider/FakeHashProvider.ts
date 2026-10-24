import { IHashProvider } from './IHashProvider';

export class FakeHashProvider implements IHashProvider {
  public generateHash(payload: string): Promise<string> {
    return Promise.resolve(`hashed:${payload}`);
  }

  public compareHash(payload: string, hashed: string): Promise<boolean> {
    return Promise.resolve(hashed === `hashed:${payload}`);
  }
}
