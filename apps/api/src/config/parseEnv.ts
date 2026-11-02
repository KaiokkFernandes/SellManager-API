import { z } from 'zod';

function isValidTimezone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

type Source = Record<string, string | undefined>;

/** Vercel de produção: preview e `vercel dev` têm exigências menores. */
function isVercelProduction(source: Source): boolean {
  return (
    Boolean(source.VERCEL) &&
    source.VERCEL_ENV !== 'preview' &&
    source.VERCEL_ENV !== 'development'
  );
}

/** URL pública do deploy, a partir das variáveis de sistema da Vercel. */
function vercelWebUrl(source: Source): string | undefined {
  const host =
    source.VERCEL_ENV === 'preview'
      ? (source.VERCEL_BRANCH_URL ?? source.VERCEL_URL)
      : source.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? `https://${host}` : undefined;
}

function buildSchema(source: Source) {
  const onVercel = Boolean(source.VERCEL);
  const defaultNodeEnv = onVercel ? 'production' : 'development';
  const production = (source.NODE_ENV ?? defaultNodeEnv) === 'production';

  return z
    .object({
      NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default(defaultNodeEnv),
      PORT: z.coerce.number().int().positive().default(3333),
      APP_API_URL: z.url().default('http://localhost:3333'),
      // Na Vercel não há padrão: um link de senha para localhost não serve
      APP_WEB_URL: onVercel
        ? z.url({ error: 'obrigatória: URL pública do front-end' })
        : z.url().default('http://localhost:3000'),
      // fuso das métricas: "um dia" de venda é o dia local do negócio
      BUSINESS_TIMEZONE: z
        .string()
        .refine(isValidTimezone, 'Invalid IANA time zone')
        .default('America/Sao_Paulo'),

      DB_HOST: z.string().default('localhost'),
      DB_PORT: z.coerce.number().int().positive().default(5433),
      DB_USER: z.string().default('sellmanager'),
      DB_PASSWORD: z.string().default('sellmanager'),
      DB_NAME: z.string().default('sellmanager'),

      JWT_SECRET: z
        .string({ error: 'obrigatória: segredo de assinatura do JWT' })
        .min(32, 'JWT_SECRET precisa ter ao menos 32 caracteres'),
      JWT_EXPIRES_IN: z.string().default('2h'),
      BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

      // Origens de OUTROS domínios, separadas por vírgula. A origem igual ao
      // host da requisição (front e API no mesmo domínio) já é aceita.
      CORS_ORIGIN: z
        .string()
        .default(production ? '' : 'http://localhost:3000')
        .transform(value =>
          value
            .split(',')
            .map(origin => origin.trim())
            .filter(Boolean),
        ),
      // Número de proxies reversos à frente da API (para o IP real no rate
      // limit). Na Vercel há sempre um.
      TRUST_PROXY: z.coerce
        .number()
        .int()
        .nonnegative()
        .default(onVercel ? 1 : 0),

      // E-mail: 'ethereal' (caixa de teste, só para dev) ou 'smtp'
      MAIL_DRIVER: z.enum(['ethereal', 'smtp']).default('ethereal'),
      MAIL_FROM_NAME: z.string().default('Equipe SellManager'),
      MAIL_FROM_EMAIL: z.email().default('no-reply@sellmanager.dev'),
      SMTP_HOST: z.string().optional(),
      SMTP_PORT: z.coerce.number().int().positive().default(587),
      SMTP_SECURE: z.stringbool().default(false),
      SMTP_USER: z.string().optional(),
      SMTP_PASS: z.string().optional(),

      LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
        .optional(),
    })
    .superRefine((data, context) => {
      const fail = (path: string, message: string) =>
        context.addIssue({ code: 'custom', path: [path], message });

      if (data.MAIL_DRIVER === 'smtp' && !data.SMTP_HOST) {
        fail('SMTP_HOST', 'SMTP_HOST é obrigatório quando MAIL_DRIVER=smtp');
      }
      if (production && data.CORS_ORIGIN.includes('*')) {
        fail('CORS_ORIGIN', 'não aceita * em produção');
      }
      // o Ethereal entregaria o link de redefinição de senha a um terceiro
      if (isVercelProduction(source) && data.MAIL_DRIVER !== 'smtp') {
        fail('MAIL_DRIVER', 'precisa ser smtp em produção');
      }
    });
}

export type Env = z.output<ReturnType<typeof buildSchema>>;

/** Ignora variáveis vazias: na Vercel, valor em branco equivale a não definir. */
function withoutBlanks(source: Source): Source {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== ''),
  );
}

/**
 * Valida o ambiente e devolve os valores convertidos. Na Vercel assume produção
 * mesmo sem NODE_ENV. O erro diz QUAIS variáveis faltam, nunca os valores.
 */
export function parseEnv(rawSource: Source): Env {
  const source = withoutBlanks(rawSource);
  const appWebUrl = source.APP_WEB_URL ?? vercelWebUrl(source);

  const parsed = buildSchema(source).safeParse({
    ...source,
    ...(appWebUrl && { APP_WEB_URL: appWebUrl }),
  });
  if (parsed.success) return parsed.data;

  const problems = parsed.error.issues
    .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(
    `Variáveis de ambiente inválidas:\n${problems}\nVeja apps/api/.env.example`,
  );
}
