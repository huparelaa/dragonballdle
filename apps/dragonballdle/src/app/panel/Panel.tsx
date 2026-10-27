"use client";

import type { Personaje, Taxonomias } from "@dle/dragonballdle-data";
import { normalizar } from "@dle/engine";
import { useMemo, useState } from "react";
import { auditar, COLOR_SEVERIDAD, FILTROS, peorSeveridad, type Aviso } from "./auditoria";

type Vista = "galeria" | "tabla";
type Orden = "nombre" | "debut" | "altura" | "avisos";

export default function Panel({
  personajes,
  taxonomias,
  version,
}: {
  personajes: Personaje[];
  taxonomias: Taxonomias;
  version: string;
}) {
  const [consulta, setConsulta] = useState("");
  const [filtros, setFiltros] = useState<Set<string>>(new Set());
  const [vista, setVista] = useState<Vista>("galeria");
  const [orden, setOrden] = useState<Orden>("nombre");
  const [rotas, setRotas] = useState<Set<string>>(new Set());
  const [abierto, setAbierto] = useState<string | null>(null);

  // La auditoría es pura y el dataset no cambia: se calcula una sola vez.
  const auditados = useMemo(
    () => personajes.map((p) => ({ personaje: p, avisos: auditar(p) })),
    [personajes],
  );

  const visibles = useMemo(() => {
    const q = normalizar(consulta);
    const filtrados = auditados.filter(({ personaje, avisos }) => {
      if (q) {
        const texto = normalizar([personaje.nombre, personaje.id, ...personaje.alias].join(" "));
        if (!texto.includes(q)) return false;
      }
      // Los filtros se acumulan: tienen que cumplirse todos.
      return [...filtros].every((f) => avisos.some((a) => a.clave === f));
    });

    const comparar: Record<Orden, (a: typeof filtrados[number], b: typeof filtrados[number]) => number> = {
      nombre: (a, b) => a.personaje.nombre.localeCompare(b.personaje.nombre, "es"),
      debut: (a, b) => a.personaje.debut_indice - b.personaje.debut_indice,
      altura: (a, b) => b.personaje.altura_cm - a.personaje.altura_cm,
      avisos: (a, b) => cuenta(b.avisos) - cuenta(a.avisos),
    };
    return [...filtrados].sort(comparar[orden]);
  }, [auditados, consulta, filtros, orden]);

  const sinImagen = personajes.filter((p) => !p.imagen_base);
  const conImagen = personajes.length - sinImagen.length;
  const sinCita = personajes.filter((p) => p.cita_estado !== "verificada");
  const estimadas = personajes.filter((p) => p.altura_fuente === "estimada");
  const formas = personajes.reduce((n, p) => n + p.transformaciones.length, 0);

  function alternar(clave: string) {
    setFiltros((previos) => {
      const siguiente = new Set(previos);
      if (siguiente.has(clave)) siguiente.delete(clave);
      else siguiente.add(clave);
      return siguiente;
    });
  }

  return (
    <div className="mx-auto max-w-[1700px] px-5 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">
            Panel del creador <span className="text-acento">·</span>{" "}
            <span className="text-tenue">dataset v{version}</span>
          </h1>
          <p className="mt-1 text-sm text-tenue">
            Los {personajes.length} personajes con todos sus campos y de dónde salió cada dato.
          </p>
        </div>
        <p className="rounded-md border border-parcial/50 bg-parcial/10 px-3 py-1.5 text-xs text-amber-200">
          Solo en desarrollo. En producción esta ruta es 404: el dataset completo revelaría el reto
          del día.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Estadistica valor={personajes.length} total={personajes.length} texto="personajes" tono="neutro" />
        <Estadistica valor={conImagen} total={personajes.length} texto="con imagen base" tono={conImagen === personajes.length ? "bien" : "mal"} />
        <Estadistica valor={rotas.size} total={conImagen} texto="URLs rotas" tono={rotas.size === 0 ? "bien" : "mal"} />
        <Estadistica valor={personajes.length - sinCita.length} total={personajes.length} texto="citas verificadas" tono={sinCita.length ? "mal" : "bien"} />
        <Estadistica valor={personajes.length - estimadas.length} total={personajes.length} texto="alturas canónicas" tono="medio" />
        <Estadistica valor={0} total={formas} texto="formas con imagen" tono="mal" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Buscar por nombre, id o alias…"
          className="min-w-56 flex-1 rounded-lg border border-borde bg-panel px-3 py-2 text-sm outline-none placeholder:text-tenue focus:border-acento"
        />
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as Orden)}
          className="rounded-lg border border-borde bg-panel px-3 py-2 text-sm outline-none"
        >
          <option value="nombre">Orden: nombre</option>
          <option value="debut">Orden: debut</option>
          <option value="altura">Orden: altura</option>
          <option value="avisos">Orden: más problemas primero</option>
        </select>
        <div className="flex rounded-lg border border-borde bg-panel p-0.5 text-sm">
          {(["galeria", "tabla"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVista(v)}
              className={`rounded-md px-3 py-1.5 capitalize ${vista === v ? "bg-acento/20 text-acento" : "text-tenue"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const n = auditados.filter(({ avisos }) => avisos.some((a) => a.clave === f.clave)).length;
          const activo = filtros.has(f.clave);
          return (
            <button
              key={f.clave}
              type="button"
              onClick={() => alternar(f.clave)}
              disabled={n === 0}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                activo
                  ? "border-acento bg-acento/20 text-acento"
                  : "border-borde bg-panel text-tenue hover:border-tenue disabled:opacity-35"
              }`}
            >
              {f.etiqueta} <span className="opacity-70">{n}</span>
            </button>
          );
        })}
        {filtros.size > 0 && (
          <button type="button" onClick={() => setFiltros(new Set())} className="text-xs text-acento underline">
            limpiar
          </button>
        )}
      </div>

      <p className="mb-3 text-xs text-tenue">
        Mostrando {visibles.length} de {personajes.length}
      </p>

      {vista === "galeria" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
          {visibles.map(({ personaje, avisos }) => (
            <Ficha
              key={personaje.id}
              personaje={personaje}
              avisos={avisos}
              abierto={abierto === personaje.id}
              onAbrir={() => setAbierto(abierto === personaje.id ? null : personaje.id)}
              onImagenRota={marcarRota(setRotas)}
            />
          ))}
        </div>
      ) : (
        <Tabla visibles={visibles} />
      )}

      <Pendientes sinImagen={sinImagen} sinCita={sinCita} taxonomias={taxonomias} />
    </div>
  );
}

