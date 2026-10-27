export { createApiClient, unwrap } from './client';
export type {
  ApiClientOptions,
  SellManagerClient,
  UploadOptions,
} from './client';
export { ApiClientError, isApiError } from './errors';
export type { ApiError, ApiErrorCode, ValidationIssue } from './errors';
export type { components, operations, paths } from './generated/openapi';

import type { components } from './generated/openapi';

type Schemas = components['schemas'];

// Atalhos para os DTOs mais usados (gerados do openapi.json).
export type User = Schemas['User'];
export type Session = Schemas['Session'];
export type Product = Schemas['Product'];
export type Customer = Schemas['Customer'];
export type Order = Schemas['Order'];
export type OrderItem = Schemas['OrderItem'];
