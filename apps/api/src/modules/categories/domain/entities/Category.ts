export interface Category {
  id: string;
  name: string;
  /** Calculado na leitura (produtos com esta categoria). */
  products_count: number;
  created_at: Date;
  updated_at: Date;
}
