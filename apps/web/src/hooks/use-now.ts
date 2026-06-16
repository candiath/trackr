import { useEffect, useState } from 'react';

/**
 * Devuelve "ahora" y lo actualiza cada `intervaloMs`. Sirve para los contadores
 * en vivo de sobriedad: un único intervalo por componente re-renderiza y todos
 * los cálculos de duración usan ese mismo instante (coherencia entre tarjetas).
 */
export function useNow(intervaloMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);

  return now;
}