const cuenta = (avisos: Aviso[]) =>
  avisos.filter((a) => a.severidad === "bloqueante").length * 10 +
  avisos.filter((a) => a.severidad === "revisar").length;

const marcarRota = (set: (f: (s: Set<string>) => Set<string>) => void) => (id: string) =>
  set((previas) => (previas.has(id) ? previas : new Set(previas).add(id)));

/* ------------------------------------------------------------------ piezas */

function Estadistica({
  valor,
  total,
  texto,
  tono,
}: {
  valor: number;
  total: number;
  texto: string;
  tono: "bien" | "medio" | "mal" | "neutro";
}) {
  const color = { bien: "text-acierto", medio: "text-parcial", mal: "text-fallo", neutro: "text-texto" }[tono];
  return (
    <div className="rounded-lg border border-borde bg-panel px-4 py-3">
      <p className={`text-2xl font-black ${color}`}>
        {valor}
        <span className="text-sm font-normal text-tenue"> / {total}</span>
      </p>
      <p className="text-xs text-tenue">{texto}</p>
    </div>
  );
}

function Miniatura({ personaje, onRota }: { personaje: Personaje; onRota: (id: string) => void }) {
  const [rota, setRota] = useState(false);

  if (!personaje.imagen_base || rota) {
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-fallo/50 bg-fallo/10 px-2 text-center">
        <span className="text-xl">✕</span>
        <span className="text-[11px] font-bold text-red-200">
          {rota ? "URL rota" : "Falta imagen"}
        </span>
        <code className="break-all text-[9px] leading-tight text-tenue">
          data/img/base/{personaje.id}.webp
        </code>
      </div>
    );
  }

  return (
    // <img> a propósito y no next/image: es una herramienta de desarrollo y no
    // vale la pena configurar remotePatterns ni optimizar 42 imágenes remotas.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={personaje.imagen_base}
      alt={personaje.nombre}
      loading="lazy"
      onError={() => {
        setRota(true);
        onRota(personaje.id);
      }}
      className="h-44 w-full rounded-md bg-black/40 object-contain"
    />
  );
}

