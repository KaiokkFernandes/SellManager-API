import { z } from 'zod';
import {
  bearerAuth,
  body,
  DocsRegistry,
  errors,
  json,
  noContent,
  paginated,
} from '@shared/http/docs/helpers';
import { paginationQuerySchema, userSchema } from '@sellmanager/shared';
import {
  createUserBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  sessionBodySchema,
  updateProfileBodySchema,
} from '@sellmanager/shared';

export function registerUsersDocs(registry: DocsRegistry): void {
  const User = userSchema;

  registry.registerPath({
    method: 'post',
    path: '/users',
    operationId: 'createUser',
    security: [],
    tags: ['Usuários'],
    summary: 'Cadastra um usuário',
    request: { body: body(createUserBodySchema) },
    responses: {
      201: json(User, 'Criado'),
      400: errors[400],
      409: errors[409],
      429: errors[429],
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/users',
    operationId: 'listUsers',
    tags: ['Usuários'],
    summary: 'Lista usuários',
    security: bearerAuth,
    request: { query: paginationQuerySchema },
    responses: { 200: json(paginated(User)), 401: errors[401] },
  });

  registry.registerPath({
    method: 'patch',
    path: '/users/avatar',
    operationId: 'updateUserAvatar',
    tags: ['Usuários'],
    summary: 'Envia o avatar (jpeg, png ou webp, até 2 MB)',
    security: bearerAuth,
    request: {
      body: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: z.object({ avatar: z.string().meta({ format: 'binary' }) }),
          },
        },
      },
    },
    responses: { 200: json(User), 400: errors[400], 401: errors[401] },
  });

  registry.registerPath({
    method: 'post',
    path: '/sessions',
    operationId: 'createSession',
    security: [],
    tags: ['Autenticação'],
    summary: 'Login: devolve o usuário e um JWT',
    request: { body: body(sessionBodySchema) },
    responses: {
      200: json(z.object({ user: User, token: z.string() })),
      400: errors[400],
      401: errors[401],
      429: errors[429],
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/profile',
    operationId: 'showProfile',
    tags: ['Perfil'],
    summary: 'Mostra o perfil do usuário autenticado',
    security: bearerAuth,
    responses: { 200: json(User), 401: errors[401] },
  });

  registry.registerPath({
    method: 'put',
    path: '/profile',
    operationId: 'updateProfile',
    tags: ['Perfil'],
    summary: 'Atualiza o perfil (trocar a senha exige old_password)',
    security: bearerAuth,
    request: { body: body(updateProfileBodySchema) },
    responses: {
      200: json(User),
      400: errors[400],
      401: errors[401],
      409: errors[409],
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/password/forgot',
    operationId: 'forgotPassword',
    security: [],
    tags: ['Autenticação'],
    summary:
      'Envia e-mail de recuperação (responde 204 mesmo se o e-mail não existir)',
    request: { body: body(forgotPasswordBodySchema) },
    responses: { 204: noContent, 400: errors[400], 429: errors[429] },
  });

  registry.registerPath({
    method: 'post',
    path: '/password/reset',
    operationId: 'resetPassword',
    security: [],
    tags: ['Autenticação'],
    summary: 'Redefine a senha com o token recebido por e-mail (uso único, 2h)',
    request: { body: body(resetPasswordBodySchema) },
    responses: { 204: noContent, 400: errors[400], 429: errors[429] },
  });
}
