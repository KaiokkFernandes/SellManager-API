import { toast } from 'sonner';
import { getErrorMessage } from './apiErrors';

/** Toasts do app. Erros passam pelo mapeamento único de mensagens da API. */
export const notify = {
  success: (message: string) => toast.success(message),
  info: (message: string) => toast.info(message),
  error: (error: unknown) => toast.error(getErrorMessage(error)),
};
