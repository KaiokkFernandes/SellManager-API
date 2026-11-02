import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const SLOW_AFTER_MS = 2_500;

/**
 * A função da API pode levar alguns segundos para iniciar depois de um tempo
 * parada. Se a PRIMEIRA requisição demorar, avisa em vez de parecer travado;
 * depois que ela termina, o aviso não volta mais.
 */
export function ConnectionNotice({
  delay = SLOW_AFTER_MS,
}: {
  delay?: number;
}) {
  const pending = useIsFetching() + useIsMutating() > 0;
  const [status, setStatus] = useState<'waiting' | 'slow' | 'connected'>(
    'waiting',
  );

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => {
      setStatus(current => (current === 'connected' ? current : 'slow'));
    }, delay);
    return () => {
      clearTimeout(timer);
      setStatus('connected');
    };
  }, [pending, delay]);

  if (status !== 'slow') return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-4 z-50 mx-auto w-fit rounded-md border bg-background px-4 py-2 text-sm shadow-md"
    >
      Conectando ao servidor...
    </div>
  );
}
