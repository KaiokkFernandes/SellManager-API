import pino from 'pino';
import { env } from '@config/env';

const defaultLevel = {
  development: 'debug',
  test: 'silent',
  production: 'info',
} as const;

export const logger = pino({
  level: env.LOG_LEVEL ?? defaultLevel[env.NODE_ENV],
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    '*.password',
    '*.old_password',
  ],
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { translateTime: 'SYS:HH:MM:ss' },
    },
  }),
});
