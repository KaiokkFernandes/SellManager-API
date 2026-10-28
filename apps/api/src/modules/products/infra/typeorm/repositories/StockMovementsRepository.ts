import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { UserSchema } from '@modules/users/infra/typeorm/schemas/UserSchema';
import {
  PageResult,
  PaginationParams,
  toSkipTake,
} from '@shared/domain/pagination';
import { StockMovement } from '../../../domain/entities/StockMovement';
import {
  IAddStockMovementDTO,
  IStockMovementsRepository,
} from '../../../domain/repositories/IStockMovementsRepository';
import {
  StockMovementRow,
  StockMovementSchema,
} from '../schemas/StockMovementSchema';

export class StockMovementsRepository implements IStockMovementsRepository {
  private readonly rows: Repository<StockMovementRow>;

  constructor(private readonly connection: DataSource | EntityManager) {
    this.rows = connection.getRepository(StockMovementSchema);
  }

  /** Nome de quem registrou, em uma consulta para a página inteira. */
  private async hydrate(rows: StockMovementRow[]): Promise<StockMovement[]> {
    const userIds = [...new Set(rows.flatMap(row => row.created_by_id ?? []))];
    const users = userIds.length
      ? await this.connection.getRepository(UserSchema).find({
          select: { id: true, name: true },
          where: { id: In(userIds) },
        })
      : [];
    const nameById = new Map(users.map(({ id, name }) => [id, name]));

    return rows.map(({ created_by_id, ...row }) => ({
      ...row,
      created_by: created_by_id
        ? { id: created_by_id, name: nameById.get(created_by_id) ?? '' }
        : null,
    }));
  }

  public async add(data: IAddStockMovementDTO): Promise<StockMovement> {
    const row = await this.rows.save(this.rows.create(data));
    const [movement] = await this.hydrate([row]);
    if (!movement) throw new Error('Stock movement not saved');
    return movement;
  }

  public async findByProduct(
    productId: string,
    pagination: PaginationParams,
  ): Promise<PageResult<StockMovement>> {
    const [rows, total] = await this.rows.findAndCount({
      where: { product_id: productId },
      order: { created_at: 'DESC', id: 'ASC' },
      ...toSkipTake(pagination),
    });
    return { items: await this.hydrate(rows), total };
  }
}
