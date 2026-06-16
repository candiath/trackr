import type {
  MoodEntry,
  MoodEntryFormData,
  MoodFactor,
  MoodNivel,
  Recaida,
  RecaidaEvento,
  RecaidaEventoFormData,
  RecaidaFormData,
  Trigger,
} from '@track/shared';

/**
 * "Base de datos" en memoria para la Fase 1 (mockdata).
 *
 * Por qué un store mutable y no JSON estático: queremos que el prototipo sea
 * interactivo de verdad — registrar una recaída resetea el contador, agregar un
 * mood lo hace aparecer en el calendario, etc. Cada método devuelve datos
 * CLONADOS y con una latencia simulada, imitando una API real; así, al pasar a
 * Fase 2, los services cambian la implementación interna sin tocar su firma.
 */

/* ------------------------------- utilidades ------------------------------- */

function uid(prefijo: string): string {
  // crypto.randomUUID requiere contexto seguro (HTTPS/localhost); cuando se
  // accede por HTTP desde otra IP (ej: teléfono en red local) no está disponible.
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `${prefijo}_${rand}`;
}

function isoDiasAtras(dias: number, hora = 12, minuto = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

function clone<T>(valor: T): T {
  return structuredClone(valor);
}

// Resuelve tras un pequeño delay y clonando, para simular ida y vuelta de red.
function simular<T>(producir: () => T, ms = 200): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(clone(producir())), ms);
  });
}

/* --------------------------------- seed ---------------------------------- */

const NOMBRES_TRIGGER = [
  'Estrés',
  'Ansiedad',
  'Aburrimiento',
  'Soledad',
  'Presión social',
  'Tristeza',
  'Cansancio',
  'Enojo',
  'Celebración',
  'Insomnio',
  'Costumbre',
  'Antojo',
];

const NOMBRES_FACTOR = [
  'Sueño',
  'Trabajo',
  'Ejercicio',
  'Social',
  'Alimentación',
  'Salud',
  'Familia',
  'Pareja',
  'Dinero',
  'Ocio',
];

const triggers: Trigger[] = NOMBRES_TRIGGER.map((nombre) => ({
  id: uid('trg'),
  nombre,
  esSistema: true,
  createdAt: isoDiasAtras(200),
}));

const factores: MoodFactor[] = NOMBRES_FACTOR.map((nombre) => ({
  id: uid('fac'),
  nombre,
  esSistema: true,
  createdAt: isoDiasAtras(200),
}));

function triggerId(nombre: string): string {
  return triggers.find((t) => t.nombre === nombre)!.id;
}
function factorId(nombre: string): string {
  return factores.find((f) => f.nombre === nombre)!.id;
}

const recaidas: Recaida[] = [
  {
    id: 'rec_alcohol',
    nombre: 'Alcohol',
    descripcion: 'Sin bebidas alcohólicas.',
    color: '#7c3aed',
    icono: 'Wine',
    fechaInicio: isoDiasAtras(75, 9),
    createdAt: isoDiasAtras(75, 9),
    updatedAt: isoDiasAtras(9, 20),
  },
  {
    id: 'rec_tabaco',
    nombre: 'Tabaco',
    descripcion: 'Dejar de fumar.',
    color: '#ef4444',
    icono: 'Cigarette',
    fechaInicio: isoDiasAtras(120, 8),
    createdAt: isoDiasAtras(120, 8),
    updatedAt: isoDiasAtras(3, 8),
  },
  {
    id: 'rec_intimo',
    nombre: 'Hábito íntimo',
    descripcion: 'Reducir la masturbación compulsiva.',
    color: '#ec4899',
    icono: 'HeartCrack',
    fechaInicio: isoDiasAtras(40, 10),
    createdAt: isoDiasAtras(40, 10),
    updatedAt: isoDiasAtras(7, 1),
  },
  {
    id: 'rec_azucar',
    nombre: 'Azúcar',
    descripcion: 'Cortar con el azúcar agregado.',
    color: '#f59e0b',
    icono: 'Candy',
    fechaInicio: isoDiasAtras(30, 7),
    createdAt: isoDiasAtras(30, 7),
    updatedAt: isoDiasAtras(30, 7),
  },
];

type SeedEvento = {
  recaidaId: string;
  diasAtras: number;
  hora: number;
  trigger: string;
  intensidad: RecaidaEvento['intensidad'];
  mood: MoodNivel;
  notas?: string;
};

