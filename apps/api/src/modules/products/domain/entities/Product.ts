export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  /** Estoque mínimo; 0 desliga o alerta. */
  min_stock: number;
  category_id: string | null;
  /** Resumo da categoria, carregado junto pelo repositório. */
  category: { id: string; name: string } | null;
  /** Nome do arquivo no storage, ou null sem imagem. */
  image: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Regra do alerta: saldo abaixo do mínimo (com mínimo 0, nunca). */
export function isBelowMinStock({
  quantity,
  min_stock,
}: Pick<Product, 'quantity' | 'min_stock'>): boolean {
  return quantity < min_stock;
}
