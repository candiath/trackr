import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ComponentProps } from 'react';

/**
 * Re-exportamos el provider de next-themes con nuestro nombre para tener un
 * único punto donde, si hace falta, ajustar la config de temas. next-themes
 * agrega/quita la clase .dark en <html>, que es lo que escucha nuestro CSS.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