const SEED_EVENTOS: SeedEvento[] = [
  // Alcohol → racha actual ~9 días.
  { recaidaId: 'rec_alcohol', diasAtras: 60, hora: 22, trigger: 'Celebración', intensidad: 'MODERADA', mood: 'BUENO', notas: 'Cumpleaños de un amigo.' },
  { recaidaId: 'rec_alcohol', diasAtras: 28, hora: 21, trigger: 'Estrés', intensidad: 'INTENSA', mood: 'MALO', notas: 'Semana complicada en el trabajo.' },
  { recaidaId: 'rec_alcohol', diasAtras: 9, hora: 20, trigger: 'Presión social', intensidad: 'LEVE', mood: 'REGULAR', notas: 'Asado: me ofrecieron y acepté.' },
  // Tabaco → racha actual ~3 días.
  { recaidaId: 'rec_tabaco', diasAtras: 70, hora: 13, trigger: 'Costumbre', intensidad: 'LEVE', mood: 'REGULAR' },
  { recaidaId: 'rec_tabaco', diasAtras: 45, hora: 16, trigger: 'Ansiedad', intensidad: 'MODERADA', mood: 'MALO' },
  { recaidaId: 'rec_tabaco', diasAtras: 30, hora: 11, trigger: 'Aburrimiento', intensidad: 'LEVE', mood: 'REGULAR' },
  { recaidaId: 'rec_tabaco', diasAtras: 16, hora: 19, trigger: 'Estrés', intensidad: 'MODERADA', mood: 'MALO' },
  { recaidaId: 'rec_tabaco', diasAtras: 3, hora: 8, trigger: 'Cansancio', intensidad: 'LEVE', mood: 'REGULAR', notas: 'Mañana dura, caí con uno.' },
  // Hábito íntimo → racha actual ~7 días.
  { recaidaId: 'rec_intimo', diasAtras: 30, hora: 23, trigger: 'Aburrimiento', intensidad: 'MODERADA', mood: 'REGULAR' },
  { recaidaId: 'rec_intimo', diasAtras: 18, hora: 0, trigger: 'Insomnio', intensidad: 'LEVE', mood: 'MALO' },
  { recaidaId: 'rec_intimo', diasAtras: 7, hora: 1, trigger: 'Soledad', intensidad: 'INTENSA', mood: 'MALO', notas: 'Noche difícil.' },
  // Azúcar → sin recaídas (racha = desde el inicio, ~30 días).
];

let eventos: RecaidaEvento[] = SEED_EVENTOS.map((e) => ({
  id: uid('evt'),
  recaidaId: e.recaidaId,
  fecha: isoDiasAtras(e.diasAtras, e.hora),
  triggerId: triggerId(e.trigger),
  triggerNombre: e.trigger,
  intensidad: e.intensidad,
  moodNivel: e.mood,
  notas: e.notas ?? null,
  createdAt: isoDiasAtras(e.diasAtras, e.hora),
}));

// Genera ~30 días de moods (1 a 3 por día) para que el calendario, la tendencia
// y el timeline tengan material realista desde el primer arranque.
function generarMoods(): MoodEntry[] {
  const patron: MoodNivel[] = [
    'BUENO', 'REGULAR', 'MUY_BUENO', 'MALO', 'BUENO',
    'REGULAR', 'MUY_MALO', 'BUENO', 'MUY_BUENO', 'REGULAR',
    'MALO', 'BUENO', 'REGULAR', 'MUY_BUENO', 'BUENO',
  ];
  const factoresPorNivel: Record<MoodNivel, string[]> = {
    MUY_BUENO: ['Ejercicio', 'Social', 'Sueño'],
    BUENO: ['Trabajo', 'Ocio'],
    REGULAR: ['Trabajo', 'Sueño'],
    MALO: ['Dinero', 'Salud'],
    MUY_MALO: ['Salud', 'Sueño'],
  };
  const notas: Partial<Record<MoodNivel, string>> = {
    MUY_BUENO: 'Buen día, con energía.',
    MALO: 'Día pesado.',
    MUY_MALO: 'Me costó mucho hoy.',
  };

  const lista: MoodEntry[] = [];
  for (let d = 29; d >= 0; d--) {
    const cantidad = 1 + (d % 3 === 0 ? 1 : 0) + (d % 7 === 0 ? 1 : 0);
    for (let k = 0; k < cantidad; k++) {
      const nivel = patron[(d * 2 + k) % patron.length];
      const nombresFactor = factoresPorNivel[nivel];
      lista.push({
        id: uid('mood'),
        fecha: isoDiasAtras(d, 9 + k * 5, 30),
        nivel,
        nota: k === 0 ? (notas[nivel] ?? null) : null,
        factores: nombresFactor.map(factorId),
        factoresNombres: nombresFactor,
        createdAt: isoDiasAtras(d, 9 + k * 5, 30),
      });
    }
  }
  return lista;
}

let moods: MoodEntry[] = generarMoods();

/* ------------------------------ operaciones ------------------------------ */

