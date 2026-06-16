/**
 * Helpers de fecha y duración. Centralizados para que toda la app muestre
 * fechas con el mismo locale (es-AR) y el mismo criterio de redondeo.
 */

const LOCALE = 'es-AR';

export interface Duracion {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  totalMs: number;
  /** Días con decimales, útil para comparar contra hitos. */
  totalDias: number;
}

/**
 * Descompone el tiempo transcurrido entre dos instantes. `hasta` se inyecta
 * (en vez de usar Date.now() adentro) para que el contador en vivo pueda pasar
 * el "ahora" que tickea cada segundo y el cálculo sea puro/testeable.
 */
export function calcularDuracion(
  desdeIso: string,
  hasta: Date = new Date(),
): Duracion {
  const desde = new Date(desdeIso).getTime();
  const totalMs = Math.max(0, hasta.getTime() - desde);
  const totalSeg = Math.floor(totalMs / 1000);

  return {
    dias: Math.floor(totalSeg / 86400),
    horas: Math.floor((totalSeg % 86400) / 3600),
    minutos: Math.floor((totalSeg % 3600) / 60),
    segundos: totalSeg % 60,
    totalMs,
    totalDias: totalMs / 86_400_000,
  };
}

/** "12d 04h 03m 20s" — formato compacto para el contador en vivo. */
export function formatDuracionContador(d: Duracion): string {
  const dd = String(d.dias);
  const hh = String(d.horas).padStart(2, '0');
  const mm = String(d.minutos).padStart(2, '0');
  const ss = String(d.segundos).padStart(2, '0');
  return `${dd}d ${hh}h ${mm}m ${ss}s`;
}

/**
 * Cuenta regresiva hacia el próximo día completo: "hh:mm:ss" que falta para que
 * el anillo de 24 h se complete. Recibe el total transcurrido en ms.
 */
export function cuentaRegresivaDia(totalMs: number): string {
  const restanteMs = 86_400_000 - (totalMs % 86_400_000);
  const totalSeg = Math.floor(restanteMs / 1000) % 86_400; // 24:00:00 → 00:00:00
  const hh = String(Math.floor(totalSeg / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSeg % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSeg % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/** "12 días" / "1 día" / "5 horas" — texto humano y corto. */
export function formatDuracionHumana(d: Duracion): string {
  if (d.dias >= 1) return `${d.dias} ${d.dias === 1 ? 'día' : 'días'}`;
  if (d.horas >= 1) return `${d.horas} ${d.horas === 1 ? 'hora' : 'horas'}`;
  if (d.minutos >= 1)
    return `${d.minutos} ${d.minutos === 1 ? 'minuto' : 'minutos'}`;
  return 'recién';
}

export function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "hace 2 horas", "hace 3 días"… usando Intl.RelativeTimeFormat. */
export function formatFechaRelativa(iso: string, ahora: Date = new Date()): string {
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
  const diffMs = new Date(iso).getTime() - ahora.getTime();
  const diffSeg = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSeg);

  if (abs < 60) return rtf.format(Math.round(diffSeg), 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSeg / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSeg / 3600), 'hour');
  if (abs < 2_592_000) return rtf.format(Math.round(diffSeg / 86400), 'day');
  return rtf.format(Math.round(diffSeg / 2_592_000), 'month');
}

/** Devuelve YYYY-MM-DD (clave de día) en horario local, para agrupar por jornada. */
export function claveDia(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Valor por defecto para inputs datetime-local (ahora, en horario local). */
export function ahoraParaInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
