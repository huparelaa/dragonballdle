import Image from "next/image";
import fondo from "@/images/background.png";
import logo from "@/images/dragonballdle.png";
import Juego from "@/juego/Juego";
import Modos from "@/juego/Modos";
import { columnas, opciones } from "@/juego/reto";

/**
 * Server Component. Solo pasa al cliente la lista de nombres y las cabeceras de
 * las columnas — nada que dependa del objetivo del día, así que la página se
 * prerenderiza estática y no hay que revalidarla al cambiar el reto.
 */
export default function Pagina() {
  // El conteo del roster sale del dataset y no de un número escrito a mano:
  // el roster va a crecer y un "76" quemado en el HTML envejece en silencio.
  const lista = opciones();

  return (
    <>
      {/* El fondo va fijo: al hacer scroll la tabla se desliza sobre el paisaje
          en vez de arrastrarlo. `priority` porque es lo primero que se ve. */}
      <div aria-hidden className="fixed inset-0 z-0">
        <Image
          src={fondo}
          alt=""
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          className="object-cover object-center"
        />
        {/* Velo mínimo. Oscurecerlo más haría legible el texto suelto, pero
            apagaría justo lo que aporta el fondo; el contraste lo dan las
            tarjetas claras y las píldoras oscuras, no el velo. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/5 to-black/45" />
      </div>

      {/* `min-h-dvh` + `mt-auto` en el footer: sin eso el disclaimer queda
          pegado al buscador con media pantalla de paisaje vacío debajo. */}
      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center gap-4 px-3 py-5 sm:py-7">
        <header className="tarjeta isolate w-full max-w-lg overflow-hidden rounded-3xl border-[3px] border-madera bg-crema">
          {/**
           * El PNG del logo viene con **fondo blanco opaco** (RGB sin canal
           * alfa), así que sobre el paisaje se vería como un rectángulo blanco.
           * `mix-blend-multiply` sobre la tarjeta crema lo resuelve sin tocar el
           * archivo: blanco × crema = crema, y los amarillos y el contorno negro
           * quedan intactos. El `isolate` de la tarjeta es lo que impide que el
           * multiply se coma también el fondo ilustrado.
           *
           * Los márgenes negativos recortan el aire del archivo (30 % arriba y
           * 25 % abajo, medido sobre el PNG). Van en % del ancho, que es como
           * los resuelve CSS, y el `overflow-hidden` de la tarjeta los clipea.
           *
           * Si algún día el logo se exporta con transparencia y sin aire, se cae
           * todo esto: queda un `<Image>` suelto.
           */}
          <Image
            src={logo}
            alt="DragonBallDle"
            priority
            sizes="(min-width: 640px) 32rem, 92vw"
            className="mt-[-10%] mb-[-9%] w-full mix-blend-multiply"
          />

          <div className="border-t-2 border-dashed border-madera/40 px-5 pt-3 pb-4 text-center">
            <p className="font-titulo text-lg leading-tight font-extrabold text-tinta sm:text-xl">
              ¡Adivina el personaje de Dragon Ball de hoy!
            </p>
            <p className="mt-1 text-xs text-sepia">
              {lista.length} personajes de Dragon Ball, Z, Super, GT y las películas. Uno nuevo cada
              día.
            </p>
          </div>
        </header>

        <Modos />

        <Juego opciones={lista} columnas={columnas()} />

        <footer className="mt-auto max-w-xl rounded-2xl bg-black/45 px-4 py-2 text-center text-[11px] leading-snug text-white/80 backdrop-blur-sm">
          Proyecto de fans sin fines comerciales. Dragon Ball es propiedad de Toei Animation, Bird
          Studio y Shueisha.
        </footer>
      </main>
    </>
  );
}
