import type { Resultado, TipoCategoria } from "@dle/engine";

/**
 * Lo que cruza del servidor al cliente. Todo lo que esté acá es público: el
 * objetivo del día no puede aparecer en ninguno de estos tipos.
 */

/**
 * Lo único que el cliente necesita de cada personaje: alimentar el
 * autocompletado. Ni un atributo comparable.
 *
 * `imagen` es la miniatura del desplegable. No revela nada: el jugador ya tiene
 * los 76 nombres, y saber qué cara tiene cada uno no acerca al objetivo del día.
 * `null` en los 34 que todavía no tienen imagen.
 */
export interface OpcionPersonaje {
  id: string;
  nombre: string;
  alias: string[];
  imagen: string | null;
}

/** La cabecera de una columna. Lleva el nombre de la categoría, nunca sus valores. */
export interface Columna {
  clave: string;
  etiqueta: string;
  tipo: TipoCategoria;
}

/** Respuesta de `POST /api/intento`. */
export interface RespuestaIntento {
  /** Fecha del reto (`YYYY-MM-DD`), para poder invalidar la partida guardada al cambiar el día. */
  fecha: string;
  resultado: Resultado;
}
