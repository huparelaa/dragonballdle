import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

/**
 * Las dos fuentes del juego. `variable` las expone como custom property y
 * `globals.css` las mapea a `--font-titulo` / `--font-cuerpo`, así el resto del
 * código usa `font-titulo` sin saber qué familia es.
 *
 * `latin-ext` no es opcional: sin ese subset las tildes y la ñ caen al fallback
 * y se ve la mezcla de dos fuentes dentro de la misma palabra.
 */
const titulo = Baloo_2({
  subsets: ["latin", "latin-ext"],
  variable: "--fuente-titulo",
  display: "swap",
});

const cuerpo = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--fuente-cuerpo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DragonBallDle — adivina el personaje del día",
  description:
    "Juego diario de Dragon Ball: adivina el personaje oculto comparando raza, debut, afiliación y más. Uno nuevo cada día.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body
        className={`${titulo.variable} ${cuerpo.variable} min-h-dvh bg-fondo font-cuerpo text-texto antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
