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

/**
 * Destino de cada pedido do seed: cobre os 5 status, inclusive cancelamento
 * a partir de pendente e de pago.
 */
const ORDER_PATHS: readonly (readonly OrderAction[])[] = [
  [],
  ['pay'],
  ['pay', 'ship'],
  ['pay', 'ship', 'deliver'],
  ['cancel'],
  ['pay', 'cancel'],
];
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
 * Leva o pedido para o passado: criado há `daysAgo` dias e cada mudança de
 * status 20 h depois da anterior; as movimentações de estoque acompanham.
 */
async function backdateOrder(
  orderId: string,
  daysAgo: number,
  hour: number,
): Promise<void> {
  await AppDataSource.query(
    `WITH base AS (SELECT now() - make_interval(days => $2, hours => $3) AS at),
     steps AS (
       SELECT id, row_number() OVER (ORDER BY created_at, id) - 1 AS step
       FROM order_status_history WHERE order_id = $1
     )
     UPDATE order_status_history h
       SET created_at = base.at + steps.step * interval '20 hours'
       FROM base, steps WHERE h.id = steps.id`,
    [orderId, daysAgo, hour],
  );
  await AppDataSource.query(
    `UPDATE orders o SET
       created_at = (SELECT min(created_at) FROM order_status_history WHERE order_id = o.id),
       updated_at = (SELECT max(created_at) FROM order_status_history WHERE order_id = o.id)
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
  while (createdCustomers.length < 30) {
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
    `UPDATE stock_movements SET created_at = now() - interval '90 days'
       WHERE type = 'INITIAL' AND product_id = ANY($1)`,
    [createdProducts.map(product => product.id)],
  );

  const createOrder = new CreateOrderService(
    customers,
    container.ordersUnitOfWork,
  );
  const changeStatus = new ChangeOrderStatusService(container.ordersUnitOfWork);
  const inStock = createdProducts.filter(product => product.quantity >= 10);
  const ORDERS = 24;
  for (let index = 0; index < ORDERS; index += 1) {
    const lines = new Map<string, number>();
    const size = 1 + Math.floor(next() * 3);
    while (lines.size < size)
      lines.set(pick(inStock).id, 1 + Math.floor(next() * 2));

    const order = await createOrder.execute({
      created_by: actorByRole.SELLER,
      customer_id: pick(createdCustomers).id,
      products: [...lines].map(([id, quantity]) => ({ id, quantity })),
    });
    for (const action of ORDER_PATHS[index % ORDER_PATHS.length] ?? []) {
      await changeStatus.execute({
        id: order.id,
        action,
        // o vendedor registra o pagamento; envio, entrega e cancelamento são do gerente
        changed_by: action === 'pay' ? actorByRole.SELLER : actorByRole.MANAGER,
        reason: action === 'cancel' ? pick(CANCEL_REASONS) : undefined,
      });
    }
    await backdateOrder(order.id, 60 - index * 2, Math.floor(next() * 10));
  }

  // entradas de mercadoria e ajustes manuais (registrados agora, depois dos pedidos)
  const record = new RecordStockMovementService(container.productsUnitOfWork);
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
    `Seed concluído: ${createdCustomers.length} clientes, ${CATEGORIES.length} categorias, ${createdProducts.length} produtos (${low} abaixo do mínimo), ${ORDERS} pedidos e ${manual.length} movimentações manuais.`,
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
