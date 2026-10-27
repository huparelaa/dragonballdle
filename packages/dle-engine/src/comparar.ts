import type { Acierto, Categoria, Celda, Entidad, Resultado } from "./tipos";

/** Compara una sola categoría entre el intento y el objetivo. */
export function compararCategoria<E>(
  categoria: Categoria<E>,
  intento: E,
  objetivo: E,
): Celda {
  const { clave, etiqueta, tipo } = categoria;

  switch (categoria.tipo) {
    case "exacto":
    case "booleano": {
      const a = categoria.valor(intento);
      const b = categoria.valor(objetivo);
      return { clave, etiqueta, tipo, valores: [a], acierto: a === b ? "exacto" : "fallo" };
    }

    case "multivalor": {
      const a = new Set(categoria.valor(intento));
      const b = new Set(categoria.valor(objetivo));
      let comunes = 0;
      for (const v of a) if (b.has(v)) comunes++;
      const acierto: Acierto =
        comunes === 0 ? "fallo" : comunes === a.size && comunes === b.size ? "exacto" : "parcial";
      return { clave, etiqueta, tipo, valores: [...a], acierto };
    }

    case "ordinal": {
      const a = categoria.orden(intento);
      const b = categoria.orden(objetivo);
      const valores = [categoria.valor(intento)];
      if (a === b) return { clave, etiqueta, tipo, valores, acierto: "exacto" };
      return { clave, etiqueta, tipo, valores, acierto: "fallo", flecha: b > a ? "arriba" : "abajo" };
    }
  }
}

/**
 * Un intento contra el objetivo del día: una celda por categoría, en el orden
 * en que vienen las categorías.
 */
export function comparar<E extends Entidad>(
  intento: E,
  objetivo: E,
  categorias: readonly Categoria<E>[],
): Resultado {
  return {
    id: intento.id,
    nombre: intento.nombre,
    correcto: intento.id === objetivo.id,
    celdas: categorias.map((c) => compararCategoria(c, intento, objetivo)),
  };
}
