import { z } from 'zod';
import { imageFileSchema } from './uploads';
import { examples, isoDateSchema } from './common';
import { roleSchema } from './permissions';

const email = z.string().trim().toLowerCase().pipe(z.email());

// bcrypt considera só os primeiros 72 bytes
const newPassword = z.string().min(8).max(72);

// ---- Entradas

export const createUserBodySchema = z
  .object({
    name: z.string().trim().min(1),
    email,
    password: newPassword,
  })
  .meta({
    id: 'CreateUserBody',
    example: {
      name: 'Kaio',
      email: 'kaio@example.com',
      password: 'senha-segura-123',
    },
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

export const updateProfileBodySchema = z
  .object({
    name: z.string().trim().min(1),
    email,
    old_password: z.string().optional(),
    password: newPassword.optional(),
    password_confirmation: z.string().optional(),
  })
  .refine(
    data => !data.password || data.password === data.password_confirmation,
    {
      message: 'Passwords do not match',
      path: ['password_confirmation'],
    },
  )
  .meta({
    id: 'UpdateProfileBody',
    example: {
      name: 'Kaio F',
      email: 'kaio@example.com',
      old_password: 'senha-segura-123',
      password: 'nova-senha-123',
      password_confirmation: 'nova-senha-123',
    },
  });

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type SessionBody = z.infer<typeof sessionBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;

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
