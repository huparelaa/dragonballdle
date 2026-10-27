import type { Entidad } from "@dle/engine";

/**
 * Espejo del registro que produce `data/build_dataset.py`. Si cambia el script,
 * cambia este tipo.
 *
 * Los valores de taxonomía (`raza`, `estado`, …) se tipan como `string` a
 * propósito: la lista de valores permitidos vive en el JSON generado, bajo
 * `taxonomias`, y `datos.test.ts` la valida en tiempo de ejecución. Repetir esas
 * uniones acá crearía una segunda fuente de verdad que se desincroniza sola.
 */
export interface Personaje extends Entidad {
  id: string;
  nombre: string;
  alias: string[];
  raza: string[];
  genero: string;
  /** Nombre de la saga o película. La comparación ordinal usa `debut_indice`. */
  debut: string;
  debut_indice: number;
  afiliacion_principal: string[];
  universo: string;
  tiene_transformaciones: boolean;
  /** Alimenta el segundo paso del modo Splash-zoom. No es una categoría comparable. */
  transformaciones: string[];
  es_fusion: boolean;
  rol_narrativo: string;
  altura_cm: number;
  /** `estimada` cuando no hay altura oficial publicada (README §5). */
  altura_fuente: "canonica" | "estimada";
  estado: string;
  /** `null` mientras esté pendiente de transcripción manual (doblaje latino). */
  cita: string | null;
  cita_idioma: string | null;
  cita_estado: "pendiente" | "verificada";
  imagen_base: string | null;
  imagen_fuente: string;
  notas: string | null;
}

export interface Taxonomias {
  raza: string[];
  genero: string[];
  afiliacion_principal: string[];
  rol_narrativo: string[];
  estado: string[];
  universo: string[];
  debut: { indice: number; nombre: string }[];
}

/** El archivo completo que escribe `build_dataset.py`. */
export interface DocumentoPersonajes {
  version: string;
  fecha: string;
  taxonomias: Taxonomias;
  personajes: Personaje[];
}
