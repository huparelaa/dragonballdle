"use client";

import { buscar } from "@dle/engine";
import { useEffect, useMemo, useRef, useState } from "react";
import Miniatura from "./Miniatura";
import type { OpcionPersonaje } from "./tipos";

/**
 * Autocompletado. Corre en el cliente sobre la lista de nombres —por eso el
 * motor está en TypeScript: la misma función `buscar` que valida en el servidor
 * sirve acá sin duplicar lógica.
 *
 * El input **nunca se deshabilita**, ni siquiera mientras se envía un intento:
 * el navegador quita el foco de un campo deshabilitado y no lo devuelve, así
 * que el jugador tendría que hacer clic de nuevo entre intento e intento.
 */
export default function Buscador({
  opciones,
  yaIntentados,
  ocupado,
  onElegir,
}: {
  opciones: OpcionPersonaje[];
  yaIntentados: Set<string>;
  ocupado: boolean;
  onElegir: (id: string) => void;
}) {
  const [texto, setTexto] = useState("");
  const [resaltado, setResaltado] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);

  // Listo para escribir apenas carga la página.
  useEffect(() => {
    entrada.current?.focus();
  }, []);

  const sugerencias = useMemo(
    () => buscar(opciones, texto).filter((o) => !yaIntentados.has(o.id)),
    [opciones, texto, yaIntentados],
  );

  function elegir(opcion: OpcionPersonaje | undefined) {
    if (!opcion) return;
    onElegir(opcion.id);
    setTexto("");
    setResaltado(0);
    entrada.current?.focus();
  }

  function alTeclear(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Escape") return setTexto("");
    if (sugerencias.length === 0) return;

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setResaltado((i) => (i + 1) % sugerencias.length);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setResaltado((i) => (i - 1 + sugerencias.length) % sugerencias.length);
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      elegir(sugerencias[resaltado]);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <input
        ref={entrada}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setResaltado(0);
        }}
        onKeyDown={alTeclear}
        placeholder="Escribe un personaje…"
        aria-label="Buscar personaje"
        autoComplete="off"
        className="tarjeta w-full rounded-2xl border-[3px] border-madera bg-crema px-5 py-3.5 pr-11 font-titulo text-lg font-bold text-tinta outline-none placeholder:font-semibold placeholder:text-sepia/70 focus:border-acento"
      />

      <span aria-hidden className="absolute top-1/2 right-4 -translate-y-1/2">
        {ocupado ? (
          <span className="block size-3 animate-pulse rounded-full bg-acento" />
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 text-sepia/60">
            <path d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.3 4.3-1.4 1.4-4.3-4.3A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
          </svg>
        )}
      </span>

      {sugerencias.length > 0 && (
        <ul className="tarjeta absolute z-30 mt-1.5 max-h-80 w-full overflow-y-auto rounded-2xl border-[3px] border-madera bg-crema py-1.5">
          {sugerencias.map((opcion, i) => (
            <li key={opcion.id}>
              <button
                type="button"
                // Evita que el input pierda el foco antes de registrar el clic.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(opcion)}
                onMouseEnter={() => setResaltado(i)}
                className={`flex w-full items-center gap-3 px-3 py-1.5 text-left font-titulo text-[15px] font-bold ${
                  i === resaltado ? "bg-acento text-white" : "text-tinta hover:bg-crema-hondo"
                }`}
              >
                <Miniatura
                  nombre={opcion.nombre}
                  imagen={opcion.imagen}
                  clases="size-10 rounded-full text-sm"
                />
                {opcion.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
