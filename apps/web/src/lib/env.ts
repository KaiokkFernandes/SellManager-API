import { z } from 'zod';

const envSchema = z.object({
  // Padrão /api: mesmo domínio em produção e proxy do Vite em dev. URL absoluta
  // só se a API ficar em outro domínio.
  VITE_API_URL: z
    .string()
    .default('/api')
    .refine(
      value => value.startsWith('/') || URL.canParse(value),
      'VITE_API_URL deve ser uma URL válida (https://...) ou um caminho como /api',
    )
    .transform(value => value.replace(/\/+$/, '')),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, unknown>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Variáveis de ambiente inválidas:\n${problems}\nVeja apps/web/.env.example`,
    );
  }
  return result.data;
}

/** Variáveis do app, validadas uma vez na inicialização. */
export const env = parseEnv(import.meta.env);
