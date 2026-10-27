import { personajes, taxonomias, version } from "@dle/dragonballdle-data";
import Panel from "./Panel";

/**
 * Panel del creador: el dataset entero a la vista, con las señales de qué está
 * verificado y qué no.
 *
 * **Solo existe en desarrollo.** Publicar los 76 personajes con todos sus
 * atributos rompería el juego: con la tabla completa en la mano, un intento
 * basta para deducir el objetivo del día por eliminación.
 *
 * La extensión `.dev.tsx` es lo que lo garantiza — `next.config.ts` solo la
 * declara como página cuando corre `next dev`, así que en producción esta ruta
 * no existe y ni el panel ni sus textos entran en el bundle.
 */
export default function PaginaPanel() {
  return <Panel personajes={personajes} taxonomias={taxonomias} version={version} />;
}
