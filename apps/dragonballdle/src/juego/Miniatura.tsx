"use client";

import { useState } from "react";

/**
 * La cara de un personaje, con la inicial como respaldo.
 *
 * `<img>` y no `next/image`: son URLs remotas de una API que todavía va a
 * cambiar (las imágenes terminan en `data/img/`), y varias pueden estar caídas.
 * Con `<img>` una URL rota cae en la inicial del nombre en vez de romper.
 *
 * La usan el autocompletado y la tabla de intentos. `clases` trae **solo** el
 * tamaño y la forma; el marco y el fondo los pone el componente, porque si los
 * pasara cada quien en `clases` dos utilidades de borde se pisarían según el
 * orden en que Tailwind las emitió, no según el orden del string.
 */
export default function Miniatura({
  nombre,
  imagen,
  clases,
}: {
  nombre: string;
  imagen: string | null;
  clases: string;
}) {
  const [falla, setFalla] = useState(false);

  const marco = "shrink-0 border-2 border-madera/50 bg-crema-hondo";

  if (!imagen || falla) {
    return (
      <span
        aria-hidden
        className={`${marco} flex items-center justify-center font-titulo font-extrabold text-sepia ${clases}`}
      >
        {nombre.charAt(0)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imagen}
      alt=""
      loading="lazy"
      onError={() => setFalla(true)}
      // `object-top` porque son renders de cuerpo completo: en miniatura la cara
      // es lo único que se reconoce.
      className={`${marco} object-cover object-top ${clases}`}
    />
  );
}
