import { type ComponentProps } from 'react';
import { Separator as BaseSeparator } from '@base-ui/react/separator';
import { cn } from '@/lib/utils';

// Separador sobre Base UI (aporta el role/aria correctos). Por defecto
// horizontal; soporta vertical para divisiones en línea.
export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: ComponentProps<typeof BaseSeparator>) {
  return (
    <BaseSeparator
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
}
