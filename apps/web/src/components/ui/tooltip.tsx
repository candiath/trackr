import { type ComponentProps } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { cn } from '@/lib/utils';

/**
 * Tooltip sobre Base UI con piezas tipo shadcn. Bundleamos Provider + Root en
 * `Tooltip` para que cada uso sea autocontenido (el Provider se puede anidar).
 * El Trigger se usa con la prop `render` de Base UI para envolver cualquier
 * elemento (un Button, un Link) sin agregar un wrapper extra al DOM.
 */
export function Tooltip({
  children,
  delay = 200,
  ...props
}: ComponentProps<typeof BaseTooltip.Root> & { delay?: number }) {
  return (
    <BaseTooltip.Provider delay={delay}>
      <BaseTooltip.Root {...props}>{children}</BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}

export const TooltipTrigger = BaseTooltip.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: ComponentProps<typeof BaseTooltip.Popup> & { sideOffset?: number }) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner sideOffset={sideOffset} className="z-50">
        <BaseTooltip.Popup
          className={cn(
            'rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md',
            'origin-[var(--transform-origin)] transition-[opacity,transform] duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            className,
          )}
          {...props}
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
