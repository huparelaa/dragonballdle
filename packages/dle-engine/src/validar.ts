import { normalizar } from "./buscar";
import type { Categoria, Entidad } from "./tipos";

/** Orden por punto de código, no por locale: la firma debe ser igual en toda máquina. */
function ordenCanonico(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Cómo se ve una entidad a ojos del juego: si dos coinciden, son indistinguibles. */
export function firma<E>(entidad: E, categorias: readonly Categoria<E>[]): string {
  return categorias
    .map((c) => {
      if (c.tipo === "multivalor") {
        return [...new Set(c.valor(entidad))].sort(ordenCanonico).join("+");
      }
      if (c.tipo === "ordinal") return String(c.orden(entidad));
      return c.valor(entidad);
    })
    .join(" | ");
}

export interface Colision {
  readonly firma: string;
  readonly ids: string[];
}

/**
 * La regla de unicidad: dos entidades con la misma firma hacen que el reto
 * diario tenga dos respuestas correctas y el juego queda roto. Debe devolver
 * siempre una lista vacía.
 */
export function colisiones<E extends Entidad>(
  entidades: readonly E[],
  categorias: readonly Categoria<E>[],
): Colision[] {
  const grupos = new Map<string, string[]>();
  for (const entidad of entidades) {
    const clave = firma(entidad, categorias);
    const grupo = grupos.get(clave);
    if (grupo) grupo.push(entidad.id);
    else grupos.set(clave, [entidad.id]);
  }
  return [...grupos]
    .filter(([, ids]) => ids.length > 1)
    .map(([clave, ids]) => ({ firma: clave, ids }));
}

export interface NombreAmbiguo {
  readonly nombre: string;
  readonly ids: string[];
}

/**
 * Un nombre o alias que, normalizado, apunta a más de una entidad: el
 * autocompletado no podría resolverlo sin adivinar.
 */
export function nombresAmbiguos<E extends Entidad>(entidades: readonly E[]): NombreAmbiguo[] {
  const grupos = new Map<string, Set<string>>();
  for (const entidad of entidades) {
    for (const texto of [entidad.nombre, ...(entidad.alias ?? [])]) {
      const clave = normalizar(texto);
      const grupo = grupos.get(clave);
      if (grupo) grupo.add(entidad.id);
      else grupos.set(clave, new Set([entidad.id]));
    }
  }
  return [...grupos]
    .filter(([, ids]) => ids.size > 1)
    .map(([nombre, ids]) => ({ nombre, ids: [...ids] }));
}
