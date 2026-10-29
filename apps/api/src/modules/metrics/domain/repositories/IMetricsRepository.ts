import { RawSalesFigures } from '../figures';
import { LocalRange } from '../period';

export interface IMetricsFilter {
  timezone: string;
  /** Só pedidos criados por este usuário (escopo "own"). */
  createdBy?: string;
}

/** Consultas agregadas no banco: nunca carregam pedidos em memória. */
export interface IMetricsRepository {
  salesFigures(
    range: LocalRange,
    filter: IMetricsFilter,
  ): Promise<RawSalesFigures>;
}
