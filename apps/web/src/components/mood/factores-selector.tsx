import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { MoodFactor } from '@track/shared';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface FactoresValue {
  /** Ids de factores del catálogo. */
  ids: string[];
  /** Factores nuevos escritos a mano (se crean al guardar). */
  customs: string[];
}

interface FactoresSelectorProps {
  catalogo: MoodFactor[];
  value: FactoresValue;
  onChange: (value: FactoresValue) => void;
}

/**
 * Selector de factores: chips del catálogo (toggle) + alta de factores propios.
 * Mantiene ids y customs separados porque el catálogo se referencia por id y lo
 * nuevo se crea al guardar; mezclarlos haría ambigua la persistencia.
 */
export function FactoresSelector({ catalogo, value, onChange }: FactoresSelectorProps) {
  const [texto, setTexto] = useState('');

  function toggle(id: string) {
    const ids = value.ids.includes(id)
      ? value.ids.filter((x) => x !== id)
      : [...value.ids, id];
    onChange({ ...value, ids });
  }

  function agregarCustom() {
    const limpio = texto.trim();
    if (!limpio) return;

    // Si ya existe en el catálogo, lo seleccionamos en vez de duplicarlo.
    const enCatalogo = catalogo.find(
      (f) => f.nombre.toLowerCase() === limpio.toLowerCase(),
    );
    if (enCatalogo) {
      if (!value.ids.includes(enCatalogo.id)) {
        onChange({ ...value, ids: [...value.ids, enCatalogo.id] });
      }
    } else if (!value.customs.some((c) => c.toLowerCase() === limpio.toLowerCase())) {
      onChange({ ...value, customs: [...value.customs, limpio] });
    }
    setTexto('');
  }

  function quitarCustom(nombre: string) {
    onChange({ ...value, customs: value.customs.filter((c) => c !== nombre) });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {catalogo.map((f) => {
          const activo = value.ids.includes(f.id);
          return (
            <button
              type="button"
              key={f.id}
              onClick={() => toggle(f.id)}
              aria-pressed={activo}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                activo
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent',
              )}
            >
              {f.nombre}
            </button>
          );
        })}

        {value.customs.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            {c}
            <button type="button" onClick={() => quitarCustom(c)} aria-label={`Quitar ${c}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Agregar otro factor…"
          // Enter agrega sin enviar el formulario contenedor.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              agregarCustom();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={agregarCustom}>
          <Plus />
        </Button>
      </div>
    </div>
  );
}
