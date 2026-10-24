import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email());

export const createUserBodySchema = z.object({
  name: z.string().trim().min(1),
  email,
  password: z.string().min(1),
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
    token: z.uuid(),
    password: z.string().min(1),
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
    password: z.string().min(1).optional(),
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
