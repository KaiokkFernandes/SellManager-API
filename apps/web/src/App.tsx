import { useState, type FormEvent } from 'react';
import { ApiClientError, unwrap, type Product } from '@sellmanager/api-client';
import { ORDER_STATUSES } from '@sellmanager/shared';
import { api } from '@/lib/api';
import { tokenStorage } from '@/lib/tokenStorage';

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function describeError(error: unknown): string {
  return error instanceof ApiClientError
    ? `${error.code}: ${error.message}`
    : String(error);
}

// Exemplo mínimo da cadeia contrato -> openapi.json -> api-client -> web.
// Não é uma tela do produto: as telas virão depois.
export function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const session = await unwrap(
        api.POST('/sessions', { body: { email, password } }),
      );
      tokenStorage.set(session.token);
      setUserName(session.user.name);
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  async function listProducts() {
    setError(null);
    try {
      const page = await unwrap(
        api.GET('/products', { params: { query: { limit: 10 } } }),
      );
      setProducts(page.data);
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: 24,
        maxWidth: 640,
      }}
    >
      <h1>SellManager</h1>
      <p>
        Exemplo da integração com a API ({import.meta.env.VITE_API_URL}) via{' '}
        <code>@sellmanager/api-client</code>. Status de pedido do contrato:{' '}
        <span data-testid="shared-statuses">{ORDER_STATUSES.join(', ')}</span>
      </p>

      <form onSubmit={event => void login(event)}>
        <input
          aria-label="E-mail"
          placeholder="e-mail"
          value={email}
          onChange={event => setEmail(event.target.value)}
        />{' '}
        <input
          aria-label="Senha"
          type="password"
          placeholder="senha"
          value={password}
          onChange={event => setPassword(event.target.value)}
        />{' '}
        <button type="submit">Entrar</button>
      </form>
      {userName && <p data-testid="session">Logado como {userName}</p>}

      <p>
        <button type="button" onClick={() => void listProducts()}>
          Listar produtos
        </button>
      </p>

      {error && (
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      )}

      {products && (
        <ul data-testid="products">
          {products.map(product => (
            <li key={product.id}>
              {product.name}: {brl.format(product.price_cents / 100)} (
              {product.quantity} em estoque)
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
