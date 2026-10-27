import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(fase: string): NextConfig {
  const enDesarrollo = fase === PHASE_DEVELOPMENT_SERVER;

  return {
    // Los paquetes del monorepo se publican como TypeScript sin compilar
    // (`main` apunta a `src/index.ts`), así que los transpila Next.
    transpilePackages: ["@dle/engine", "@dle/dragonballdle-data"],

    /**
     * `page.dev.tsx` solo cuenta como página en desarrollo. Así el panel del
     * creador ni siquiera se compila en producción.
     *
     * Un `if (NODE_ENV === "production") notFound()` dentro del componente no
     * alcanza: la ruta devuelve 404, pero el código del panel igual queda
     * empaquetado en un chunk de cliente que cualquiera puede descargar.
     */
    pageExtensions: enDesarrollo ? ["tsx", "ts", "dev.tsx"] : ["tsx", "ts"],
  };
}
