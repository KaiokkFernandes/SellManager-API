import type { routes } from '@sellmanager/shared';
import type { RouteHandler } from '@shared/http/contract/mountRoute';
import { GetMetricsSummaryService } from '../../../services/GetMetricsSummaryService';
import { GetOrdersByStatusService } from '../../../services/GetOrdersByStatusService';
import { GetRevenueSeriesService } from '../../../services/GetRevenueSeriesService';
import { GetSalesByCategoryService } from '../../../services/GetSalesByCategoryService';
import { GetTopCustomersService } from '../../../services/GetTopCustomersService';
import { GetTopProductsService } from '../../../services/GetTopProductsService';

interface MetricsServices {
  summary: GetMetricsSummaryService;
  revenue: GetRevenueSeriesService;
  topProducts: GetTopProductsService;
  topCustomers: GetTopCustomersService;
  categories: GetSalesByCategoryService;
  status: GetOrdersByStatusService;
}

type Routes = typeof routes.metrics;

/** As respostas já saem dos services no formato do contrato (centavos, datas locais). */
export class MetricsController {
  constructor(private readonly services: MetricsServices) {}

  public summary: RouteHandler<Routes['summary']> = async ({
    input,
    request,
    reply,
  }) => {
    reply(200, await this.services.summary.execute(input.query, request.user));
  };

  public revenue: RouteHandler<Routes['revenue']> = async ({
    input,
    request,
    reply,
  }) => {
    reply(200, await this.services.revenue.execute(input.query, request.user));
  };

  public topProducts: RouteHandler<Routes['topProducts']> = async ({
    input,
    request,
    reply,
  }) => {
    reply(
      200,
      await this.services.topProducts.execute(input.query, request.user),
    );
  };

  public topCustomers: RouteHandler<Routes['topCustomers']> = async ({
    input,
    request,
    reply,
  }) => {
    reply(
      200,
      await this.services.topCustomers.execute(input.query, request.user),
    );
  };

  public categories: RouteHandler<Routes['categories']> = async ({
    input,
    request,
    reply,
  }) => {
    reply(
      200,
      await this.services.categories.execute(input.query, request.user),
    );
  };

  public status: RouteHandler<Routes['status']> = async ({
    input,
    request,
    reply,
  }) => {
    reply(200, await this.services.status.execute(input.query, request.user));
  };
}
