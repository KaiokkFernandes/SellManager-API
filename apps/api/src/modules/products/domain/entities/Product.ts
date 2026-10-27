export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  /** Nome do arquivo no storage, ou null sem imagem. */
  image: string | null;
  created_at: Date;
  updated_at: Date;
}
