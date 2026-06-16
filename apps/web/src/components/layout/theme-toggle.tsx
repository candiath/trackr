import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Botón para alternar claro/oscuro. El `mounted` evita el desajuste típico de
 * next-themes: en el primer render el tema resuelto todavía no se conoce, así
 * que esperamos a montar para mostrar el ícono correcto.
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const esOscuro = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar tema"
      title={esOscuro ? 'Cambiar a claro' : 'Cambiar a oscuro'}
      onClick={() => setTheme(esOscuro ? 'light' : 'dark')}
    >
      {mounted && esOscuro ? <Sun /> : <Moon />}
    </Button>
  );
}
