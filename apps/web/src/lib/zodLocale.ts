import { validationReason, type ValidationReason } from '@sellmanager/shared';
import { z } from 'zod';

const REASON_MESSAGES: Record<ValidationReason, string> = {
  password_mismatch: 'As senhas não conferem',
  same_password: 'A nova senha deve ser diferente da atual',
  inverted_range: 'A data final deve ser posterior à inicial',
  zero_quantity: 'A quantidade não pode ser zero',
  negative_entry: 'A entrada deve ter quantidade positiva',
  reason_required: 'Informe o motivo',
};

type Issue = Parameters<NonNullable<z.core.$ZodConfig['customError']>>[0];

/**
 * Mensagens pt-BR curtas para os casos comuns de formulário. O que não estiver
 * aqui cai no locale `pt` do zod. Só muda o TEXTO: as regras continuam nos
 * schemas de @sellmanager/shared.
 */
function friendlyMessage(issue: Issue): string | undefined {
  // campo deixado em branco (inclusive selects/UUID vazios)
  if (issue.input === '' && issue.code !== 'custom') return 'Campo obrigatório';

  switch (issue.code) {
    case 'invalid_type':
      if (
        issue.input === undefined ||
        issue.input === null ||
        issue.input === ''
      )
        return 'Campo obrigatório';
      if (issue.expected === 'int') return 'Informe um número inteiro';
      if (issue.expected === 'number') return 'Informe um número válido';
      return undefined;
    case 'too_small': {
      const min = Number(issue.minimum);
      if (issue.origin === 'string') {
        return min <= 1
          ? 'Campo obrigatório'
          : `Use ao menos ${min} caracteres`;
      }
      if (issue.origin === 'number') {
        return issue.inclusive
          ? `Deve ser no mínimo ${min}`
          : `Deve ser maior que ${min}`;
      }
      if (issue.origin === 'array')
        return min <= 1
          ? 'Adicione ao menos um item'
          : `Adicione ao menos ${min} itens`;
      return undefined;
    }
    case 'too_big': {
      const max = Number(issue.maximum);
      if (issue.origin === 'string') return `Use no máximo ${max} caracteres`;
      if (issue.origin === 'number') return 'Valor acima do permitido';
      if (issue.origin === 'array') return `No máximo ${max} itens`;
      return undefined;
    }
    case 'invalid_format':
      if (issue.format === 'email') return 'E-mail inválido';
      if (issue.format === 'uuid') return 'Selecione uma opção válida';
      return undefined;
    case 'custom': {
      // validações por motivo declaradas no shared (refine)
      const reason = validationReason(issue.params);
      return reason ? REASON_MESSAGES[reason] : undefined;
    }
    default:
      return undefined;
  }
}

z.config({ ...z.locales.pt(), customError: friendlyMessage });
