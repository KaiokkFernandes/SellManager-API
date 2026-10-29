import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/feedback/PageHeader';
import { ImageUpload } from '@/components/image-upload';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermission } from '@/features/auth';
import { getErrorMessage } from '@/lib/apiErrors';
import { DeleteProductDialog } from './DeleteProductDialog';
import { ProductForm } from './ProductForm';
import { StockBadge } from './StockBadge';
import { StockMovementsPanel } from './StockMovementsPanel';
import {
  useCreateProduct,
  useProduct,
  useRemoveProductImage,
  useUpdateProduct,
  useUploadProductImage,
} from './queries';

export function NewProductPage() {
  const navigate = useNavigate();
  const create = useCreateProduct();

  return (
    <>
      <PageHeader
        title="Novo produto"
        description="Depois de salvar, você poderá enviar a imagem."
      />
      <Card>
        <CardContent className="pt-6">
          <ProductForm
            submitLabel="Cadastrar produto"
            withInitialStock
            onSubmit={values => create.mutateAsync(values)}
            // a imagem é enviada na tela de edição, já com o produto criado
            onSaved={created =>
              void navigate({
                to: '/products/$productId/edit',
                params: { productId: created.id },
              })
            }
            onCancel={() => void navigate({ to: '/products' })}
          />
        </CardContent>
      </Card>
    </>
  );
}

const editRoute = getRouteApi('/authenticated/products/$productId/edit');

export function EditProductPage() {
  const { productId } = editRoute.useParams();
  const search = editRoute.useSearch();
  const navigate = useNavigate();
  const setSearch = editRoute.useNavigate();
  const canSeeStock = usePermission('stock:read');
  const tab = canSeeStock && search.tab === 'movements' ? 'movements' : 'data';
  const product = useProduct(productId);
  const update = useUpdateProduct(productId);
  const upload = useUploadProductImage(productId);
  const removeImage = useRemoveProductImage(productId);
  const [deleting, setDeleting] = useState(false);
  const toList = () => void navigate({ to: '/products' });

  if (product.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (product.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-destructive">
          {getErrorMessage(product.error)}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void product.refetch()}
        >
          Tentar de novo
        </Button>
      </div>
    );
  }

  const { data } = product;
  return (
    <>
      <PageHeader
        title={data.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            Editar produto · Estoque: <StockBadge product={data} />
          </span>
        }
        actions={
          <Button variant="outline" onClick={() => setDeleting(true)}>
            <Trash2 aria-hidden="true" />
            Excluir
          </Button>
        }
      />
      <Tabs
        value={tab}
        onValueChange={value =>
          void setSearch({
            search: {
              tab: value === 'movements' ? 'movements' : undefined,
            },
          })
        }
      >
        {canSeeStock ? (
          <TabsList>
            <TabsTrigger value="data">Dados</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
          </TabsList>
        ) : null}
        <TabsContent value="data">
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <Card>
              <CardHeader>
                <CardTitle>Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductForm
                  defaultValues={{
                    name: data.name,
                    price_cents: data.price_cents,
                    quantity: data.quantity,
                    category_id: data.category?.id ?? null,
                    min_stock: data.min_stock,
                  }}
                  submitLabel="Salvar alterações"
                  // o PUT não leva estoque (o campo nem aparece aqui)
                  onSubmit={({ quantity: _stock, ...body }) =>
                    update.mutateAsync(body)
                  }
                  onSaved={toList}
                  onCancel={toList}
                />
              </CardContent>
            </Card>
            <Card className="self-start">
              <CardHeader>
                <CardTitle>Imagem</CardTitle>
                <CardDescription>Aparece na lista de produtos.</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  label="Arquivo da imagem"
                  currentUrl={data.image_url}
                  onUpload={(file, onProgress) =>
                    upload.mutateAsync({ file, onProgress })
                  }
                  onRemove={() => removeImage.mutateAsync()}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {canSeeStock ? (
          <TabsContent value="movements">
            <StockMovementsPanel
              productId={productId}
              page={search.page ?? 1}
              onPageChange={page =>
                void setSearch({ search: prev => ({ ...prev, page }) })
              }
            />
          </TabsContent>
        ) : null}
      </Tabs>
      <DeleteProductDialog
        product={deleting ? data : null}
        onOpenChange={setDeleting}
        onDeleted={toList}
      />
    </>
  );
}
