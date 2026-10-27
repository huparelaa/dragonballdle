import type { Personaje } from "@dle/dragonballdle-data";

/**
 * Reglas de confianza del dataset, para el panel del creador.
 *
 * No es lógica de juego: es la respuesta a "¿qué de esto está verificado y qué
 * lo puse a ojo?". Cada regla cita de dónde sale, para que se pueda discutir.
 */

export type Severidad = "bloqueante" | "revisar" | "info";

export interface Aviso {
  clave: string;
  severidad: Severidad;
  texto: string;
}

export const COLOR_SEVERIDAD: Record<Severidad, string> = {
  bloqueante: "border-fallo/60 bg-fallo/15 text-red-200",
  revisar: "border-parcial/60 bg-parcial/15 text-amber-200",
  info: "border-borde bg-white/5 text-tenue",
};

/** `data/debut-orden.md` §5: sagas asignadas por criterio, no por fuente. */
const SAGA_POR_CRITERIO: Record<string, string> = {
  bardock:
    "Aparece en flashback dentro de la saga, pero su debut real como personaje es el especial de 1990.",
  "rey-cold":
    "Llega con Mecha-Freezer, justo en la frontera entre el final de Freezer y el arranque de los Androides.",
  "mr-satan": "Debuta en los Juegos de Cell, no en el arco de Buu donde tiene más peso.",
  launch:
    "Aparece durante el entrenamiento en Kame House; según dónde se corte el arco podría caer en el siguiente.",
  zeno: "Aparece al final del torneo entre U6 y U7, no en el Torneo del Poder.",
};

/** README §7: casos donde la API estaba mal y se corrigió contra Dragon Ball Wiki. */
const CORREGIDO_CONTRA_WIKI: Record<string, string> = {
  zarbon: "La API lo marca como «Frieza Race». Verificado: no lo es.",
  dodoria: "La API lo marca como «Frieza Race». Verificado: no lo es.",
  toppo: "La API lo marca como deidad. Su candidatura a Dios de la Destrucción es posterior.",
  bulma: "La API lo marca como «Z Fighter».",
  nail: "La API lo marca como «Z Fighter».",
};

/** README §5: patrón de DeviantArt. Esas imágenes no se pueden usar. */
const PATRON_DEVIANTART = /by_/i;
/** Un aura alrededor del personaje convierte la silueta en una mancha. */
const PATRON_AURA = /aura/i;

export function auditar(p: Personaje): Aviso[] {
  const avisos: Aviso[] = [];

  // ---- Imagen: alimenta Silueta y Splash-zoom, es lo más bloqueante ----
  if (!p.imagen_base) {
    avisos.push({
      clave: "sin-imagen",
      severidad: "bloqueante",
      texto: "Sin imagen base. Bloquea los modos Silueta y Splash-zoom.",
    });
  } else {
    if (PATRON_DEVIANTART.test(p.imagen_base)) {
      avisos.push({
        clave: "imagen-deviantart",
        severidad: "bloqueante",
        texto: "URL con patrón «by_»: es obra de un artista de DeviantArt. Hay que reemplazarla (README §5).",
      });
    }
    if (PATRON_AURA.test(p.imagen_base)) {
      avisos.push({
        clave: "imagen-aura",
        severidad: "revisar",
        texto: "El nombre del archivo sugiere aura o efectos: arruinaría la silueta.",
      });
    }
  }

  // ---- Cita: bloquea el modo Frase ----
  if (p.cita_estado !== "verificada" || !p.cita) {
    avisos.push({
      clave: "sin-cita",
      severidad: "bloqueante",
      texto: "Sin cita verificada del doblaje latino. Bloquea el modo Frase.",
    });
  }

  // ---- Datos que pueden estar mal ----
  if (p.altura_fuente === "estimada") {
    avisos.push({
      clave: "altura-estimada",
      severidad: "revisar",
      texto: "Altura estimada, no oficial. Solo ~50 personajes tienen altura publicada.",
    });
  }

  const saga = SAGA_POR_CRITERIO[p.id];
  if (saga) {
    avisos.push({ clave: "saga-criterio", severidad: "revisar", texto: `Saga asignada por criterio. ${saga}` });
  }

  if (p.raza.includes("Otra especie")) {
    avisos.push({
      clave: "raza-consolidada",
      severidad: "info",
      texto: "Su especie canónica tiene un solo portador en el roster, así que va al balde consolidado.",
    });
  }

  const wiki = CORREGIDO_CONTRA_WIKI[p.id];
  if (wiki) {
    avisos.push({ clave: "verificado-wiki", severidad: "info", texto: `Cotejado contra Dragon Ball Wiki. ${wiki}` });
  }

  if (p.notas) {
    avisos.push({ clave: "nota", severidad: "info", texto: p.notas });
  }

  if (p.transformaciones.length > 0) {
    avisos.push({
      clave: "formas-sin-imagen",
      severidad: "info",
      texto: `${p.transformaciones.length} formas listadas para Splash-zoom, ninguna con imagen todavía.`,
    });
  }

  return avisos;
}

export const peorSeveridad = (avisos: Aviso[]): Severidad =>
  avisos.some((a) => a.severidad === "bloqueante")
    ? "bloqueante"
    : avisos.some((a) => a.severidad === "revisar")
      ? "revisar"
      : "info";

/** Los filtros del panel, con su etiqueta y la condición que aplican. */
export const FILTROS = [
  { clave: "sin-imagen", etiqueta: "Sin imagen" },
  { clave: "imagen-deviantart", etiqueta: "Imagen de DeviantArt" },
  { clave: "imagen-aura", etiqueta: "Imagen con aura" },
  { clave: "sin-cita", etiqueta: "Sin cita" },
  { clave: "altura-estimada", etiqueta: "Altura estimada" },
  { clave: "saga-criterio", etiqueta: "Saga por criterio" },
  { clave: "raza-consolidada", etiqueta: "Raza consolidada" },
  { clave: "verificado-wiki", etiqueta: "Corregido vs. Wiki" },
  { clave: "nota", etiqueta: "Con nota del curador" },
] as const;
