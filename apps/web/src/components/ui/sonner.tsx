import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from '@/lib/theme';

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return <Sonner theme={resolvedTheme} richColors closeButton {...props} />;
}
