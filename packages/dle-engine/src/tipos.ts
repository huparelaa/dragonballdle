/**
 * Contratos del motor.
 *
 * Nada de este archivo conoce ninguna franquicia. Un juego se conecta
 * declarando sus propias categorías sobre su propio tipo de entidad: el motor
 * nunca lee un campo por nombre, siempre a través del accessor `valor` que la
 * categoría trae. Por eso el mismo motor sirve para cualquier "-dle" sin que
 * haya que tocarle una línea.
 */

/** Lo mínimo que el motor necesita saber de una entidad jugable. */
export interface Entidad {
  readonly id: string;
  readonly nombre: string;
  /** Nombres alternativos que el autocompletado también acepta. */
  readonly alias?: readonly string[];
}

export type TipoCategoria = "exacto" | "multivalor" | "ordinal" | "booleano";

interface Base {
  /** Identificador estable de la columna. */
  readonly clave: string;
  /** Texto de la cabecera. */
  readonly etiqueta: string;
}

/** Verde si coincide, rojo si no. Ej: el país de origen. */
export interface CategoriaExacta<E> extends Base {
  readonly tipo: "exacto";
  readonly valor: (e: E) => string;
}

/**
 * Se compara igual que `exacto`: el tipo existe solo para que la UI la dibuje
 * como sí/no en vez de como texto. El accessor devuelve el texto ya listo
 * ("Sí"/"No", "Yes"/"No", …) para que el motor no cargue con un idioma.
 */
export interface CategoriaBooleana<E> extends Base {
  readonly tipo: "booleano";
  readonly valor: (e: E) => string;
}

/**
 * Verde si los dos conjuntos son iguales, amarillo si comparten al menos un
 * valor, rojo si no comparten ninguno. Ej: los idiomas que habla alguien.
 */
export interface CategoriaMultivalor<E> extends Base {
  readonly tipo: "multivalor";
  readonly valor: (e: E) => readonly string[];
}

/**
 * Verde si coincide; si no, flecha indicando hacia dónde queda el objetivo.
 * `valor` es lo que se muestra y `orden` lo que se compara, que no siempre son
 * lo mismo: una entrega de una saga se muestra por su título pero se ordena por
 * el número que le toca en la cronología.
 */
export interface CategoriaOrdinal<E> extends Base {
  readonly tipo: "ordinal";
  readonly valor: (e: E) => string;
  readonly orden: (e: E) => number;
}

export type Categoria<E> =
  | CategoriaExacta<E>
  | CategoriaBooleana<E>
  | CategoriaMultivalor<E>
  | CategoriaOrdinal<E>;

export type Acierto = "exacto" | "parcial" | "fallo";

/** Hacia dónde está el objetivo respecto del intento. */
export type Flecha = "arriba" | "abajo";

export interface Celda {
  readonly clave: string;
  readonly etiqueta: string;
  readonly tipo: TipoCategoria;
  /**
   * Valores *del intento*, listos para mostrar. Un solo elemento salvo en
   * multivalor. Nunca lleva valores del objetivo: eso revelaría la respuesta.
   */
  readonly valores: string[];
  readonly acierto: Acierto;
  /** Solo en ordinales que no coinciden. */
  readonly flecha?: Flecha;
}

/** Una fila de la tabla: el resultado de comparar un intento con el objetivo. */
export interface Resultado {
  readonly id: string;
  readonly nombre: string;
  readonly correcto: boolean;
  readonly celdas: Celda[];
}
