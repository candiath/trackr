import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { moodEntryCreateSchema, type MoodEntryFormData } from '@track/shared';
import { ahoraParaInput } from '@/lib/format';
import { moodApi, moodKeys } from '@/services/mood';
import { catalogoKeys, factorApi } from '@/services/catalogos';
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
import { MoodSelector } from './mood-selector';
import { FactoresSelector } from './factores-selector';

interface RegistrarMoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VALORES_INICIALES: Omit<MoodEntryFormData, 'nivel'> = {
  fecha: '',
  nota: '',
  factores: [],
  factoresCustom: [],
};

export function RegistrarMoodDialog({ open, onOpenChange }: RegistrarMoodDialogProps) {
  const qc = useQueryClient();

  const { data: factoresCatalogo = [] } = useQuery({
    queryKey: catalogoKeys.factores,
    queryFn: factorApi.list,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MoodEntryFormData>({
    resolver: zodResolver(moodEntryCreateSchema),
    // `nivel` se omite a propósito: es obligatorio y queremos que el usuario lo
    // elija (si no, Zod marca el error al enviar).
    defaultValues: { ...VALORES_INICIALES, fecha: ahoraParaInput() },
  });

  const factoresIds = watch('factores') ?? [];
  const factoresCustom = watch('factoresCustom') ?? [];

  const mutation = useMutation({
    mutationFn: (data: MoodEntryFormData) => moodApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: moodKeys.all });
      // Pudieron crearse factores nuevos: refrescamos el catálogo.
      qc.invalidateQueries({ queryKey: catalogoKeys.factores });
      toast.success('Estado de ánimo registrado');
      onOpenChange(false);
      reset({ ...VALORES_INICIALES, fecha: ahoraParaInput() });
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cómo te sentís?</DialogTitle>
          <DialogDescription>
            Registrá tu ánimo. Podés cargar varios momentos a lo largo del día.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Estado de ánimo</Label>
            <Controller
              control={control}
              name="nivel"
              render={({ field }) => (
                <MoodSelector value={field.value ?? null} onChange={field.onChange} />
              )}
            />
            {errors.nivel && (
              <p className="text-xs text-destructive">Elegí cómo te sentís.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fechaMood">¿Cuándo?</Label>
            <Input id="fechaMood" type="datetime-local" {...register('fecha')} />
            {errors.fecha && (
              <p className="text-xs text-destructive">{errors.fecha.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Factores (opcional)</Label>
            <FactoresSelector
              catalogo={factoresCatalogo}
              value={{ ids: factoresIds, customs: factoresCustom }}
              onChange={(v) => {
                setValue('factores', v.ids);
                setValue('factoresCustom', v.customs);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notaMood">Nota (opcional)</Label>
            <Textarea
              id="notaMood"
              placeholder="¿Qué tenés en la cabeza?"
              {...register('nota')}
            />
            {errors.nota && (
              <p className="text-xs text-destructive">{errors.nota.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
