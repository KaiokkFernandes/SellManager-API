import { expect, test } from '@playwright/test';
import { login, makePng, pickOption } from './support';

/**
 * Fluxo dos critérios de pronto, contra a API real:
 * cliente → produtos (um com imagem) → pedido com dois produtos → pagar e enviar
 * (linha do tempo) → estoque baixou e entrou no alerta → cancelar outro pedido
 * com motivo devolve o estoque → movimentações → estourar o estoque → excluir
 * cliente com pedido é recusado.
 */
test('fluxo completo de venda', async ({ page }) => {
  const stamp = Date.now().toString(36);
  const customerName = `Cliente E2E ${stamp}`;
  const keyboard = `Teclado E2E ${stamp}`;
  const mouse = `Mouse E2E ${stamp}`;

  await login(page);

  // 1. cliente
  await page.getByRole('link', { name: 'Clientes' }).first().click();
  await page.getByRole('link', { name: 'Novo cliente' }).click();
  await page.getByLabel('Nome').fill(customerName);
  await page.getByLabel('E-mail').fill(`e2e.${stamp}@example.com`);
  await page.getByRole('button', { name: 'Cadastrar cliente' }).click();
  await expect(page.getByRole('heading', { name: customerName })).toBeVisible();

  // 2. produto com imagem (estoque 5) e outro sem imagem (estoque 3)
  await page.goto('/products/new');
  await page.getByLabel('Nome').fill(keyboard);
  await page.getByLabel('Preço').fill('199,90');
  await page.getByLabel('Estoque inicial').fill('5');
  await page.getByRole('spinbutton', { name: 'Estoque mínimo' }).fill('4');
  await page.getByRole('button', { name: 'Cadastrar produto' }).click();
  await expect(page.getByText('Sem imagem')).toBeVisible();
  await page.getByLabel('Arquivo da imagem').setInputFiles({
    name: 'teclado.png',
    mimeType: 'image/png',
    buffer: await makePng(page, 210),
  });
  await expect(
    page.getByRole('img', { name: 'Pré-visualização da nova imagem' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Enviar imagem' }).click();
  const image = page.getByRole('img', { name: 'Imagem atual do produto' });
  await expect(image).toHaveAttribute('src', /\/files\/[a-f0-9]{32}\.png$/);
  // a imagem carrega de verdade (servida pela API)
  await expect
    .poll(() => image.evaluate(img => (img as HTMLImageElement).naturalWidth))
    .toBe(256);

  await page.goto('/products/new');
  await page.getByLabel('Nome').fill(mouse);
  await page.getByLabel('Preço').fill('89,50');
  await page.getByLabel('Estoque inicial').fill('3');
  await page.getByRole('spinbutton', { name: 'Estoque mínimo' }).fill('4');
  await page.getByRole('button', { name: 'Cadastrar produto' }).click();
  await expect(page.getByText('Sem imagem')).toBeVisible();

  // 3. pedido com dois produtos
  await page.goto('/orders/new');
  await pickOption(page, 'Cliente', customerName, customerName);
  await pickOption(page, 'Adicionar produto', keyboard, keyboard);
  await pickOption(page, 'Adicionar produto', mouse, mouse);
  await page
    .getByRole('button', { name: `Aumentar quantidade de ${keyboard}` })
    .click();
  // 2 × 199,90 + 1 × 89,50
  await expect(page.getByRole('status', { name: 'Total' })).toHaveText(
    'R$ 489,30',
  );
  await page.getByRole('button', { name: 'Criar pedido' }).click();
  await expect(page.getByRole('heading', { name: /Pedido de/ })).toBeVisible();
  await expect(page.getByText('R$ 489,30')).toBeVisible();
  const orderUrl = page.url();

  // 3b. pagar e enviar: cada ação pede confirmação e entra na linha do tempo
  for (const action of ['Registrar pagamento', 'Marcar como enviado']) {
    await page.getByRole('button', { name: action }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: action })
      .click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  }
  await expect(page.getByText('Enviado', { exact: true })).toBeVisible();
  // depois do envio não se cancela mais
  await expect(
    page.getByRole('button', { name: 'Cancelar pedido' }),
  ).toHaveCount(0);
  const timeline = page.getByRole('list', { name: 'Histórico do pedido' });
  await expect(timeline.getByRole('listitem')).toHaveText([
    /Pedido criado/,
    /Pendente → Pago/,
    /Pago → Enviado/,
  ]);
  await page.screenshot({
    path: 'docs/screenshots/pedido-linha-do-tempo.png',
    fullPage: true,
  });

  // 4. estoque baixou: 5 - 2 = 3 (baixo) e 3 - 1 = 2
  await page.goto(`/products?q=${encodeURIComponent(`E2E ${stamp}`)}`);
  const products = page.getByRole('table', { name: 'Produtos' });
  await expect(
    products.getByRole('row', { name: new RegExp(keyboard) }),
  ).toContainText('Baixo · 3 un.');
  await expect(
    products.getByRole('row', { name: new RegExp(mouse) }),
  ).toContainText('Baixo · 2 un.');
  // os dois ficaram abaixo do mínimo (4): o alerta do cabeçalho mostra
  await expect(
    page.getByRole('link', { name: /abaixo do estoque mínimo/ }),
  ).toBeVisible();

  // 4b. outro pedido, cancelado com motivo: o estoque volta
  await page.goto('/orders/new');
  await pickOption(page, 'Cliente', customerName, customerName);
  await pickOption(page, 'Adicionar produto', mouse, mouse);
  await page.getByRole('button', { name: 'Criar pedido' }).click();
  await expect(page.getByRole('heading', { name: /Pedido de/ })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar pedido' }).click();
  const cancel = page.getByRole('alertdialog', { name: 'Cancelar pedido?' });
  await cancel.getByLabel('Motivo do cancelamento').fill('Cliente desistiu');
  await cancel.getByRole('button', { name: 'Cancelar pedido' }).click();
  await expect(
    page.getByText('Pedido cancelado. Os itens voltaram ao estoque.'),
  ).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Histórico do pedido' }),
  ).toContainText('Motivo: Cliente desistiu');

  // 4c. movimentações do teclado: saldo inicial e a venda do primeiro pedido
  await page.goto(`/products?q=${encodeURIComponent(keyboard)}`);
  await page
    .getByRole('table', { name: 'Produtos' })
    .getByRole('link', { name: keyboard, exact: true })
    .click();
  await page.getByRole('tab', { name: 'Movimentações' }).click();
  const movements = page.getByRole('table', {
    name: 'Movimentações de estoque',
  });
  await expect(movements.getByRole('row')).toHaveText([
    /Data/,
    /Venda.*-2.*3/,
    /Saldo inicial.*\+5.*5/,
  ]);
  await expect(
    movements.getByRole('link', {
      name: `Pedido nº ${orderUrl.split('/').at(-1)?.slice(0, 8) ?? ''}`,
    }),
  ).toBeVisible();

  // 5. estourar o estoque: a API recusa e a linha é apontada
  await page.goto('/orders/new');
  await pickOption(page, 'Cliente', customerName, customerName);
  await pickOption(page, 'Adicionar produto', mouse, mouse);
  const quantity = page.getByRole('spinbutton', {
    name: `Quantidade de ${mouse}`,
  });
  await quantity.fill('5');
  await expect(
    page.getByText('Acima do estoque conhecido (2 disponível(is)).'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Criar pedido' }).click();
  await expect(
    page.getByText('Estoque insuficiente: só há 2 disponível(is).'),
  ).toBeVisible();
  await expect(quantity).toHaveAttribute('aria-invalid', 'true');
  await page.screenshot({
    path: 'docs/screenshots/pedido-estoque-insuficiente.png',
    fullPage: true,
  });

  // 6. excluir o cliente com pedidos (o enviado e o cancelado) é recusado (sai sem salvar o rascunho)
  await page.getByRole('link', { name: 'Clientes' }).first().click();
  await page.getByRole('button', { name: 'Sair sem salvar' }).click();
  await page
    .getByRole('searchbox', { name: 'Buscar por nome ou e-mail' })
    .fill(stamp);
  await page
    .getByRole('button', { name: `Excluir ${customerName}` })
    .first()
    .click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Excluir' })
    .click();
  await expect(
    page.getByRole('alertdialog', { name: 'Não é possível excluir' }),
  ).toContainText('Este cliente tem 2 pedidos e não pode ser excluído');
});
