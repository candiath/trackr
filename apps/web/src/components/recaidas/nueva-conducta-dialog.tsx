import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { recaidaCreateSchema, type RecaidaFormData } from '@track/shared';
import { recaidaApi, recaidaKeys } from '@/services/recaidas';
import { COLOR_OPCIONES, ICONO_OPCIONES } from '@/lib/recaida-icons';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NuevaConductaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function fechaHoyInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function NuevaConductaDialog({ open, onOpenChange }: NuevaConductaDialogProps) {
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RecaidaFormData>({
    resolver: zodResolver(recaidaCreateSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      color: COLOR_OPCIONES[0],
      icono: ICONO_OPCIONES[0].value,
      fechaInicio: fechaHoyInput(),
    },
  });

  const mutation = useMutation({
    mutationFn: (data: RecaidaFormData) => recaidaApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recaidaKeys.all });
      toast.success('Conducta creada', {
        description: 'Ya podés seguir tu progreso.',
      });
      onOpenChange(false);
      reset({
        nombre: '',
        descripcion: '',
        color: COLOR_OPCIONES[0],
        icono: ICONO_OPCIONES[0].value,
        fechaInicio: fechaHoyInput(),
      });
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva conducta a seguir</DialogTitle>
          <DialogDescription>
            Algo que querés dejar. Vamos a contar el tiempo desde la fecha de inicio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" placeholder="Ej: Alcohol, Tabaco…" {...register('nombre')} />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              placeholder="Una nota para tu yo del futuro…"
              {...register('descripcion')}
            />
          </div>

          <div className="space-y-2">
            <Label>Ícono</Label>
            <Controller
              control={control}
              name="icono"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {ICONO_OPCIONES.map((op) => {
                    const Icono = op.Icon;
                    const activo = field.value === op.value;
                    return (
                      <button
                        type="button"
                        key={op.value}
                        title={op.label}
                        onClick={() => field.onChange(op.value)}
                        className={cn(
                          'grid size-10 place-items-center rounded-lg border transition-colors',
                          activo
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent',
                        )}
                      >
                        <Icono className="size-5" />
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPCIONES.map((color) => {
                    const activo = field.value === color;
                    return (
                      <button
                        type="button"
                        key={color}
                        aria-label={`Color ${color}`}
                        onClick={() => field.onChange(color)}
                        className="grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-background transition-shadow"
                        style={{
                          backgroundColor: color,
                          boxShadow: activo ? `0 0 0 2px ${color}` : undefined,
                        }}
                      >
                        {activo && <Check className="size-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fechaInicio">Sin recaídas desde…</Label>
            <Input id="fechaInicio" type="date" {...register('fechaInicio')} />
            {errors.fechaInicio && (
              <p className="text-xs text-destructive">{errors.fechaInicio.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creando…' : 'Crear conducta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
