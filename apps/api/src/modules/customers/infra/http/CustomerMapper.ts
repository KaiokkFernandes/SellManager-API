import type { Customer as CustomerResponse } from '@sellmanager/shared';
import { Customer } from '../../domain/entities/Customer';

export function toCustomerResponse(customer: Customer): CustomerResponse {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    created_at: customer.created_at.toISOString(),
    updated_at: customer.updated_at.toISOString(),
  };
}
