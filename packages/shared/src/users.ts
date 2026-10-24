import { z } from 'zod';
import { isoDateSchema } from './common';

const email = z.string().trim().toLowerCase().pipe(z.email());

// bcrypt considera só os primeiros 72 bytes
const newPassword = z.string().min(8).max(72);

// ---- Entradas

export const createUserBodySchema = z.object({
  name: z.string().trim().min(1),
  email,
  password: newPassword,
});

export const sessionBodySchema = z.object({
  email,
  password: z.string().min(1),
});

export const forgotPasswordBodySchema = z.object({
  email,
});

export const resetPasswordBodySchema = z
  .object({
    token: z.string().min(32).max(128),
    password: newPassword,
    password_confirmation: z.string(),
  })
  .refine(data => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
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
  );

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
    created_at: isoDateSchema,
    updated_at: isoDateSchema,
  })
  .meta({ id: 'User' });

export const sessionSchema = z
  .object({
    user: userSchema,
    token: z.string(),
  })
  .meta({ id: 'Session' });

export type User = z.infer<typeof userSchema>;
export type Session = z.infer<typeof sessionSchema>;
