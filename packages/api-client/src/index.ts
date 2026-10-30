export { createApiClient, filenameFrom, unwrap, unwrapFile } from './client';
export type { DownloadedFile } from './client';
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
export type OrderDetails = Schemas['OrderDetails'];
export type OrderStatusChange = Schemas['OrderStatusChange'];
export type StockMovement = Schemas['StockMovement'];
export type Category = Schemas['Category'];
export type MetricsSummary = Schemas['MetricsSummary'];
export type RevenueSeries = Schemas['RevenueSeries'];
export type TopProducts = Schemas['TopProducts'];
export type TopCustomers = Schemas['TopCustomers'];
export type SalesByCategory = Schemas['SalesByCategory'];
export type OrdersByStatus = Schemas['OrdersByStatus'];
