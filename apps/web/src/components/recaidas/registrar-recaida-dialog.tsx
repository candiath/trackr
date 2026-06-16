import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  recaidaEventoCreateSchema,
  type Recaida,
  type RecaidaEventoFormData,
} from '@track/shared';
import { ahoraParaInput } from '@/lib/format';
import { recaidaEventoApi, recaidaKeys } from '@/services/recaidas';
import { catalogoKeys, triggerApi } from '@/services/catalogos';
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
import { Select, type SelectOption } from '@/components/ui/select';
import { MoodSelector } from '@/components/mood/mood-selector';
import { IntensidadSelector } from './intensidad-selector';

interface RegistrarRecaidaDialogProps {
  recaida: Recaida;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VALORES_INICIALES: RecaidaEventoFormData = {
  fecha: '',
  triggerId: 'none',
  triggerCustom: '',
  intensidad: null,
  moodNivel: null,
  notas: '',
};

/** Sentinela del Select para "escribir un motivo nuevo". */
const TRIGGER_CUSTOM = '__custom__';

export function RegistrarRecaidaDialog({
  recaida,
  open,
  onOpenChange,
}: RegistrarRecaidaDialogProps) {
  const qc = useQueryClient();

  // El catálogo de triggers alimenta el Select; viene del service de catálogos.
  const { data: triggers = [] } = useQuery({
    queryKey: catalogoKeys.triggers,
    queryFn: triggerApi.list,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<RecaidaEventoFormData>({
    resolver: zodResolver(recaidaEventoCreateSchema),
    // La fecha por defecto es "ahora" (se recalcula cada vez que abre el form).
    defaultValues: { ...VALORES_INICIALES, fecha: ahoraParaInput() },
  });

  const opcionesTrigger: SelectOption[] = [
    { value: 'none', label: 'Sin especificar' },
    ...triggers.map((t) => ({ value: t.id, label: t.nombre })),
    { value: TRIGGER_CUSTOM, label: 'Otro…' },
  ];

  const triggerSeleccionado = watch('triggerId');

  const mutation = useMutation({
    mutationFn: (data: RecaidaEventoFormData) =>
      recaidaEventoApi.create(recaida.id, data),
    onSuccess: () => {
      // Invalida lo que depende de los eventos: la racha vive en ellos.
      qc.invalidateQueries({ queryKey: recaidaKeys.eventos(recaida.id) });
      qc.invalidateQueries({ queryKey: recaidaKeys.all });
      qc.invalidateQueries({ queryKey: catalogoKeys.triggers });
      toast.success('Recaída registrada', {
        description: 'El contador se reinició desde el momento indicado.',
      });
      onOpenChange(false);
      reset({ ...VALORES_INICIALES, fecha: ahoraParaInput() });
    },
  });

  const onSubmit = handleSubmit((values) => {
    const esCustom = values.triggerId === TRIGGER_CUSTOM;
    const sinTrigger = values.triggerId === 'none' || !values.triggerId;
    // Traducimos los valores de UI al contrato del schema antes de persistir.
    mutation.mutate({
      fecha: values.fecha,
      triggerId: esCustom || sinTrigger ? null : values.triggerId,
      triggerCustom: esCustom ? values.triggerCustom?.trim() || undefined : undefined,
      intensidad: values.intensidad ?? null,
      moodNivel: values.moodNivel ?? null,
      notas: values.notas?.trim() || undefined,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar recaída — {recaida.nombre}</DialogTitle>
          <DialogDescription>
            Anotá qué pasó. Sin culpa: registrar ayuda a entender los patrones.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fecha">¿Cuándo fue?</Label>
            <Input id="fecha" type="datetime-local" {...register('fecha')} />
            {errors.fecha && (
              <p className="text-xs text-destructive">{errors.fecha.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trigger">Disparador (motivo)</Label>
            <Controller
              control={control}
              name="triggerId"
              render={({ field }) => (
                <Select
                  id="trigger"
                  options={opcionesTrigger}
                  value={field.value ?? 'none'}
                  onValueChange={field.onChange}
                />
              )}
            />
            {triggerSeleccionado === TRIGGER_CUSTOM && (
              <Input
                className="mt-2"
                placeholder="Escribí el motivo…"
                {...register('triggerCustom')}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Intensidad</Label>
            <Controller
              control={control}
              name="intensidad"
              render={({ field }) => (
                <IntensidadSelector value={field.value ?? null} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>¿Cómo te sentías? (opcional)</Label>
            <Controller
              control={control}
              name="moodNivel"
              render={({ field }) => (
                <MoodSelector value={field.value ?? null} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="¿Qué lo disparó? ¿Qué podrías hacer distinto?"
              {...register('notas')}
            />
            {errors.notas && (
              <p className="text-xs text-destructive">{errors.notas.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : 'Registrar recaída'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
