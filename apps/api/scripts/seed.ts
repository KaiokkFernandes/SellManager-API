// Popula o banco de DESENVOLVIMENTO para testar paginação e busca de verdade.
/* eslint-disable no-console -- script de linha de comando */
// Uso: pnpm --filter api seed
//
// Usuários: um por papel (ADMIN, MANAGER, SELLER).
// Idempotente: apaga só o que o próprio seed criou (clientes @seed.sellmanager.dev,
// os pedidos deles, os produtos e categorias da lista abaixo que não estejam em
// uso fora do seed) e recria. Gera pedidos em todos os status, com histórico,
// produtos abaixo do estoque mínimo e entradas/ajustes de estoque. Usa os services, então estoque, preços e totais seguem as
// mesmas regras da API.
import type { OrderAction, Role } from '@sellmanager/shared';
import { env } from '@config/env';
import { CreateCustomerService } from '@modules/customers/services/CreateCustomerService';
import { CreateOrderService } from '@modules/orders/services/CreateOrderService';
import { ChangeOrderStatusService } from '@modules/orders/services/ChangeOrderStatusService';
import type { Product } from '@modules/products/domain/entities/Product';
import { CreateCategoryService } from '@modules/categories/services/CreateCategoryService';
import { CreateProductService } from '@modules/products/services/CreateProductService';
import { RecordStockMovementService } from '@modules/products/services/RecordStockMovementService';
import { CreateUserService } from '@modules/users/services/CreateUserService';
import { makeContainer } from '@shared/container';
import { AppDataSource } from '@shared/infra/typeorm/data-source';

/** Credenciais SÓ de desenvolvimento, uma por papel (documentadas no README). */
export const SEED_USERS = [
  {
    name: 'Admin',
    email: 'admin@sellmanager.dev',
    password: 'admin12345',
    role: 'ADMIN',
  },
  {
    name: 'Gerente',
    email: 'gerente@sellmanager.dev',
    password: 'gerente12345',
    role: 'MANAGER',
  },
  {
    name: 'Vendedor',
    email: 'vendedor@sellmanager.dev',
    password: 'vendedor12345',
    role: 'SELLER',
  },
] as const satisfies readonly {
  name: string;
  email: string;
  password: string;
  role: Role;
}[];
const SEED_DOMAIN = 'seed.sellmanager.dev';

const FIRST_NAMES = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Elisa',
  'Fábio',
  'Gabriela',
  'Henrique',
  'Isabela',
  'João',
  'Karina',
  'Lucas',
  'Mariana',
  'Nicolas',
  'Olívia',
];
const LAST_NAMES = [
  'Souza',
  'Lima',
  'Oliveira',
  'Santos',
  'Pereira',
  'Costa',
  'Almeida',
  'Ribeiro',
  'Carvalho',
  'Gomes',
];

