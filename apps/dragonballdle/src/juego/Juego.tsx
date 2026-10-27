"use client";

import type { Resultado } from "@dle/engine";
import { useEffect, useMemo, useRef, useState } from "react";
import Buscador from "./Buscador";
import Miniatura from "./Miniatura";
import Tabla, { duracionFila } from "./Tabla";
import type { Columna, OpcionPersonaje, RespuestaIntento } from "./tipos";

/**
 * Estado de la partida. El cliente no sabe cuál es el objetivo: manda el id del
 * intento a `/api/intento` y solo recibe de vuelta la fila ya comparada.
 */
export default function Juego({
  opciones,
  columnas,
}: {
  opciones: OpcionPersonaje[];
  columnas: Columna[];
}) {
  const [intentos, setIntentos] = useState<Resultado[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [revelando, setRevelando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const yaIntentados = useMemo(() => new Set(intentos.map((i) => i.id)), [intentos]);
  // La cara de cada personaje ya viaja en `opciones`; la tabla la busca por id en
  // vez de que el servidor la repita en cada resultado.
  const imagenes = useMemo(() => new Map(opciones.map((o) => [o.id, o.imagen])), [opciones]);
  const acertado = intentos.find((i) => i.correcto);

  useEffect(() => () => clearTimeout(temporizador.current ?? undefined), []);

  async function intentar(id: string) {
    if (acertado || enviando || yaIntentados.has(id)) return;

    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/intento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!respuesta.ok) throw new Error("El servidor rechazó el intento.");

      const datos = (await respuesta.json()) as RespuestaIntento;
      setIntentos((previos) => [datos.resultado, ...previos]);

      // La fila tarda en revelarse; hasta que no termina no se canta nada.
      setRevelando(true);
      clearTimeout(temporizador.current ?? undefined);
      temporizador.current = setTimeout(() => setRevelando(false), esperaRevelado(columnas.length));
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="flex w-full flex-col items-center gap-3">
      {acertado && !revelando ? (
        <Victoria
          nombre={acertado.nombre}
          imagen={imagenes.get(acertado.id) ?? null}
          intentos={intentos.length}
        />
      ) : (
        <Buscador
          opciones={opciones}
          yaIntentados={yaIntentados}
          ocupado={enviando}
          onElegir={intentar}
        />
      )}

      {error && (
        <p className="rounded-xl border-2 border-fallo bg-fallo/90 px-4 py-2 text-center text-sm font-bold text-white">
          {error}
        </p>
      )}

      {intentos.length > 0 && (
        <p className="rounded-full bg-black/45 px-3 py-1 font-titulo text-xs font-bold text-white/90 backdrop-blur-sm">
          {intentos.length} {intentos.length === 1 ? "intento" : "intentos"}
        </p>
      )}

      <Tabla columnas={columnas} intentos={intentos} imagenes={imagenes} />

      {/* La leyenda se muestra desde el arranque, no recién con el primer
          intento: antes de jugar explica qué van a significar los colores, y de
          paso la pantalla vacía deja de ser el buscador flotando solo. */}
      <Leyenda />
    </section>
  );
}

/**
 * El cartel de victoria. Ocupa el lugar del buscador —no se apila debajo— para
 * que quede claro que la partida terminó, y trae la cara del personaje porque
 * es lo que uno quiere ver cuando acierta.
 *
 * Aparece recién cuando la fila terminó de revelarse (ver `revelando`): si
 * saliera antes, cantaría el resultado mientras las celdas todavía están de
 * canto y arruinaría el revelado.
 */
function Victoria({
  nombre,
  imagen,
  intentos,
}: {
  nombre: string;
  imagen: string | null;
  intentos: number;
}) {
  return (
    // `w-full max-w-md` y no solo `max-w-md`: en un teléfono de 390 px el ancho
    // máximo (28rem) es más grande que la pantalla y la tarjeta se desbordaba.
    <div className="cartel-victoria flex w-full max-w-md items-center gap-4 rounded-2xl border-[3px] border-acierto bg-crema px-5 py-3">
      <Miniatura nombre={nombre} imagen={imagen} clases="size-16 rounded-xl text-xl" />
      <div className="text-left">
        <p className="font-titulo text-2xl leading-none font-extrabold text-acierto">¡Correcto!</p>
        <p className="mt-1 text-sm text-tinta">
          Era <strong className="font-titulo font-extrabold">{nombre}</strong>, y lo sacaste en{" "}
          {intentos} {intentos === 1 ? "intento" : "intentos"}.
        </p>
        <p className="text-xs text-sepia">Vuelve mañana por uno nuevo.</p>
      </div>
    </div>
  );
}

/**
 * Cuánto esperar antes de cantar el resultado: lo que dura el revelado, o nada
 * si el jugador pidió menos movimiento (ahí las celdas aparecen de una).
 */
function esperaRevelado(columnas: number): number {
  const sinMovimiento =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return sinMovimiento ? 0 : duracionFila(columnas);
}

function Leyenda() {
  const items = [
    ["bg-acierto", "Coincide"],
    ["bg-parcial", "Coincide en parte"],
    ["bg-fallo", "No coincide"],
  ] as const;

  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl bg-black/45 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm">
      {items.map(([color, texto]) => (
        <li key={texto} className="flex items-center gap-1.5">
          <span className={`ficha inline-block size-3.5 rounded-sm ${color}`} />
          {texto}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span aria-hidden>▲▼</span> El objetivo está por encima o por debajo
      </li>
    </ul>
  );
}
