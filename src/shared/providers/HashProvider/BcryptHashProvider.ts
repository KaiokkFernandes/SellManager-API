import { compare, hash } from 'bcryptjs';
import { IHashProvider } from './IHashProvider';

export class BcryptHashProvider implements IHashProvider {
  constructor(private readonly saltRounds = 8) {}

  public async generateHash(payload: string): Promise<string> {
    return hash(payload, this.saltRounds);
  }

  public async compareHash(payload: string, hashed: string): Promise<boolean> {
    return compare(payload, hashed);
  }
}
