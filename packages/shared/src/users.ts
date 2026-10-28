import { z } from 'zod';
import { imageFileSchema } from './uploads';
import {
  examples,
  isoDateSchema,
  paginationQuerySchema,
  searchSchema,
} from './common';
import { roleSchema } from './permissions';

const email = z.string().trim().toLowerCase().pipe(z.email());

// bcrypt considera só os primeiros 72 bytes
const newPassword = z.string().min(8).max(72);

// ---- Entradas

const name = z.string().trim().min(1).max(120);

/** Cadastro feito por um ADMIN, com a senha inicial que ele repassa ao usuário. */
export const createUserBodySchema = z
  .object({
    name,
    email,
    password: newPassword,
    role: roleSchema,
  })
  .meta({
    id: 'CreateUserBody',
    example: {
      name: 'Kaio',
      email: 'kaio@example.com',
      password: 'senha-inicial-123',
      role: 'SELLER',
    },
  });

/** Edição por um ADMIN: nome e papel (e-mail é o login e não muda aqui). */
export const updateUserBodySchema = z.object({ name, role: roleSchema }).meta({
  id: 'UpdateUserBody',
  example: { name: 'Kaio Fernandes', role: 'MANAGER' },
});

/** Ativar/desativar. Usuários nunca são excluídos (têm histórico). */
export const updateUserStatusBodySchema = z
  .object({ active: z.boolean() })
  .meta({ id: 'UpdateUserStatusBody', example: { active: false } });

export const listUsersQuerySchema = paginationQuerySchema.extend({
  q: searchSchema.meta({ description: 'Busca por nome ou e-mail' }),
  role: roleSchema.optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const sessionBodySchema = z
  .object({
    email,
    password: z.string().min(1),
  })
  .meta({
    id: 'SessionBody',
    example: { email: 'kaio@example.com', password: 'senha-segura-123' },
  });

export const forgotPasswordBodySchema = z
  .object({
    email,
  })
  .meta({ id: 'ForgotPasswordBody', example: { email: 'kaio@example.com' } });

export const resetPasswordBodySchema = z
  .object({
    token: z.string().min(32).max(128),
    password: newPassword,
    password_confirmation: z.string(),
  })
  .refine(data => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })
  .meta({
    id: 'ResetPasswordBody',
    example: {
      token: 'q2_j1awfJDzN3c0a9cXy0bVq2n1kWm8sTzR4u7e5LpQ',
      password: 'nova-senha-123',
      password_confirmation: 'nova-senha-123',
    },
  });

/** Perfil próprio: só o nome (e-mail é o login; papel só um ADMIN muda). */
export const updateProfileBodySchema = z
  .object({ name })
  .meta({ id: 'UpdateProfileBody', example: { name: 'Kaio F' } });

/** Troca da própria senha: exige a atual; as outras sessões são encerradas. */
export const changePasswordBodySchema = z
  .object({
    current_password: z.string().min(1),
    password: newPassword,
    password_confirmation: z.string(),
  })
  .refine(data => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })
  .refine(data => data.password !== data.current_password, {
    message: 'The new password must be different from the current one',
    path: ['password'],
  })
  .meta({
    id: 'ChangePasswordBody',
    example: {
      current_password: 'senha-segura-123',
      password: 'nova-senha-123',
      password_confirmation: 'nova-senha-123',
    },
  });

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type UpdateUserStatusBody = z.infer<typeof updateUserStatusBodySchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type SessionBody = z.infer<typeof sessionBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;

// ---- Respostas

export const userSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    avatar: z.string().nullable(),
    avatar_url: z.url().nullable(),
    role: roleSchema,
    active: z.boolean(),
    created_at: isoDateSchema,
    updated_at: isoDateSchema,
  })
  .meta({
    id: 'User',
    example: {
      id: examples.id,
      name: 'Kaio',
      email: 'kaio@example.com',
      avatar: null,
      avatar_url: null,
      role: 'ADMIN',
      active: true,
      created_at: examples.date,
      updated_at: examples.date,
    },
  });

export const sessionSchema = z
  .object({
    user: userSchema,
    token: z.string(),
  })
  .meta({
    id: 'Session',
    example: {
      user: {
        id: examples.id,
        name: 'Kaio',
        email: 'kaio@example.com',
        avatar: null,
        avatar_url: null,
        role: 'ADMIN',
        active: true,
        created_at: examples.date,
        updated_at: examples.date,
      },
      token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1YzMwMWZkNCJ9.assinatura',
    },
  });

export type User = z.infer<typeof userSchema>;
export type Session = z.infer<typeof sessionSchema>;

/** Upload do avatar (multipart/form-data, campo `avatar`). */
export const avatarUploadBodySchema = z
  .object({ avatar: imageFileSchema() })
  .meta({ id: 'AvatarUploadBody' });
