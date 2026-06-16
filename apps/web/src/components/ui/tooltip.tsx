import { type ComponentProps } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { cn } from '@/lib/utils';

/**
 * Tooltip over Base UI with shadcn-like pieces. We bundle Provider + Root into
 * `Tooltip` so each use is self-contained (the Provider can be nested). The Trigger
 * is used with Base UI's `render` prop to wrap any element (a Button, a Link)
 * without adding an extra DOM wrapper.
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
