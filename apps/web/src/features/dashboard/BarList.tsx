import { Link, type LinkProps } from '@tanstack/react-router';

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  /** Valor formatado à direita (ex.: "R$ 1.234,00"). */
  display: string;
  detail?: string;
  /** Leva para a lista filtrada correspondente. */
  link?: Pick<LinkProps, 'to' | 'search' | 'params'>;
}

/**
 * Barras horizontais em HTML: cada linha é um link de verdade (teclado e
 * leitor de tela), cabe em 375px e usa as cores do tema.
 */
export function BarList({
  items,
  label,
}: {
  items: readonly BarListItem[];
  label: string;
}) {
  const max = Math.max(...items.map(item => item.value), 1);
  return (
    <ul aria-label={label} className="space-y-3">
      {items.map(item => {
        const content = (
          <>
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{item.label}</span>
              <span className="shrink-0 tabular-nums">{item.display}</span>
            </span>
            <span
              aria-hidden="true"
              className="mt-1 block h-2 overflow-hidden rounded-full bg-muted"
            >
              <span
                className="block h-full rounded-full bg-[var(--chart-1)]"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </span>
            {item.detail ? (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {item.detail}
              </span>
            ) : null}
          </>
        );
        return (
          <li key={item.key}>
            {item.link ? (
              <Link
                {...item.link}
                className="block rounded-md p-1 -m-1 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {content}
              </Link>
            ) : (
              <div>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