// [nome, preço em reais, estoque, categoria] — alguns com estoque baixo ou zerado de propósito
const PRODUCTS: [string, number, number, string][] = [
  ['Teclado mecânico ABNT2', 349.9, 25, 'Periféricos'],
  ['Mouse sem fio', 129.9, 40, 'Periféricos'],
  ['Monitor 24" Full HD', 899, 8, 'Monitores'],
  ['Monitor 27" 4K', 2199, 3, 'Monitores'],
  ['Headset gamer', 279.9, 15, 'Áudio e vídeo'],
  ['Webcam Full HD', 249.9, 0, 'Áudio e vídeo'],
  ['Cabo HDMI 2m', 39.9, 120, 'Cabos e adaptadores'],
  ['Cabo USB-C 1m', 29.9, 200, 'Cabos e adaptadores'],
  ['Hub USB-C 7 em 1', 219.9, 12, 'Cabos e adaptadores'],
  ['SSD NVMe 1TB', 459.9, 18, 'Armazenamento'],
  ['SSD SATA 480GB', 199.9, 4, 'Armazenamento'],
  ['HD externo 2TB', 449, 7, 'Armazenamento'],
  ['Pendrive 64GB', 49.9, 90, 'Armazenamento'],
  ['Cartão microSD 128GB', 79.9, 60, 'Armazenamento'],
  ['Roteador Wi-Fi 6', 599, 9, 'Redes'],
  ['Repetidor Wi-Fi', 149.9, 2, 'Redes'],
  ['Switch 8 portas', 189.9, 14, 'Redes'],
  ['Notebook 14" i5', 3899, 5, 'Computadores'],
  ['Notebook 15" Ryzen 7', 4999, 1, 'Computadores'],
  ['Suporte para notebook', 89.9, 33, 'Periféricos'],
  ['Mousepad grande', 59.9, 70, 'Periféricos'],
  ['Cadeira ergonômica', 1299, 6, 'Periféricos'],
  ['Mesa digitalizadora', 399, 0, 'Periféricos'],
  ['Caixa de som Bluetooth', 199, 22, 'Áudio e vídeo'],
  ['Fone Bluetooth', 249, 30, 'Áudio e vídeo'],
  ['Carregador 65W USB-C', 179.9, 26, 'Energia'],
  ['Power bank 20000mAh', 169.9, 19, 'Energia'],
  ['Filtro de linha', 69.9, 45, 'Energia'],
  ['Nobreak 600VA', 549, 3, 'Energia'],
  ['Microfone condensador', 329.9, 11, 'Áudio e vídeo'],
  ['Ring light', 119.9, 16, 'Áudio e vídeo'],
  ['Estabilizador', 229, 0, 'Energia'],
  ['Leitor de cartão', 34.9, 52, 'Cabos e adaptadores'],
  ['Adaptador HDMI para VGA', 44.9, 38, 'Cabos e adaptadores'],
  ['Teclado numérico', 79.9, 21, 'Periféricos'],
  ['Mouse vertical', 189, 4, 'Periféricos'],
  ['Impressora multifuncional', 899, 5, 'Impressão'],
  ['Cartucho preto', 89.9, 64, 'Impressão'],
  ['Papel A4 (500 folhas)', 32.9, 150, 'Impressão'],
  ['Smartwatch', 699, 10, 'Mobile'],
  ['Tablet 10"', 1499, 7, 'Mobile'],
  ['Capa para tablet', 79, 28, 'Mobile'],
  ['Película de vidro', 24.9, 300, 'Mobile'],
  ['Controle sem fio', 349, 9, 'Periféricos'],
  ['Placa de vídeo 8GB', 2799, 2, 'Hardware'],
  ['Memória RAM 16GB', 329, 17, 'Hardware'],
  ['Fonte 650W', 449, 6, 'Hardware'],
  ['Gabinete ATX', 389, 5, 'Hardware'],
  ['Cooler para CPU', 159, 13, 'Hardware'],
  ['Pasta térmica', 29.9, 80, 'Hardware'],
];
const CATEGORIES = [...new Set(PRODUCTS.map(([, , , category]) => category))];

/** Mínimo de 5 para itens caros ou de giro baixo: os com pouco estoque entram no alerta. */
function minStockFor(price: number, quantity: number): number {
  if (quantity <= 4) return 5;
  return price >= 1000 ? 2 : Math.max(3, Math.round(quantity / 5));
}

/** Dias de histórico de vendas e ritmo médio de pedidos por dia útil. */
const HISTORY_DAYS = 365;
const ORDERS_PER_WEEKDAY = 8;

/**
 * Quantos pedidos num dia: dia útil > fim de semana, novembro e dezembro mais
 * fortes, janeiro mais fraco, e a loja crescendo ao longo do ano.
 */
function ordersOn(day: Date, daysAgo: number, next: () => number): number {
  const weekday = day.getUTCDay();
  const weekend = weekday === 0 || weekday === 6 ? 0.45 : 1;
  const month = day.getUTCMonth();
  const season = month === 10 || month === 11 ? 1.6 : month === 0 ? 0.75 : 1;
  const growth = 0.65 + 0.35 * (1 - daysAgo / HISTORY_DAYS);
  const expected = ORDERS_PER_WEEKDAY * weekend * season * growth;
  return Math.max(0, Math.round(expected * (0.6 + next() * 0.8)));
}

/**
 * Caminho do pedido pela idade: antigos quase todos entregues (~8% cancelados,
 * de pendente e de pago); recentes ainda em andamento.
 */
function pathFor(daysAgo: number, roll: number): OrderAction[] {
  // cancelamento acontece no dia seguinte: só em pedidos de ontem para trás
  if (daysAgo >= 1 && roll < 0.04) return ['cancel'];
  if (daysAgo >= 1 && roll < 0.08) return ['pay', 'cancel'];
  if (daysAgo >= 7) return ['pay', 'ship', 'deliver'];
  if (daysAgo >= 3)
    return roll < 0.6 ? ['pay', 'ship', 'deliver'] : ['pay', 'ship'];
  if (daysAgo >= 1) return roll < 0.5 ? ['pay', 'ship'] : ['pay'];
  return roll < 0.5 ? ['pay'] : [];
}

