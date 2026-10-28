import { roleSchema } from '@sellmanager/shared';
import { z } from 'zod';

/** Estado da lista de usuários na URL: ?q=&role=&status=&page= */
export const usersSearchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  role: roleSchema.optional().catch(undefined),
  status: z.enum(['active', 'inactive']).optional().catch(undefined),
  page: z.number().int().positive().optional().catch(undefined),
});

export type UsersSearch = z.infer<typeof usersSearchSchema>;
