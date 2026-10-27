import type { Entidad } from "./tipos";

/**
 * Deja el texto en minúsculas, sin tildes y sin puntuación, para que "colibri"
 * encuentre a "Colibrí" y "el heroe del norte" a "El Héroe del Norte".
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // marcas diacríticas que NFD dejó sueltas
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Autocompletado por nombre y alias.
 *
 * Ordena por qué tan buena es la coincidencia (exacta > empieza con > contiene)
 * y, a igual calidad, prefiere el nombre por sobre un alias. Entre empates
 * respeta el orden original del roster.
 */
const SIN_COINCIDENCIA = Number.POSITIVE_INFINITY;

/** 0 = exacta, 1 = empieza con, 2 = contiene. `SIN_COINCIDENCIA` si no aparece. */
function calidad(texto: string, consulta: string): number {
  if (texto === consulta) return 0;
  if (texto.startsWith(consulta)) return 1;
  if (texto.includes(consulta)) return 2;
  return SIN_COINCIDENCIA;
}

export function buscar<E extends Entidad>(
  entidades: readonly E[],
  consulta: string,
  limite = 8,
): E[] {
  const q = normalizar(consulta);
  if (!q) return [];

  const puntuados: { entidad: E; puntaje: number }[] = [];

  for (const entidad of entidades) {
    const candidatos = [entidad.nombre, ...(entidad.alias ?? [])];
    let mejor = SIN_COINCIDENCIA;

    candidatos.forEach((candidato, indice) => {
      const c = calidad(normalizar(candidato), q);
      if (c === SIN_COINCIDENCIA) return;
      // El nombre (índice 0) le gana a un alias de la misma calidad.
      mejor = Math.min(mejor, c * 2 + (indice === 0 ? 0 : 1));
    });

    if (mejor !== SIN_COINCIDENCIA) puntuados.push({ entidad, puntaje: mejor });
  }

  // `sort` es estable, así que los empates conservan el orden del roster.
  puntuados.sort((a, b) => a.puntaje - b.puntaje);
  return puntuados.slice(0, limite).map((p) => p.entidad);
}
