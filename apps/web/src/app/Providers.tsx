import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ConnectionNotice } from '@/components/feedback/ConnectionNotice';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth';
import { ThemeProvider } from '@/lib/theme';

/** Todos os providers do app em um só lugar (a ordem importa: Auth usa o Query). */
export function Providers({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <ConnectionNotice />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
