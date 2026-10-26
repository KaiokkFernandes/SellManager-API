import {
  ORDER_STATUSES,
  productSchema,
  type Product,
} from '@sellmanager/shared';

// Placeholder: prova a integração com @sellmanager/shared (tipo + schema +
// constante vindos do pacote). As telas virão depois.
const sampleProduct: Product = productSchema.parse({
  id: '5c301fd4-233e-4eac-bb22-994b162e70d2',
  name: 'Teclado',
  price_cents: 19990,
  quantity: 10,
  created_at: '2026-10-24T20:00:00.000Z',
  updated_at: '2026-10-24T20:00:00.000Z',
});

export function App() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: 24,
        maxWidth: 640,
      }}
    >
      <h1>SellManager</h1>
      <p>Front-end em construção. API: {import.meta.env.VITE_API_URL}</p>

      <h2>Tipo importado de @sellmanager/shared</h2>
      <p>
        <code>Product</code> validado com <code>productSchema</code>:
      </p>
      <pre data-testid="shared-product">
        {JSON.stringify(sampleProduct, null, 2)}
      </pre>

      <p>
        <code>ORDER_STATUSES</code>:{' '}
        <span data-testid="shared-statuses">{ORDER_STATUSES.join(', ')}</span>
      </p>
    </main>
  );
}
