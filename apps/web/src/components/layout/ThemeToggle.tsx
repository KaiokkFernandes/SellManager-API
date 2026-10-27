import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, type Theme } from '@/lib/theme';

const NEXT: Record<Theme, Theme> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};
const LABEL: Record<Theme, string> = {
  system: 'Tema: sistema',
  light: 'Tema: claro',
  dark: 'Tema: escuro',
};
const ICON = { system: Monitor, light: Sun, dark: Moon } as const;

/** Alterna sistema → claro → escuro. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = ICON[theme];
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`${LABEL[theme]} (clique para alternar)`}
      title={LABEL[theme]}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}
