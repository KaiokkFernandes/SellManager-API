import { ImageOff, ImageUp, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/apiErrors';
import { IMAGE_ACCEPT, validateImageFile } from '@/lib/imageFile';

interface ImageUploadProps {
  /** URL da imagem atual (null = sem imagem). */
  currentUrl: string | null;
  /** Envia o arquivo; chame `onProgress` com a fração enviada (0 a 1). */
  onUpload: (
    file: File,
    onProgress: (fraction: number) => void,
  ) => Promise<unknown>;
  onRemove?: () => Promise<unknown>;
  label?: string;
}

/**
 * Escolher → validar (tipo e tamanho iguais aos da API) → preview → enviar com
 * progresso. Substitui a imagem atual; mostra um placeholder quando não há imagem.
 */
export function ImageUpload({
  currentUrl,
  onUpload,
  onRemove,
  label = 'Imagem',
}: ImageUploadProps) {
  const inputId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const busy = progress !== null || removing;

  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  // libera a URL do preview ao trocar de arquivo ou sair da tela
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function choose(selected: File | undefined) {
    setError(null);
    if (!selected) return;
    const problem = validateImageFile(selected);
    if (problem) {
      setError(problem);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFile(selected);
  }

  function clearSelection() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function send() {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      await onUpload(file, setProgress);
      clearSelection();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setProgress(null);
    }
  }

  async function remove() {
    if (!onRemove) return;
    setRemoving(true);
    setError(null);
    try {
      await onRemove();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setRemoving(false);
    }
  }

  const shown = preview ?? currentUrl;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
        {shown ? (
          <img
            src={shown}
            alt={
              preview
                ? 'Pré-visualização da nova imagem'
                : 'Imagem atual do produto'
            }
            className="size-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <ImageOff className="size-6" aria-hidden="true" />
            Sem imagem
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={IMAGE_ACCEPT}
          disabled={busy}
          aria-describedby={statusId}
          onChange={event => choose(event.target.files?.[0])}
          className="text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
        />
        <p id={statusId} className="text-xs text-muted-foreground">
          JPEG, PNG ou WebP, até 2 MB.
        </p>

        {progress !== null ? (
          <div
            role="progressbar"
            aria-label="Enviando imagem"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full bg-primary transition-[width]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {file ? (
            <>
              <Button
                type="button"
                size="sm"
                onClick={() => void send()}
                disabled={busy}
              >
                {progress !== null ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <ImageUp aria-hidden="true" />
                )}
                {currentUrl ? 'Substituir imagem' : 'Enviar imagem'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                disabled={busy}
              >
                Cancelar
              </Button>
            </>
          ) : null}
          {!file && currentUrl && onRemove ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void remove()}
              disabled={busy}
            >
              {removing ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              Remover imagem
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
