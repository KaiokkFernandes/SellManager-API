import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { Providers } from '@/app/Providers';
import { createQueryClient } from '@/app/queryClient';
import '@/lib/zodLocale';
import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Elemento #root não encontrado');
}

createRoot(root).render(
  <StrictMode>
    <Providers queryClient={createQueryClient()}>
      <App />
    </Providers>
  </StrictMode>,
);
