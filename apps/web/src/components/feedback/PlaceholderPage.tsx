import { PageHeader } from './PageHeader';

/** Página reservada: o CRUD do recurso vem na próxima etapa. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Esta tela será implementada na próxima etapa.
      </div>
    </>
  );
}
