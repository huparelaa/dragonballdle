import "server-only";

import { categoriasClasico, personajes } from "@dle/dragonballdle-data";
import { comparar, fechaEnZona, objetivoDelDia } from "@dle/engine";
import type { Columna, OpcionPersonaje, RespuestaIntento } from "./tipos";

/**
 * El único módulo que conoce el objetivo del día.
 *
 * `import "server-only"` hace fallar el build si un componente de cliente lo
 * importa, aunque sea por accidente. Todo lo que sale de acá hacia el cliente
 * pasa por los tipos de `tipos.ts`, que no incluyen al objetivo.
 */

/** Zona del reset diario. */
export const ZONA = "America/Bogota";

/** Cambiarla reordena todo el histórico. Cada modo de juego lleva la suya. */
const SEMILLA = "dragonballdle:clasico:v1";

/** Día 0 del calendario del juego. */
const EPOCA = "2026-01-01";

export function fechaDeHoy(): string {
  return fechaEnZona(ZONA);
}

/**
 * Escotilla **solo de desarrollo**: `OBJETIVO_DEV=<id>` fija el objetivo del
 * día. Sirve para probar el flujo de victoria —el revelado, la sacudida, el
 * cartel— sin tener que acertar de casualidad.
 *
 * Por qué es segura: se compara contra `process.env.NODE_ENV`, que Next
 * reemplaza en tiempo de compilación, así que en el build de producción la rama
 * entera desaparece. Y aunque no desapareciera, este módulo lleva
 * `import "server-only"`: nada de acá llega al cliente.
 *
 * No cambiar la SEMILLA para esto: eso reordena todo el histórico del juego.
 */
function objetivoForzado() {
  if (process.env.NODE_ENV === "production") return null;

  const id = process.env.OBJETIVO_DEV;
  if (!id) return null;

  const elegido = personajes.find((p) => p.id === id);
  if (!elegido) {
    console.warn(`[reto] OBJETIVO_DEV="${id}" no está en el roster. Se usa el objetivo del día.`);
    return null;
  }

  console.warn(`[reto] objetivo forzado por OBJETIVO_DEV: ${elegido.nombre}`);
  return elegido;
}

function objetivoDe(fecha: string) {
  return objetivoForzado() ?? objetivoDelDia(personajes, { fecha, semilla: SEMILLA, epoca: EPOCA });
}

/** Lista para el autocompletado del cliente: sin un solo atributo comparable. */
export function opciones(): OpcionPersonaje[] {
  return personajes.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    alias: p.alias,
    imagen: p.imagen_base,
  }));
}

/** Cabeceras de la tabla: nombre y tipo de cada categoría, sin valores. */
export function columnas(): Columna[] {
  return categoriasClasico.map((c) => ({ clave: c.clave, etiqueta: c.etiqueta, tipo: c.tipo }));
}

/** Evalúa un intento contra el objetivo de hoy. `null` si el id no existe. */
export function evaluarIntento(id: string): RespuestaIntento | null {
  const intento = personajes.find((p) => p.id === id);
  if (!intento) return null;

  const fecha = fechaDeHoy();
  return {
    fecha,
    resultado: comparar(intento, objetivoDe(fecha), categoriasClasico),
  };
}
