import { type ComponentProps } from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { cn } from '@/lib/utils';

/**
 * Dropdown menu over Base UI with shadcn-like pieces. The Trigger uses Base UI's
 * `render` prop so it can wrap any element (e.g. a Button) without an extra DOM
 * wrapper. Matches the structure of our other ui/ primitives (Tooltip, Select).
 */
export const DropdownMenu = BaseMenu.Root;
export const DropdownMenuTrigger = BaseMenu.Trigger;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = 'end',
  children,
  ...props
}: ComponentProps<typeof BaseMenu.Popup> & {
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
}) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner sideOffset={sideOffset} align={align} className="z-50">
        <BaseMenu.Popup
          className={cn(
            'min-w-44 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md',
            'origin-[var(--transform-origin)] transition-[opacity,transform] duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            className,
          )}
          {...props}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof BaseMenu.Item>) {
  return (
    <BaseMenu.Item
      className={cn(
        'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
        'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

export const DropdownMenuSeparator = ({
  className,
  ...props
}: ComponentProps<typeof BaseMenu.Separator>) => (
  <BaseMenu.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
);
