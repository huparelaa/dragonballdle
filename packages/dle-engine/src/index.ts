export type {
  Acierto,
  Categoria,
  CategoriaBooleana,
  CategoriaExacta,
  CategoriaMultivalor,
  CategoriaOrdinal,
  Celda,
  Entidad,
  Flecha,
  Resultado,
  TipoCategoria,
} from "./tipos";

export { comparar, compararCategoria } from "./comparar";
export { barajar, diasEntre, fechaEnZona, objetivoDelDia } from "./objetivo";
export type { OpcionesObjetivo } from "./objetivo";
export { buscar, normalizar } from "./buscar";
export { colisiones, firma, nombresAmbiguos } from "./validar";
export type { Colision, NombreAmbiguo } from "./validar";