/** Horas depois da criação em que cada passo aconteceu. */
const STEP_HOURS: Record<OrderAction, number> = {
  pay: 2,
  ship: 22,
  deliver: 48,
  cancel: 18,
};

const CANCEL_REASONS = [
  'Cliente desistiu da compra',
  'Pagamento não confirmado',
  'Cliente pediu outro modelo',
];

/** PRNG determinístico: o seed gera sempre os mesmos dados. */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2 ** 31;
    return state / 2 ** 31;
  };
}

function deburr(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Leva o pedido para o passado: criado em `at` e cada mudança de status
 * `offsets[i]` horas depois; pedido (paid_at/canceled_at), histórico e
 * movimentações de estoque acompanham.
 */
async function backdateOrder(
  orderId: string,
  at: Date,
  offsets: number[],
): Promise<void> {
  await AppDataSource.query(
    `WITH steps AS (
       SELECT id, row_number() OVER (ORDER BY created_at, id) AS step
       FROM order_status_history WHERE order_id = $1
     )
     UPDATE order_status_history h
       SET created_at = $2::timestamptz + ($3::int[])[steps.step] * interval '1 hour'
       FROM steps WHERE h.id = steps.id`,
    [orderId, at, [0, ...offsets]],
  );
  await AppDataSource.query(
    `UPDATE orders o SET
       created_at = (SELECT min(created_at) FROM order_status_history WHERE order_id = o.id),
       updated_at = (SELECT max(created_at) FROM order_status_history WHERE order_id = o.id),
       paid_at = (SELECT min(created_at) FROM order_status_history
         WHERE order_id = o.id AND to_status = 'paid'),
       canceled_at = (SELECT max(created_at) FROM order_status_history
         WHERE order_id = o.id AND to_status = 'canceled')
     WHERE o.id = $1`,
    [orderId],
  );
  // venda na criação; devolução no instante do cancelamento
  await AppDataSource.query(
    `UPDATE stock_movements m SET created_at = (
       SELECT CASE WHEN m.type = 'SALE' THEN min(h.created_at)
         ELSE max(h.created_at) FILTER (WHERE h.to_status = 'canceled') END
       FROM order_status_history h WHERE h.order_id = m.order_id
     ) WHERE m.order_id = $1`,
    [orderId],
  );
}

async function cleanPreviousSeed(): Promise<void> {
  const seedCustomers = `SELECT id FROM customers WHERE email LIKE '%@${SEED_DOMAIN}'`;
  const seedOrders = `SELECT id FROM orders WHERE customer_id IN (${seedCustomers})`;
  // saídas/devoluções dos pedidos do seed somem junto com eles; produtos que
  // sobrevivem (em pedidos de fora do seed) voltam a bater com a soma do livro
  const touched = await AppDataSource.query<{ product_id: string }[]>(
    // CTE: o TypeORM devolve [linhas, contagem] para DELETE puro
    `WITH removed AS (DELETE FROM stock_movements WHERE order_id IN (${seedOrders}) RETURNING product_id)
       SELECT DISTINCT product_id FROM removed`,
  );
  await AppDataSource.query(
    `UPDATE products p SET quantity = COALESCE((SELECT SUM(m.quantity) FROM stock_movements m WHERE m.product_id = p.id), 0)
       WHERE p.id = ANY($1)`,
    [touched.map(row => row.product_id)],
  );
  await AppDataSource.query(
    `DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id IN (${seedCustomers}))`,
  );
  await AppDataSource.query(
    `DELETE FROM orders WHERE customer_id IN (${seedCustomers})`,
  );
  await AppDataSource.query(
    `DELETE FROM customers WHERE email LIKE '%@${SEED_DOMAIN}'`,
  );
  await AppDataSource.query(
    `DELETE FROM products p WHERE lower(p.name) = ANY($1)
       AND NOT EXISTS (SELECT 1 FROM order_items i WHERE i.product_id = p.id)`,
    [PRODUCTS.map(([name]) => name.toLowerCase())],
  );
  // categorias do seed que não ficaram com produtos de fora dele
  await AppDataSource.query(
    `DELETE FROM categories c WHERE c.name = ANY($1)
       AND NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id)`,
    [CATEGORIES],
  );
}

async function main(): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error('O seed é só para desenvolvimento (NODE_ENV=production).');
  }

  await AppDataSource.initialize();
  const container = makeContainer(AppDataSource);
  const { users, customers, products } = container.repositories;
  const next = random(42);
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(next() * items.length)];

  await cleanPreviousSeed();

  // cria os que faltam; os existentes voltam ao papel e à senha do seed, ativos
  const { hash } = container.providers;
  for (const seedUser of SEED_USERS) {
    const existing = await users.findByEmail(seedUser.email);
    if (!existing) {
      await new CreateUserService(users, hash).execute(seedUser);
    } else {
      await users.save({
        ...existing,
        name: seedUser.name,
        role: seedUser.role,
        active: true,
        password: await hash.generateHash(seedUser.password),
      });
    }
  }

  // pedidos do seed ficam no histórico como criados/movidos pelos usuários do seed
  const actorByRole = Object.fromEntries(
    await Promise.all(
      SEED_USERS.map(async ({ role, email }) => [
        role,
        (await users.findByEmail(email))?.id ?? '',
      ]),
    ),
  ) as Record<(typeof SEED_USERS)[number]['role'], string>;

  const createdCustomers = [];
  const usedNames = new Set<string>();
  while (createdCustomers.length < 120) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    const email = `${deburr(name).replace(' ', '.')}@${SEED_DOMAIN}`;
    createdCustomers.push(
      await new CreateCustomerService(customers).execute({ name, email }),
    );
  }

  const { categories } = container.repositories;
  const categoryId = new Map<string, string>();
  for (const name of CATEGORIES) {
    const category =
      (await categories.findByName(name)) ??
      (await new CreateCategoryService(categories).execute({ name }));
    categoryId.set(name, category.id);
  }

  const createdProducts: Product[] = [];
  for (const [name, price, quantity, category] of PRODUCTS) {
    if (await products.findByName(name)) continue; // está em pedidos de fora do seed
    createdProducts.push(
      await new CreateProductService(
        container.productsUnitOfWork,
        categories,
      ).execute({
        name,
        price,
        quantity,
        category_id: categoryId.get(category) ?? null,
        min_stock: minStockFor(price, quantity),
        created_by: actorByRole.ADMIN,
      }),
    );
  }
  // o saldo inicial "chegou" antes de todos os pedidos (a linha do tempo do livro fecha)
  await AppDataSource.query(
    `UPDATE stock_movements SET created_at = now() - interval '400 days'
       WHERE type = 'INITIAL' AND product_id = ANY($1)`,
    [createdProducts.map(product => product.id)],
  );

  const createOrder = new CreateOrderService(
    customers,
    container.ordersUnitOfWork,
  );
  const changeStatus = new ChangeOrderStatusService(container.ordersUnitOfWork);
  const record = new RecordStockMovementService(container.productsUnitOfWork);
  const inStock = createdProducts.filter(product => product.quantity >= 10);
  // quem vende: vendedor na maior parte, gerente e admin também
  const sellers = [
    ...Array<string>(6).fill(actorByRole.SELLER),
    ...Array<string>(3).fill(actorByRole.MANAGER),
    actorByRole.ADMIN,
  ];
  // clientes "fiéis" compram mais (top clientes com o que mostrar)
  const loyal = createdCustomers.slice(0, 15);
  const now = Date.now();
  let orders = 0;
  let restocks = 0;

  /**
   * Relógio simulado: o cancelamento (que devolve estoque) só é executado
   * quando a simulação chega à hora dele. Assim a ordem em que as
   * movimentações são gravadas é a mesma das datas, e o "saldo após" de cada
   * uma fecha com a soma em ordem cronológica.
   */
  interface Scheduled {
    orderId: string;
    at: Date;
    offsets: number[];
    cancelAt: number;
  }
  const cancels: Scheduled[] = [];
  const runCancelsUntil = async (time: number) => {
    cancels.sort((a, b) => a.cancelAt - b.cancelAt);
    while (cancels.length > 0 && (cancels[0]?.cancelAt ?? Infinity) <= time) {
      const due = cancels.shift();
      if (!due) break;
      await changeStatus.execute({
        id: due.orderId,
        action: 'cancel',
        changed_by: actorByRole.MANAGER,
        reason: pick(CANCEL_REASONS),
      });
      await backdateOrder(due.orderId, due.at, due.offsets);
    }
  };

  for (let daysAgo = HISTORY_DAYS; daysAgo >= 0; daysAgo -= 1) {
    const day = new Date(now - daysAgo * 86_400_000);
    const count = ordersOn(day, daysAgo, next);
    for (let index = 0; index < count; index += 1) {
      // horário comercial (8h–20h em São Paulo = 11h–23h UTC), em ordem no dia
      // instantes distintos (sem empate de horário com outro pedido)
      const opening = new Date(day).setUTCHours(11, 0, 0, 0);
      const at = new Date(
        opening + Math.floor((12 * 3_600_000 * (index + next())) / count),
      );
      if (at.getTime() > now) continue;
      const entryAt = at.getTime() - 60_000;

      const lines = new Map<string, number>();
      const size = 1 + Math.floor(next() * next() * 4);
      while (lines.size < size)
        lines.set(pick(inStock).id, 1 + Math.floor(next() * next() * 4));

      // repõe antes de faltar (entrada registrada 1 min antes do pedido)
      await runCancelsUntil(entryAt);
      for (const [id, units] of lines) {
        const product = await products.findById(id);
        if (product && product.quantity < units + 10) {
          const entry = await record.execute({
            product_id: id,
            type: 'ENTRY',
            quantity: 60,
            reason: 'Reposição do fornecedor',
            created_by: actorByRole.MANAGER,
          });
          await AppDataSource.query(
            'UPDATE stock_movements SET created_at = $2 WHERE id = $1',
            [entry.id, new Date(entryAt)],
          );
          restocks += 1;
        }
      }
      await runCancelsUntil(at.getTime());

      const creator = pick(sellers);
      const order = await createOrder.execute({
        created_by: creator,
        customer_id: pick(next() < 0.4 ? loyal : createdCustomers).id,
        products: [...lines].map(([id, quantity]) => ({ id, quantity })),
      });
      const path = pathFor(daysAgo, next());
      const offsets = path.map(action => STEP_HOURS[action]);
      for (const action of path) {
        if (action === 'cancel') continue; // fica na fila do relógio
        await changeStatus.execute({
          id: order.id,
          action,
          // quem criou registra o pagamento; envio e entrega são do gerente
          changed_by: action === 'pay' ? creator : actorByRole.MANAGER,
        });
      }
      if (path.includes('cancel')) {
        cancels.push({
          orderId: order.id,
          at,
          offsets,
          cancelAt: at.getTime() + STEP_HOURS.cancel * 3_600_000,
        });
      } else {
        await backdateOrder(order.id, at, offsets);
      }
      orders += 1;
    }
  }
  await runCancelsUntil(Infinity);

  // entradas de mercadoria e ajustes manuais (registrados agora, depois dos pedidos)
  const byName = (name: string) =>
    createdProducts.find(product => product.name === name);
  const manual = [
    ['Webcam Full HD', 'ENTRY', 12, undefined],
    ['Monitor 24" Full HD', 'ENTRY', 6, 'Nota fiscal 4521'],
    ['Pendrive 64GB', 'ENTRY', 30, undefined],
    ['Cabo HDMI 2m', 'ADJUSTMENT', -3, 'Avaria no transporte'],
    [
      'Película de vidro',
      'ADJUSTMENT',
      -10,
      'Inventário: diferença na contagem',
    ],
  ] as const;
  for (const [name, type, quantity, reason] of manual) {
    const product = byName(name);
    if (!product) continue;
    await record.execute({
      product_id: product.id,
      type,
      quantity,
      reason,
      created_by: actorByRole.MANAGER,
    });
  }

  const [{ low }] = await AppDataSource.query<[{ low: number }]>(
    'SELECT count(*)::int AS low FROM products WHERE quantity < min_stock',
  );

  console.log(
    `Seed concluído: ${createdCustomers.length} clientes, ${CATEGORIES.length} categorias, ${createdProducts.length} produtos (${low} abaixo do mínimo), ${orders} pedidos em ${HISTORY_DAYS} dias, ${restocks} reposições e ${manual.length} movimentações manuais.`,
  );
  for (const { role, email, password } of SEED_USERS) {
    console.log(`  ${role.padEnd(7)} ${email} / ${password}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => AppDataSource.isInitialized && AppDataSource.destroy());
