import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ComponentProps } from 'react';

/**
 * Re-export the next-themes provider under our own name so there's a single place
 * to tweak theme config if needed. next-themes adds/removes the .dark class on
 * <html>, which is what our CSS listens to.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
