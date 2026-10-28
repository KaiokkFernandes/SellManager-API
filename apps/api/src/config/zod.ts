import { validationReason, VALIDATION_REASONS } from '@sellmanager/shared';
import { z } from 'zod';

// Texto em inglês para as validações por motivo declaradas no shared
// (o front configura as mesmas em pt-BR).
z.config({
  customError: issue => {
    if (issue.code !== 'custom') return undefined;
    const reason = validationReason(issue.params);
    return reason ? VALIDATION_REASONS[reason] : undefined;
  },
});