function Ficha({
  personaje,
  avisos,
  abierto,
  onAbrir,
  onImagenRota,
}: {
  personaje: Personaje;
  avisos: Aviso[];
  abierto: boolean;
  onAbrir: () => void;
  onImagenRota: (id: string) => void;
}) {
  const peor = peorSeveridad(avisos);
  const borde = { bloqueante: "border-fallo/40", revisar: "border-parcial/40", info: "border-borde" }[peor];

  return (
    <article className={`flex flex-col gap-2 rounded-lg border bg-panel p-3 ${borde}`}>
      <Miniatura personaje={personaje} onRota={onImagenRota} />

      <div>
        <h2 className="text-sm font-bold leading-tight">{personaje.nombre}</h2>
        <code className="text-[10px] text-tenue">{personaje.id}</code>
      </div>

      <dl className="flex flex-col gap-1 text-[11px]">
        <Campo etiqueta="Raza" valor={personaje.raza.join(" + ")} />
        <Campo etiqueta="Debut" valor={`#${personaje.debut_indice} ${personaje.debut}`} />
        <Campo etiqueta="Afiliación" valor={personaje.afiliacion_principal.join(" + ")} />
        <Campo
          etiqueta="Altura"
          valor={`${personaje.altura_cm} cm`}
          sufijo={personaje.altura_fuente === "canonica" ? "canónica" : "estimada"}
          dudoso={personaje.altura_fuente === "estimada"}
        />
        <Campo etiqueta="Estado" valor={`${personaje.estado} · ${personaje.rol_narrativo} · ${personaje.genero}`} />
        <Campo etiqueta="Universo" valor={personaje.universo} />
      </dl>

      <div className="flex flex-wrap gap-1">
        {avisos.map((a) => (
          <span
            key={a.clave}
            title={a.texto}
            className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${COLOR_SEVERIDAD[a.severidad]}`}
          >
            {a.clave.replace(/-/g, " ")}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onAbrir}
        className="mt-auto rounded-md border border-borde px-2 py-1 text-[11px] text-tenue hover:border-acento hover:text-acento"
      >
        {abierto ? "Ocultar detalle" : "Ver todo"}
      </button>

      {abierto && (
        <div className="flex flex-col gap-2">
          <ul className="flex flex-col gap-1 text-[10px] leading-snug">
            {avisos.map((a) => (
              <li key={a.clave} className={`rounded border px-2 py-1 ${COLOR_SEVERIDAD[a.severidad]}`}>
                {a.texto}
              </li>
            ))}
          </ul>
          {personaje.transformaciones.length > 0 && (
            <p className="text-[10px] text-tenue">
              <strong className="text-texto">Formas:</strong> {personaje.transformaciones.join(", ")}
            </p>
          )}
          <pre className="max-h-72 overflow-auto rounded border border-borde bg-black/40 p-2 text-[9px] leading-snug text-tenue">
            {JSON.stringify(personaje, null, 1)}
          </pre>
        </div>
      )}
    </article>
  );
}

function Campo({
  etiqueta,
  valor,
  sufijo,
  dudoso,
}: {
  etiqueta: string;
  valor: string;
  sufijo?: string;
  dudoso?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      <dt className="shrink-0 text-tenue">{etiqueta}</dt>
      <dd className="text-right leading-snug ms-auto">
        {valor}
        {sufijo && (
          <em className={`ml-1 not-italic ${dudoso ? "text-parcial" : "text-acierto"}`}>({sufijo})</em>
        )}
      </dd>
    </div>
  );
}

function Tabla({ visibles }: { visibles: { personaje: Personaje; avisos: Aviso[] }[] }) {
  const columnas = [
    "id", "nombre", "raza", "género", "debut", "#", "afiliación", "universo",
    "transf.", "fusión", "rol", "altura", "fuente", "estado", "cita", "imagen",
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-borde">
      <table className="w-full min-w-max text-[11px]">
        <thead className="sticky top-0 bg-panel text-left text-tenue">
          <tr>
            {columnas.map((c) => (
              <th key={c} className="whitespace-nowrap px-2 py-2 font-bold uppercase tracking-wide">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibles.map(({ personaje: p }) => (
            <tr key={p.id} className="border-t border-borde/60 hover:bg-white/5">
              <td className="px-2 py-1.5 font-mono text-[10px] text-tenue">{p.id}</td>
              <td className="whitespace-nowrap px-2 py-1.5 font-bold">{p.nombre}</td>
              <td className="px-2 py-1.5">{p.raza.join(" + ")}</td>
              <td className="px-2 py-1.5">{p.genero}</td>
              <td className="max-w-72 px-2 py-1.5">{p.debut}</td>
              <td className="px-2 py-1.5 text-tenue">{p.debut_indice}</td>
              <td className="max-w-64 px-2 py-1.5">{p.afiliacion_principal.join(" + ")}</td>
              <td className="whitespace-nowrap px-2 py-1.5">{p.universo}</td>
              <td className="px-2 py-1.5">{p.tiene_transformaciones ? p.transformaciones.length : "—"}</td>
              <td className="px-2 py-1.5">{p.es_fusion ? "sí" : "—"}</td>
              <td className="px-2 py-1.5">{p.rol_narrativo}</td>
              <td className="px-2 py-1.5 text-right">{p.altura_cm}</td>
              <td className={`px-2 py-1.5 ${p.altura_fuente === "estimada" ? "text-parcial" : "text-acierto"}`}>
                {p.altura_fuente}
              </td>
              <td className="px-2 py-1.5">{p.estado}</td>
              <td className={`px-2 py-1.5 ${p.cita ? "text-acierto" : "text-fallo"}`}>
                {p.cita ?? "falta"}
              </td>
              <td className={`px-2 py-1.5 ${p.imagen_base ? "text-acierto" : "text-fallo"}`}>
                {p.imagen_base ? "ok" : "falta"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pendientes({
  sinImagen,
  sinCita,
  taxonomias,
}: {
  sinImagen: Personaje[];
  sinCita: Personaje[];
  taxonomias: Taxonomias;
}) {
  return (
    <section className="mt-10 grid gap-4 lg:grid-cols-3">
      <ListaPendiente
        titulo={`${sinImagen.length} personajes sin imagen base`}
        ayuda={`Van en data/img/base/<id>.webp. Sin esto no hay Silueta ni Splash-zoom.`}
        ids={sinImagen.map((p) => p.id)}
      />
      <ListaPendiente
        titulo={`${sinCita.length} personajes sin cita`}
        ayuda="Doblaje latino, y que no contenga el nombre del personaje. Con 20-25 el modo Frase ya es jugable."
        ids={sinCita.map((p) => p.id)}
      />
      <div className="rounded-lg border border-borde bg-panel p-4">
        <h3 className="mb-2 text-sm font-bold">Taxonomías cerradas</h3>
        <dl className="flex flex-col gap-1.5 text-[11px] text-tenue">
          {(
            [
              ["razas", taxonomias.raza.length],
              ["afiliaciones", taxonomias.afiliacion_principal.length],
              ["universos", taxonomias.universo.length],
              ["roles", taxonomias.rol_narrativo.length],
              ["estados", taxonomias.estado.length],
              ["obras y sagas en el orden ordinal", taxonomias.debut.length],
            ] as const
          ).map(([nombre, n]) => (
            <div key={nombre} className="flex justify-between gap-2">
              <dt>{nombre}</dt>
              <dd className="font-bold text-texto">{n}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[10px] leading-snug text-tenue">
          Un valor fuera de estas listas hace fallar <code>pnpm test</code>. Para cambiarlas se edita{" "}
          <code>data/build_dataset.py</code>, nunca el JSON.
        </p>
      </div>
    </section>
  );
}

function ListaPendiente({ titulo, ayuda, ids }: { titulo: string; ayuda: string; ids: string[] }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="rounded-lg border border-borde bg-panel p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold">{titulo}</h3>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(ids.join("\n"));
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1500);
          }}
          className="shrink-0 rounded border border-borde px-2 py-0.5 text-[10px] text-tenue hover:border-acento hover:text-acento"
        >
          {copiado ? "copiado" : "copiar ids"}
        </button>
      </div>
      <p className="mb-2 text-[10px] leading-snug text-tenue">{ayuda}</p>
      <p className="max-h-40 overflow-y-auto font-mono text-[10px] leading-relaxed text-tenue">
        {ids.join(", ")}
      </p>
    </div>
  );
}
