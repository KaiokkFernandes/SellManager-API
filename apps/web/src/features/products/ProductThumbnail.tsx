import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Miniatura do produto, com ícone quando não há imagem (decorativa: o nome vem ao lado). */
export function ProductThumbnail({
  url,
  className,
}: {
  url: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted',
        className,
      )}
    >
      {url ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <Package className="size-4 text-muted-foreground" aria-hidden="true" />
      )}
    </span>
  );
}
