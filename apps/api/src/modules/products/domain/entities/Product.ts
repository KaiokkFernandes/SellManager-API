export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category_id: string | null;
  /** Resumo da categoria, carregado junto pelo repositório. */
  category: { id: string; name: string } | null;
  /** Nome do arquivo no storage, ou null sem imagem. */
  image: string | null;
  created_at: Date;
  updated_at: Date;
}
