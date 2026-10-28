import type { Product } from '@sellmanager/api-client';
import { Link } from '@tanstack/react-router';
import { useCan } from '@/features/auth';

/** Nome do produto; vira link de edição só para quem pode editar. */
export function ProductName({
  product,
  className,
}: {
  product: Pick<Product, 'id' | 'name'>;
  className: string;
}) {
  const canEdit = useCan()('product:update');
  if (!canEdit) return <span className={className}>{product.name}</span>;
  return (
    <Link
      to="/products/$productId/edit"
      params={{ productId: product.id }}
      className={`${className} hover:underline`}
    >
      {product.name}
    </Link>
  );
}
