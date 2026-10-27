import type { Categoria } from "@dle/engine";
// El JSON se importa desde la raíz del repo, no se copia acá: es la salida de
// data/build_dataset.py y tiene que existir una sola copia.
import documento from "../../../data/personajes.json";
import type { DocumentoPersonajes, Personaje, Taxonomias } from "./personaje";

const doc = documento as unknown as DocumentoPersonajes;

export const version: string = doc.version;
export const taxonomias: Taxonomias = doc.taxonomias;
export const personajes: Personaje[] = doc.personajes;

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Siglas de las series, de la más específica a la más general: "Dragon Ball" va última. */
const SIGLAS: readonly (readonly [string, string])[] = [
  ["Dragon Ball Super", "DBS"],
  ["Dragon Ball Daima", "DBD"],
  ["Dragon Ball GT", "DBGT"],
  ["Dragon Ball Z", "DBZ"],
  ["Dragon Ball", "DB"],
];

/**
 * Etiqueta corta del debut, solo para mostrar.
 *
 * El valor completo llega a 54 caracteres ("Dragon Ball Super – Saga de la
 * Supervivencia Universal"); en una celda de la tabla se envuelve en seis
 * renglones y estira toda la fila, que era la razón principal de que la grilla
 * se sintiera vacía. Se abrevia la serie y se saca el "Saga de…", que no aporta
 * nada: lo que distingue a un debut de otro es lo que viene después.
 *
 * Cambia únicamente el texto visible. El orden lo sigue dando `debut_indice` y
 * la firma de unicidad usa ese índice, no esta cadena.
 */
function debutCorto(debut: string): string {
  const sigla = SIGLAS.find(([largo]) => debut.startsWith(largo));
  if (!sigla) return debut;

  const resto = debut
    .slice(sigla[0].length)
    .replace(/^\s*[–—:-]\s*/, "")
    .replace(/^Saga (?:de las|de los|de la|del|de)\s+/i, "");

  return resto ? `${sigla[1]} · ${resto}` : sigla[1];
}

/**
 * Las columnas del modo Clásico, en el orden en que se muestran.
 *
 * Tiene que coincidir con `COMPARABLES` de `data/build_dataset.py`: esa es la
 * lista sobre la que el validador comprueba la regla de unicidad. Agregar una
 * categoría acá sin agregarla allá deja la unicidad validada de menos; sacarla
 * de acá sin sacarla allá deja la unicidad validada de más, que es peor — el
 * validador daría por únicos a dos personajes que el jugador ve idénticos.
 *
 * `es_fusion` y `rol_narrativo` siguen en el dataset pero ya no son columnas:
 * el jugador no las usaba para razonar y le costaban dos casillas a cada fila.
 */
export const categoriasClasico: Categoria<Personaje>[] = [
  {
    clave: "raza",
    etiqueta: "Raza",
    tipo: "multivalor",
    valor: (p) => p.raza,
  },
  {
    clave: "genero",
    etiqueta: "Género",
    tipo: "exacto",
    valor: (p) => mayuscula(p.genero),
  },
  {
    clave: "debut",
    etiqueta: "Debut",
    tipo: "ordinal",
    valor: (p) => debutCorto(p.debut),
    orden: (p) => p.debut_indice,
  },
  {
    clave: "afiliacion_principal",
    etiqueta: "Afiliación",
    tipo: "multivalor",
    valor: (p) => p.afiliacion_principal,
  },
  {
    clave: "universo",
    etiqueta: "Universo",
    tipo: "exacto",
    valor: (p) => p.universo,
  },
  {
    clave: "tiene_transformaciones",
    etiqueta: "Transformaciones",
    tipo: "booleano",
    valor: (p) => (p.tiene_transformaciones ? "Sí" : "No"),
  },
  {
    clave: "altura_cm",
    etiqueta: "Altura",
    tipo: "ordinal",
    valor: (p) => `${p.altura_cm} cm`,
    orden: (p) => p.altura_cm,
  },
  {
    clave: "estado",
    etiqueta: "Estado",
    tipo: "exacto",
    valor: (p) => mayuscula(p.estado),
  },
];

export type { DocumentoPersonajes, Personaje, Taxonomias } from "./personaje";
