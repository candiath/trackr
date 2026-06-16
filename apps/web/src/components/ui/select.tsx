import * as React from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: React.ReactNode;
  value: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<SelectOption>;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * "All in one" Select over Base UI. We keep it closed (it receives `options` and
 * builds trigger + popup) because in this app you always pick a string from a known
 * list; there's no need to compose each part by hand. We pass `items` to the Root
 * so <Select.Value> shows the chosen value's label, and `alignItemWithTrigger={false}`
 * for a classic dropdown (below the trigger).
 */
export function Select({
  value,
  onValueChange,
  options,
  id,
  disabled,
  className,
}: SelectProps) {
  return (
    <BaseSelect.Root
      items={options}
      value={value}
      disabled={disabled}
      onValueChange={(v) => onValueChange(String(v ?? ''))}
    >
      <BaseSelect.Trigger
        id={id}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'data-[popup-open]:ring-2 data-[popup-open]:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <BaseSelect.Value className="truncate" />
        <BaseSelect.Icon className="shrink-0 text-muted-foreground">
          <ChevronDown className="size-4" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner
          sideOffset={4}
          alignItemWithTrigger={false}
          className="z-50"
        >
          <BaseSelect.Popup
            className={cn(
              'max-h-72 min-w-[var(--anchor-width)] overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md',
              'origin-[var(--transform-origin)] transition-[opacity,transform] duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            )}
          >
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                className={cn(
                  'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                  'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
                )}
              >
                <span className="absolute left-2 flex size-4 items-center justify-center">
                  <BaseSelect.ItemIndicator>
                    <Check className="size-4" />
                  </BaseSelect.ItemIndicator>
                </span>
                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
