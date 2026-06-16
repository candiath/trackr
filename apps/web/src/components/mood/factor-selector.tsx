import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { MoodFactor } from '@track/shared';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface FactorsValue {
  /** Ids of catalog factors. */
  ids: string[];
  /** New factors typed by hand (created on save). */
  customs: string[];
}

interface FactorSelectorProps {
  catalog: MoodFactor[];
  value: FactorsValue;
  onChange: (value: FactorsValue) => void;
}

/**
 * Factor selector: catalog chips (toggle) + adding your own factors. Keeps ids and
 * customs separate because the catalog is referenced by id and new ones are
 * created on save; mixing them would make persistence ambiguous.
 */
export function FactorSelector({ catalog, value, onChange }: FactorSelectorProps) {
  const [text, setText] = useState('');

  function toggle(id: string) {
    const ids = value.ids.includes(id)
      ? value.ids.filter((x) => x !== id)
      : [...value.ids, id];
    onChange({ ...value, ids });
  }

  function addCustom() {
    const clean = text.trim();
    if (!clean) return;

    // If it already exists in the catalog, select it instead of duplicating it.
    const inCatalog = catalog.find(
      (f) => f.name.toLowerCase() === clean.toLowerCase(),
    );
    if (inCatalog) {
      if (!value.ids.includes(inCatalog.id)) {
        onChange({ ...value, ids: [...value.ids, inCatalog.id] });
      }
    } else if (!value.customs.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      onChange({ ...value, customs: [...value.customs, clean] });
    }
    setText('');
  }

  function removeCustom(name: string) {
    onChange({ ...value, customs: value.customs.filter((c) => c !== name) });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {catalog.map((f) => {
          const active = value.ids.includes(f.id);
          return (
            <button
              type="button"
              key={f.id}
              onClick={() => toggle(f.id)}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent',
              )}
            >
              {f.name}
            </button>
          );
        })}

        {value.customs.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            {c}
            <button type="button" onClick={() => removeCustom(c)} aria-label={`Remove ${c}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add another factor…"
          // Enter adds without submitting the containing form.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={addCustom}>
          <Plus />
        </Button>
      </div>
    </div>
  );
}
