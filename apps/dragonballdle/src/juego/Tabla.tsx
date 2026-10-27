"use client";

import type { Acierto, Celda, Resultado } from "@dle/engine";
import type { CSSProperties } from "react";
import Miniatura from "./Miniatura";
import type { Columna } from "./tipos";

/**
 * Ritmo del revelado. Tiene que coincidir con `.revelar` en globals.css;
 * `Juego` los usa para no cantar victoria antes de tiempo.
 *
 * La cara del personaje entra primero (retraso 0) y las celdas van detrás, una
 * cada RETRASO_CELDA. Por eso la columna `i` arranca en `(i + 1)`: si arrancara
 * en 0, la primera celda saldría al mismo tiempo que la cara y se perdería el
 * efecto de que la fila se descubre de izquierda a derecha.
 */
export const RETRASO_CELDA = 200;
export const DURACION_REVELADO = 620;

/** Cuánto tarda una fila entera en terminar de revelarse: con 8 columnas, 2,2 s. */
export const duracionFila = (columnas: number) => columnas * RETRASO_CELDA + DURACION_REVELADO;

const FONDO: Record<Acierto, string> = {
  exacto: "bg-acierto",
  parcial: "bg-parcial",
  fallo: "bg-fallo",
};

const FLECHA = { arriba: "▲", abajo: "▼" } as const;

const ETIQUETA_ACIERTO: Record<Acierto, string> = {
  exacto: "correcto",
  parcial: "parcial",
  fallo: "incorrecto",
};

/** El retraso viaja como custom property porque `.destello` deriva el suyo de él. */
const retrasoDe = (ms: number) => ({ "--retraso": `${ms}ms` }) as CSSProperties;

/**
 * Las cabeceras van en caja mixta y sin `tracking`, no en mayúsculas: la más
 * larga es "Transformaciones" y en versales espaciadas no entra en la columna
 * —se partía en "TRANSFORMAC / IONES", porque no hay dónde cortar una palabra
 * sola y el diccionario de guionado del español no está garantizado.
 */
const CABECERA =
  "flex items-center justify-center rounded-lg border-2 border-madera/40 bg-crema/90 px-1 py-1 text-center font-titulo text-[11px] leading-tight font-extrabold text-tinta backdrop-blur-sm";

function Casilla({ celda, retraso }: { celda: Celda; retraso: number }) {
  const flecha = celda.flecha;
  return (
    <div
      style={retrasoDe(retraso)}
      title={`${celda.etiqueta}: ${ETIQUETA_ACIERTO[celda.acierto]}`}
      className={`ficha revelar relative flex min-h-16 flex-col items-center justify-center gap-px rounded-xl border-2 border-black/20 px-1 py-1 text-center font-titulo text-[12px] leading-[1.15] font-extrabold text-white sm:min-h-18 sm:text-[13px] ${FONDO[celda.acierto]} ${celda.acierto === "exacto" ? "destello" : ""}`}
    >
      {celda.valores.map((valor) => (
        <span key={valor}>{valor}</span>
      ))}
      {flecha && (
        <span
          className="text-lg leading-none"
          aria-label={flecha === "arriba" ? "el objetivo es mayor" : "el objetivo es menor"}
        >
          {FLECHA[flecha]}
        </span>
      )}
    </div>
  );
}

export default function Tabla({
  columnas,
  intentos,
  imagenes,
}: {
  columnas: Columna[];
  intentos: Resultado[];
  /** Cara de cada personaje por id. Sale del mismo listado que alimenta al buscador. */
  imagenes: Map<string, string | null>;
}) {
  if (intentos.length === 0) return null;

  // Una columna fija para el personaje + una por categoría. Los anchos los pone
  // `.tablero` en CSS para que el móvil pueda usar columnas más angostas.
  const grilla = {
    gridTemplateColumns: `var(--col-nombre) repeat(${columnas.length}, var(--col-celda))`,
  };

  return (
    <div className="barra-fina tablero w-full overflow-x-auto pb-2">
      <div className="mx-auto w-max space-y-1.5">
        <div className="grid gap-1.5" style={grilla}>
          {/* La columna del personaje también lleva cabecera: es lo que tapa a las
              demás cuando la fila se desplaza por debajo de la columna pegada. */}
          <div className={`${CABECERA} sticky left-0 z-10`}>Personaje</div>
          {columnas.map((columna) => (
            <div key={columna.clave} className={CABECERA}>
              {columna.etiqueta}
            </div>
          ))}
        </div>

        {intentos.map((intento, fila) => {
          // La sacudida es solo del intento que acertó, y solo cuando es el que
          // acaba de llegar: espera a que la fila termine de revelarse, así el
          // golpe cae junto con el cartel de victoria.
          const sacude = fila === 0 && intento.correcto;
          return (
            <div
              key={intento.id}
              className={`grid gap-1.5 ${sacude ? "sacudir" : ""}`}
              style={
                {
                  ...grilla,
                  "--retraso-sacudida": `${duracionFila(columnas.length)}ms`,
                } as CSSProperties
              }
            >
              {/**
               * Pegada a la izquierda: son 9 columnas y en móvil hay scroll
               * horizontal, así que sin esto uno pierde de vista a qué personaje
               * pertenece la fila que está mirando. Opaca a propósito — tiene
               * que tapar lo que pasa por debajo.
               */}
              <div
                style={retrasoDe(0)}
                className={`tarjeta sticky left-0 z-10 flex min-h-16 items-center gap-2 rounded-xl border-2 border-madera bg-crema px-2 py-1 sm:min-h-18 ${fila === 0 ? "entrar" : ""}`}
              >
                <Miniatura
                  nombre={intento.nombre}
                  imagen={imagenes.get(intento.id) ?? null}
                  clases="size-11 rounded-lg text-base sm:size-14"
                />
                <span className="font-titulo text-[13px] leading-tight font-extrabold text-tinta">
                  {intento.nombre}
                </span>
              </div>
              {intento.celdas.map((celda, i) => (
                // Solo se anima la fila recién agregada; las viejas ya están montadas.
                <Casilla
                  key={celda.clave}
                  celda={celda}
                  retraso={fila === 0 ? (i + 1) * RETRASO_CELDA : 0}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
