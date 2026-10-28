import { IUsersRepository } from './IUsersRepository';

/** Executa o trabalho em uma transação; o repositório recebido participa dela. */
export interface IUsersUnitOfWork {
  run<T>(work: (users: IUsersRepository) => Promise<T>): Promise<T>;
}
