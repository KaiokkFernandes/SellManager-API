// Popula o banco de DESENVOLVIMENTO para testar paginação e busca de verdade.
/* eslint-disable no-console -- script de linha de comando */
// Uso: pnpm --filter api seed
//
// Usuários: um por papel (ADMIN, MANAGER, SELLER).
// Idempotente: apaga só o que o próprio seed criou (clientes @seed.sellmanager.dev,
// os pedidos deles e os produtos da lista abaixo que não estejam em outros
// pedidos) e recria. Usa os services, então estoque, preços e totais seguem as
// mesmas regras da API.
import type { Role } from '@sellmanager/shared';
import { env } from '@config/env';
import { CreateCustomerService } from '@modules/customers/services/CreateCustomerService';
import { CreateOrderService } from '@modules/orders/services/CreateOrderService';
import { ChangeOrderStatusService } from '@modules/orders/services/ChangeOrderStatusService';
import { CreateProductService } from '@modules/products/services/CreateProductService';
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

// [nome, preço em reais, estoque] — alguns com estoque baixo ou zerado de propósito
const PRODUCTS: [string, number, number][] = [
  ['Teclado mecânico ABNT2', 349.9, 25],
  ['Mouse sem fio', 129.9, 40],
  ['Monitor 24" Full HD', 899, 8],
  ['Monitor 27" 4K', 2199, 3],
  ['Headset gamer', 279.9, 15],
  ['Webcam Full HD', 249.9, 0],
  ['Cabo HDMI 2m', 39.9, 120],
  ['Cabo USB-C 1m', 29.9, 200],
  ['Hub USB-C 7 em 1', 219.9, 12],
  ['SSD NVMe 1TB', 459.9, 18],
  ['SSD SATA 480GB', 199.9, 4],
  ['HD externo 2TB', 449, 7],
  ['Pendrive 64GB', 49.9, 90],
  ['Cartão microSD 128GB', 79.9, 60],
  ['Roteador Wi-Fi 6', 599, 9],
  ['Repetidor Wi-Fi', 149.9, 2],
  ['Switch 8 portas', 189.9, 14],
  ['Notebook 14" i5', 3899, 5],
  ['Notebook 15" Ryzen 7', 4999, 1],
  ['Suporte para notebook', 89.9, 33],
  ['Mousepad grande', 59.9, 70],
  ['Cadeira ergonômica', 1299, 6],
  ['Mesa digitalizadora', 399, 0],
  ['Caixa de som Bluetooth', 199, 22],
  ['Fone Bluetooth', 249, 30],
  ['Carregador 65W USB-C', 179.9, 26],
  ['Power bank 20000mAh', 169.9, 19],
  ['Filtro de linha', 69.9, 45],
  ['Nobreak 600VA', 549, 3],
  ['Microfone condensador', 329.9, 11],
  ['Ring light', 119.9, 16],
  ['Estabilizador', 229, 0],
  ['Leitor de cartão', 34.9, 52],
  ['Adaptador HDMI para VGA', 44.9, 38],
  ['Teclado numérico', 79.9, 21],
  ['Mouse vertical', 189, 4],
  ['Impressora multifuncional', 899, 5],
  ['Cartucho preto', 89.9, 64],
  ['Papel A4 (500 folhas)', 32.9, 150],
  ['Smartwatch', 699, 10],
  ['Tablet 10"', 1499, 7],
  ['Capa para tablet', 79, 28],
  ['Película de vidro', 24.9, 300],
  ['Controle sem fio', 349, 9],
  ['Placa de vídeo 8GB', 2799, 2],
  ['Memória RAM 16GB', 329, 17],
  ['Fonte 650W', 449, 6],
  ['Gabinete ATX', 389, 5],
  ['Cooler para CPU', 159, 13],
  ['Pasta térmica', 29.9, 80],
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

async function cleanPreviousSeed(): Promise<void> {
  const seedCustomers = `SELECT id FROM customers WHERE email LIKE '%@${SEED_DOMAIN}'`;
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

  const createdProducts = [];
  for (const [name, price, quantity] of PRODUCTS) {
    if (await products.findByName(name)) continue; // está em pedidos de fora do seed
    createdProducts.push(
      await new CreateProductService(products).execute({
        name,
        price,
        quantity,
      }),
    );
  }

  const createOrder = new CreateOrderService(
    customers,
    container.ordersUnitOfWork,
  );
  const changeStatus = new ChangeOrderStatusService(container.ordersUnitOfWork);
  const inStock = createdProducts.filter(product => product.quantity >= 10);
  let orders = 0;
  for (let index = 0; index < 18; index += 1) {
    const lines = new Map<string, number>();
    const size = 1 + Math.floor(next() * 3);
    while (lines.size < size)
      lines.set(pick(inStock).id, 1 + Math.floor(next() * 2));

    const order = await createOrder.execute({
      customer_id: pick(createdCustomers).id,
      products: [...lines].map(([id, quantity]) => ({ id, quantity })),
    });
    if (index % 5 === 1)
      await changeStatus.execute({
        id: order.id,
        action: 'cancel',
        reason: 'Cliente desistiu',
      });
    else if (index % 3 === 0)
      for (const action of ['pay', 'ship', 'deliver'] as const)
        await changeStatus.execute({ id: order.id, action });

    // espalha as datas pelos últimos 60 dias (para o filtro por período)
    const daysAgo = Math.floor(next() * 60);
    await AppDataSource.query(
      `UPDATE orders SET created_at = now() - make_interval(days => $1, hours => $2) WHERE id = $3`,
      [daysAgo, Math.floor(next() * 12), order.id],
    );
    orders += 1;
  }

  console.log(
    `Seed concluído: ${createdCustomers.length} clientes, ${createdProducts.length} produtos e ${orders} pedidos.`,
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
