# Publicação na Vercel

Front-end e API ficam no mesmo projeto da Vercel e no mesmo domínio, com o recurso Services
(em beta). O banco é PostgreSQL no Neon, o rate limit usa Redis no Upstash e as imagens ficam
no Vercel Blob.

```
navegador ─ /api/*  ─▶ serviço backend  (função Express) ─▶ Neon, Upstash, Blob
          └ o resto ─▶ serviço frontend (arquivos estáticos do Vite)
```

## Antes de começar

Use a mesma região nos três serviços: **AWS US East (N. Virginia)**, que é a região padrão das
funções da Vercel (`iad1`). Em outra região, cada consulta fica lenta e pode dar erro de conexão.

Você vai precisar de um provedor de e-mail com SMTP para a recuperação de senha. Use a porta 587.

## 1. Banco no Neon

1. Crie um projeto em [neon.tech](https://neon.tech), região **AWS US East (N. Virginia)**.
2. Em **Connect**, com **Connection pooling ligado**, copie a URL. O host tem `-pooler`: ela é a
   `DATABASE_URL`.
3. Desligue **Connection pooling** e copie de novo. Ela é a `DATABASE_URL_UNPOOLED`, usada só nas
   migrations.

## 2. Redis no Upstash

1. Crie um banco Redis em [upstash.com](https://upstash.com), região **us-east-1**.
2. Copie a URL de conexão TCP, que começa com `rediss://`: ela é a `REDIS_URL`. A URL REST não
   serve.

## 3. Importar o projeto na Vercel

1. **Add New → Project** e importe o repositório.
2. Em **Root Directory** deixe `./`.
3. Em **Application Preset** escolha **Services**. Não use "Import single project".
4. Não altere os comandos: eles vêm do `vercel.json`.
5. Antes do primeiro deploy, cadastre as variáveis da seção 5. Sem elas, o build falha de
   propósito, com uma mensagem dizendo o que falta.

## 4. Blob

No projeto da Vercel, abra **Storage → Create → Blob**, conecte ao projeto e marque os ambientes.
A Vercel cria a variável `BLOB_READ_WRITE_TOKEN` sozinha. O acesso é público.

## 5. Variáveis de ambiente

Em **Settings → Environment Variables**:

> **Marque cada variável para o ambiente Production.** Variável sem essa marca não existe no
> deploy de produção.
>
> **Depois de criar ou mudar uma variável, faça Redeploy.** Ela só vale para novos deploys.

| Variável                | Obrigatória | Valor                                                  |
| ----------------------- | ----------- | ------------------------------------------------------ |
| `DATABASE_URL`          | sim         | URL do Neon **com** `-pooler`                          |
| `DATABASE_URL_UNPOOLED` | recomendada | URL do Neon **sem** `-pooler`; só para migrations      |
| `JWT_SECRET`            | sim         | Gere com o comando abaixo                              |
| `REDIS_URL`             | sim         | URL `rediss://` do Upstash                             |
| `BLOB_READ_WRITE_TOKEN` | sim         | Criada pela Vercel na seção 4                          |
| `MAIL_DRIVER`           | sim         | `smtp`                                                 |
| `SMTP_HOST`             | sim         | Host do provedor de e-mail                             |
| `SMTP_PORT`             | não         | Padrão `587`                                           |
| `SMTP_USER`             | conforme    | Usuário do provedor                                    |
| `SMTP_PASS`             | conforme    | Senha ou chave do provedor                             |
| `MAIL_FROM_EMAIL`       | recomendada | Remetente, de um domínio verificado no provedor        |
| `APP_WEB_URL`           | não         | Domínio do site. Padrão: domínio de produção da Vercel |
| `BUSINESS_TIMEZONE`     | não         | Padrão `America/Sao_Paulo`                             |
| `CORS_ORIGIN`           | não         | Só para aceitar outros domínios. Nunca `*`             |
| `VITE_API_URL`          | não         | Só se a API ficar em outro domínio                     |

Para gerar o segredo:

```bash
openssl rand -base64 48
```

Não defina `NODE_ENV`: a Vercel já define em tempo de execução, e `NODE_ENV=production` no build
impede a instalação das dependências de desenvolvimento, necessárias para compilar.

## 6. Primeiro deploy

Clique em **Deploy**. No build de produção, as migrations são aplicadas pela conexão direta. Se
`DATABASE_URL` faltar, o build para e lista os nomes (nunca os valores) de variáveis parecidas.

## 7. Primeiro usuário ADMIN

Não existe cadastro público, e o seed se recusa a rodar em produção ou contra banco remoto. Crie
o ADMIN pela sua máquina, depois do primeiro deploy:

```bash
pnpm install
pnpm --filter api... build
NODE_ENV=production \
DATABASE_URL='cole aqui a URL direta do Neon' \
JWT_SECRET='cole aqui o mesmo segredo da Vercel' \
pnpm --filter api create-admin:prod
```

O comando pergunta nome, e-mail e senha, sem mostrar a senha na tela. Se já houver um ADMIN ativo,
não faz nada. Depois, entre no site e cadastre os demais em **Usuários**.

## 8. O que testar depois do primeiro deploy

1. Abra `https://seu-dominio/api/health`: deve responder `{"status":"ok"}`. Se responder 503, a
   API subiu mas não alcança o banco.
2. Entre com o usuário ADMIN.
3. Envie uma imagem de produto e recarregue a página: ela deve continuar lá.
4. Crie um pedido e confira a baixa no estoque.
5. Recarregue uma tela interna, como `/orders`: deve abrir normalmente.
6. Baixe um relatório CSV em **Relatórios**.
7. Peça uma recuperação de senha e confira se o e-mail chega com o link do site.
8. Veja os logs em **Logs**, filtrando pelo serviço `backend`: não pode haver erros nem dados
   pessoais.

## Previews

Cada branch ganha um deploy de preview. Ele **nunca aplica migrations**, para não alterar o banco
de produção.

- Use uma **branch do Neon** como banco de preview, com sua própria `DATABASE_URL` marcada para o
  ambiente **Preview**. Não compartilhe a URL de produção com previews.
- Para aplicar migrations nessa branch, rode pela sua máquina:

  ```bash
  pnpm --filter api... build
  NODE_ENV=production DATABASE_URL='URL da branch' JWT_SECRET='um segredo qualquer de 32+ caracteres' \
  pnpm --filter api migration:run:prod
  ```

- `JWT_SECRET` e `BLOB_READ_WRITE_TOKEN` também precisam estar marcadas para Preview. `REDIS_URL`
  e SMTP são opcionais: sem Redis, o limite fica em memória; sem SMTP, a recuperação de senha
  usa o Ethereal, então não teste com e-mails reais.

## Backup e restauração

- **Banco:** o Neon permite restaurar para um ponto no tempo, dentro da janela do seu plano.
  Prefira restaurar em uma branch nova, conferir e só então trocar.
- **Cópia manual**, usando a URL direta:

  ```bash
  pg_dump "$DATABASE_URL_UNPOOLED" --format=custom --file=sellmanager.dump
  pg_restore --dbname="$URL_DO_BANCO_DESTINO" --no-owner sellmanager.dump
  ```

- **Imagens:** ficam no Blob, fora do backup do banco. O banco guarda só as URLs.

## Reverter um deploy

Em **Deployments**, abra um deploy anterior e use **Instant Rollback**.

O rollback volta o código, **não o banco**. Mantenha as migrations compatíveis com a versão
anterior (adicionar antes de remover). Para desfazer a última migration de verdade, rode pela sua
máquina `pnpm --filter api migration:revert` com a URL direta em `DATABASE_URL`, e só depois de um
backup.

## Plano Hobby

O plano Hobby da Vercel é só para uso pessoal e não comercial. Para vender ou operar uma loja
real, use o plano Pro.

## Limitações conhecidas

- **Services está em beta** e pode mudar. O `vercel.json` depende de dois comportamentos
  conferidos com a CLI 65.9: `outputDirectory: "."` faz a função ser compilada a partir do `src`,
  e o `excludeFiles` tira do pacote o que o SDK do Blob puxa sem necessidade. Sem o primeiro, a API
  cai em toda requisição.
- **Primeira requisição:** depois de um tempo parada, a função leva alguns segundos para iniciar.
  A tela mostra "Conectando ao servidor...".
- **Imagens até 4 MB:** a Vercel recusa requisições acima de 4,5 MB.
- **Relatórios CSV:** a resposta é enviada em streaming, com tempo máximo de 60 s por requisição e
  30 s por consulta. Um arquivo que ultrapasse isso chega cortado; reduza o período.
- **Migrations rodam no build:** se o build falhar depois delas, o banco fica à frente do código
  publicado.
- **Rate limit:** cobre login, "esqueci a senha" e redefinição. Se o Redis cair, o acesso é
  liberado e o erro vai para o log.
- **Sessão:** o token fica no `localStorage`, por 2 horas, sem refresh; a proteção contra XSS é a
  CSP.
- **Documentação da API:** `/api/docs` só existe em desenvolvimento.
- **Outro domínio para a API:** exige `VITE_API_URL`, `CORS_ORIGIN` e ajustar a CSP no `vercel.json`.
