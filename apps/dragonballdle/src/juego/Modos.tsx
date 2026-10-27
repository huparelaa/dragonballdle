import type { ReactNode } from "react";

/**
 * La fila de modos de juego. Hoy **no navega a ninguna parte**: solo el Clásico
 * existe (§1 del README), y los otros tres están bloqueados por las imágenes y
 * las citas que todavía son trabajo manual.
 *
 * Se dibuja igual, apagados y con candado, por dos razones: le dice al jugador
 * que el juego es más grande que la tabla que está viendo, y evita que el día
 * que existan haya que rediseñar la cabecera para hacerles lugar.
 *
 * Son `<span>` y no `<button>` a propósito: un botón que no hace nada es peor
 * que un cartel que dice "pronto".
 */

interface Modo {
  clave: string;
  nombre: string;
  icono: ReactNode;
  activo?: boolean;
}

const MODOS: Modo[] = [
  {
    clave: "clasico",
    nombre: "Clásico",
    activo: true,
    icono: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
        <path d="M3 4h7v7H3zM14 4h7v7h-7zM3 13h7v7H3zM14 13h7v7h-7z" />
      </svg>
    ),
  },
  {
    clave: "silueta",
    nombre: "Silueta",
    icono: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
        <path d="M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c4.4 0 8 2.5 8 5.5V21H4v-2.5C4 15.5 7.6 13 12 13Z" />
      </svg>
    ),
  },
  {
    clave: "frase",
    nombre: "Frase",
    icono: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
        <path d="M10 5.5c-3.6.8-6 3.7-6 7.4V18h6v-6H7.2c.2-1.6 1.3-2.7 2.8-3.1zm10 0c-3.6.8-6 3.7-6 7.4V18h6v-6h-2.8c.2-1.6 1.3-2.7 2.8-3.1z" />
      </svg>
    ),
  },
  {
    clave: "zoom",
    nombre: "Splash-zoom",
    icono: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
        <path d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.3 4.3-1.4 1.4-4.3-4.3A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm.9 2.2v2h2v1.6h-2v2H9.8v-2h-2V9.2h2v-2Z" />
      </svg>
    ),
  },
];

export default function Modos() {
  return (
    <nav aria-label="Modos de juego">
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        {MODOS.map((modo) => (
          <li key={modo.clave}>
            <span
              aria-current={modo.activo ? "page" : undefined}
              title={modo.activo ? "Modo Clásico" : `${modo.nombre} — pronto`}
              className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 font-titulo text-[13px] font-extrabold ${
                modo.activo
                  ? "tarjeta border-madera bg-crema text-tinta"
                  : "border-white/25 bg-black/40 text-white/55 backdrop-blur-sm"
              }`}
            >
              {modo.icono}
              {/* En móvil solo caben los iconos, pero el nombre sigue en el árbol
                  de accesibilidad: `sr-only` esconde, `hidden` borraría. */}
              <span className="sr-only sm:not-sr-only">{modo.nombre}</span>
              {!modo.activo && (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-3.5">
                    <path d="M12 2a4.5 4.5 0 0 1 4.5 4.5V9H18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1h1.5V6.5A4.5 4.5 0 0 1 12 2Zm0 2a2.5 2.5 0 0 0-2.5 2.5V9h5V6.5A2.5 2.5 0 0 0 12 4Z" />
                  </svg>
                  <span className="sr-only">(pronto)</span>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
