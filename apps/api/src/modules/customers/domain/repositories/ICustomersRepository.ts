import { Customer } from '../entities/Customer';
import type { CustomerSort } from '@sellmanager/shared';
import type { IListFilter } from '@shared/domain/listing';
import { PageResult, PaginationParams } from '@shared/domain/pagination';

export interface ICreateCustomerDTO {
  name: string;
  email: string;
}

/** Busca em nome ou e-mail; padrão: nome ascendente. */
export type IFindCustomersFilter = IListFilter<CustomerSort>;

export interface ICustomersRepository {
  findAll(
    filter: IFindCustomersFilter,
    pagination: PaginationParams,
  ): Promise<PageResult<Customer>>;
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  create(data: ICreateCustomerDTO): Promise<Customer>;
  save(customer: Customer): Promise<Customer>;
  remove(customer: Customer): Promise<void>;
}
