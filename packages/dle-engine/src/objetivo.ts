/**
 * Elección determinística del objetivo del día: mismo día, mismo personaje
 * para todo el mundo, sin guardar nada. No usa random real.
 */

const DIA_MS = 86_400_000;

/** La fecha de hoy (`YYYY-MM-DD`) en una zona horaria, que es la que define el reset diario. */
export function fechaEnZona(zona: string, ahora: Date = new Date()): string {
  // `en-CA` formatea justamente como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

function aUTC(fecha: string): number {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) throw new Error(`Fecha inválida: "${fecha}" (se espera YYYY-MM-DD)`);
  return Date.UTC(anio, mes - 1, dia);
}

/** Días enteros entre dos fechas `YYYY-MM-DD`. Puede ser negativo. */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aUTC(hasta) - aUTC(desde)) / DIA_MS);
}

/** FNV-1a: texto → entero de 32 bits, estable entre corridas y plataformas. */
function semillaNumerica(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: generador pseudoaleatorio chico y determinístico. */
function generador(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates con semilla: la misma semilla da siempre el mismo orden. */
export function barajar<T>(items: readonly T[], semilla: string): T[] {
  const salida = items.slice();
  const azar = generador(semillaNumerica(semilla));
  for (let i = salida.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [salida[i], salida[j]] = [salida[j], salida[i]];
  }
  return salida;
}

export interface OpcionesObjetivo {
  /** `YYYY-MM-DD` en la zona del juego. */
  readonly fecha: string;
  /** Cambiarla reordena todo el histórico. Cada modo de juego lleva la suya. */
  readonly semilla: string;
  /** Día 0 del calendario del juego, `YYYY-MM-DD`. */
  readonly epoca: string;
}

/**
 * El objetivo de un día.
 *
 * En vez de `hash(fecha) % n` —que repite personajes al azar y deja otros sin
 * salir nunca— se baraja el roster completo una vez por vuelta y se recorre en
 * orden: ningún personaje se repite hasta que salieron todos.
 */
export function objetivoDelDia<E>(entidades: readonly E[], opciones: OpcionesObjetivo): E {
  const n = entidades.length;
  if (n === 0) throw new Error("objetivoDelDia: el roster está vacío");

  const dias = diasEntre(opciones.epoca, opciones.fecha);
  const vuelta = Math.floor(dias / n);
  const posicion = ((dias % n) + n) % n; // módulo positivo, por si la fecha es anterior a la época

  return barajar(entidades, `${opciones.semilla}:${vuelta}`)[posicion];
}