function resolverTrigger(data: {
  triggerId?: string | null;
  triggerCustom?: string;
}): { id: string | null; nombre: string | null } {
  // Prioridad al texto libre: si el usuario escribió un motivo nuevo, lo
  // creamos en el catálogo (o reusamos si ya existe) y lo enlazamos.
  const custom = data.triggerCustom?.trim();
  if (custom) {
    const existente = triggers.find(
      (t) => t.nombre.toLowerCase() === custom.toLowerCase(),
    );
    if (existente) return { id: existente.id, nombre: existente.nombre };
    const nuevo: Trigger = {
      id: uid('trg'),
      nombre: custom,
      esSistema: false,
      createdAt: new Date().toISOString(),
    };
    triggers.push(nuevo);
    return { id: nuevo.id, nombre: nuevo.nombre };
  }
  if (data.triggerId) {
    const t = triggers.find((x) => x.id === data.triggerId);
    if (t) return { id: t.id, nombre: t.nombre };
  }
  return { id: null, nombre: null };
}

function nombresFactores(ids: string[]): string[] {
  return ids
    .map((id) => factores.find((f) => f.id === id)?.nombre)
    .filter((n): n is string => Boolean(n));
}

export const mockDb = {
  /* catálogos */
  listTriggers: () => simular(() => triggers),
  listFactores: () => simular(() => factores),
  crearFactor: (nombre: string) =>
    simular(() => {
      const limpio = nombre.trim();
      const existente = factores.find(
        (f) => f.nombre.toLowerCase() === limpio.toLowerCase(),
      );
      if (existente) return existente;
      const nuevo: MoodFactor = {
        id: uid('fac'),
        nombre: limpio,
        esSistema: false,
        createdAt: new Date().toISOString(),
      };
      factores.push(nuevo);
      return nuevo;
    }),

  /* recaídas (conductas) */
  listRecaidas: () => simular(() => recaidas),
  getRecaida: (id: string) =>
    simular(() => recaidas.find((r) => r.id === id) ?? null),
  crearRecaida: (data: RecaidaFormData) =>
    simular(() => {
      const ahora = new Date().toISOString();
      const nueva: Recaida = {
        id: uid('rec'),
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        color: data.color,
        icono: data.icono,
        fechaInicio: new Date(data.fechaInicio).toISOString(),
        createdAt: ahora,
        updatedAt: ahora,
      };
      recaidas.push(nueva);
      return nueva;
    }),
  eliminarRecaida: (id: string) =>
    simular(() => {
      const i = recaidas.findIndex((r) => r.id === id);
      if (i >= 0) recaidas.splice(i, 1);
      eventos = eventos.filter((e) => e.recaidaId !== id);
      return undefined;
    }),

  /* eventos de recaída */
  listEventos: (recaidaId: string) =>
    simular(() =>
      eventos
        .filter((e) => e.recaidaId === recaidaId)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
    ),
  crearEvento: (recaidaId: string, data: RecaidaEventoFormData) =>
    simular(() => {
      const trg = resolverTrigger(data);
      const nuevo: RecaidaEvento = {
        id: uid('evt'),
        recaidaId,
        fecha: new Date(data.fecha).toISOString(),
        triggerId: trg.id,
        triggerNombre: trg.nombre,
        intensidad: data.intensidad ?? null,
        moodNivel: data.moodNivel ?? null,
        notas: data.notas?.trim() ? data.notas.trim() : null,
        createdAt: new Date().toISOString(),
      };
      eventos.push(nuevo);
      const rec = recaidas.find((r) => r.id === recaidaId);
      if (rec) rec.updatedAt = nuevo.createdAt;
      return nuevo;
    }),
  eliminarEvento: (id: string) =>
    simular(() => {
      const i = eventos.findIndex((e) => e.id === id);
      if (i >= 0) eventos.splice(i, 1);
      return undefined;
    }),

  /* mood */
  listMoods: () =>
    simular(() =>
      [...moods].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      ),
    ),
  crearMood: (data: MoodEntryFormData) =>
    simular(() => {
      // Factores escritos a mano: se crean en el catálogo antes de enlazarlos.
      const idsCustom = (data.factoresCustom ?? [])
        .map((nombre) => nombre.trim())
        .filter(Boolean)
        .map((nombre) => {
          const existente = factores.find(
            (f) => f.nombre.toLowerCase() === nombre.toLowerCase(),
          );
          if (existente) return existente.id;
          const nuevo: MoodFactor = {
            id: uid('fac'),
            nombre,
            esSistema: false,
            createdAt: new Date().toISOString(),
          };
          factores.push(nuevo);
          return nuevo.id;
        });

      const idsFactores = [...new Set([...data.factores, ...idsCustom])];
      const nuevo: MoodEntry = {
        id: uid('mood'),
        fecha: new Date(data.fecha).toISOString(),
        nivel: data.nivel,
        nota: data.nota?.trim() ? data.nota.trim() : null,
        factores: idsFactores,
        factoresNombres: nombresFactores(idsFactores),
        createdAt: new Date().toISOString(),
      };
      moods.push(nuevo);
      return nuevo;
    }),
  eliminarMood: (id: string) =>
    simular(() => {
      const i = moods.findIndex((m) => m.id === id);
      if (i >= 0) moods.splice(i, 1);
      return undefined;
    }),
};
