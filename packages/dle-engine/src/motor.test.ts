import { describe, expect, it } from "vitest";
import { buscar, normalizar } from "./buscar";
import { comparar } from "./comparar";
import { fechaEnZona, objetivoDelDia } from "./objetivo";
import type { Categoria } from "./tipos";
import { colisiones, nombresAmbiguos } from "./validar";

// Franquicia de juguete: el motor no debe necesitar saber nada más que esto.
interface Bicho {
  id: string;
  nombre: string;
  alias?: string[];
  colores: string[];
  tamanio: number;
  vuela: boolean;
}

const CATEGORIAS: Categoria<Bicho>[] = [
  { clave: "colores", etiqueta: "Colores", tipo: "multivalor", valor: (b) => b.colores },
  { clave: "tamanio", etiqueta: "Tamaño", tipo: "ordinal", valor: (b) => `${b.tamanio}`, orden: (b) => b.tamanio },
  { clave: "vuela", etiqueta: "Vuela", tipo: "booleano", valor: (b) => (b.vuela ? "Sí" : "No") },
  { clave: "nombre", etiqueta: "Nombre", tipo: "exacto", valor: (b) => b.nombre },
];

const bicho = (id: string, extra: Partial<Bicho> = {}): Bicho => ({
  id,
  nombre: id,
  colores: ["rojo"],
  tamanio: 10,
  vuela: false,
  ...extra,
});

describe("comparar", () => {
  const objetivo = bicho("grillo", { colores: ["verde", "negro"], tamanio: 20, vuela: true });

  it("marca exacto lo que coincide y fallo lo que no", () => {
    const r = comparar(bicho("mosca", { colores: ["verde", "negro"], tamanio: 20, vuela: true }), objetivo, CATEGORIAS);
    expect(r.celdas.map((c) => c.acierto)).toEqual(["exacto", "exacto", "exacto", "fallo"]);
    expect(r.correcto).toBe(false); // mismos atributos, otro personaje
  });

  it("da parcial cuando los conjuntos se cruzan sin ser iguales", () => {
    const r = comparar(bicho("rana", { colores: ["verde"] }), objetivo, CATEGORIAS);
    expect(r.celdas[0].acierto).toBe("parcial");
  });

  it("da fallo cuando los conjuntos no comparten nada", () => {
    const r = comparar(bicho("rana", { colores: ["azul"] }), objetivo, CATEGORIAS);
    expect(r.celdas[0].acierto).toBe("fallo");
  });

  it("apunta la flecha hacia donde está el objetivo", () => {
    const menor = comparar(bicho("pulga", { tamanio: 5 }), objetivo, CATEGORIAS);
    expect(menor.celdas[1].flecha).toBe("arriba"); // el objetivo es más grande
    const mayor = comparar(bicho("cóndor", { tamanio: 90 }), objetivo, CATEGORIAS);
    expect(mayor.celdas[1].flecha).toBe("abajo");
    const igual = comparar(bicho("otro", { tamanio: 20 }), objetivo, CATEGORIAS);
    expect(igual.celdas[1].flecha).toBeUndefined();
  });

  it("solo muestra valores del intento, nunca del objetivo", () => {
    const r = comparar(bicho("mosca", { colores: ["azul"] }), objetivo, CATEGORIAS);
    const texto = JSON.stringify(r);
    expect(texto).not.toContain("grillo");
    expect(texto).not.toContain("verde");
  });

  it("marca correcto solo cuando es el mismo id", () => {
    expect(comparar(objetivo, objetivo, CATEGORIAS).correcto).toBe(true);
  });
});

describe("objetivoDelDia", () => {
  const roster = Array.from({ length: 7 }, (_, i) => bicho(`b${i}`));
  const base = { semilla: "prueba:v1", epoca: "2026-01-01" };

  it("es determinístico: la misma fecha da siempre el mismo objetivo", () => {
    const a = objetivoDelDia(roster, { ...base, fecha: "2026-03-15" });
    const b = objetivoDelDia(roster, { ...base, fecha: "2026-03-15" });
    expect(a.id).toBe(b.id);
  });

  it("no repite ningún personaje dentro de una vuelta completa", () => {
    const salidos = Array.from({ length: roster.length }, (_, i) =>
      objetivoDelDia(roster, { ...base, fecha: `2026-01-0${i + 1}` }).id,
    );
    expect(new Set(salidos).size).toBe(roster.length);
  });

  it("cambiar la semilla cambia el calendario", () => {
    // Se compara la vuelta entera, no unos pocos días: dos permutaciones
    // distintas pueden coincidir en un puñado de posiciones por azar.
    const fechas = Array.from({ length: roster.length }, (_, i) => `2026-01-0${i + 1}`);
    const conA = fechas.map((fecha) => objetivoDelDia(roster, { ...base, fecha }).id);
    const conB = fechas.map((fecha) => objetivoDelDia(roster, { ...base, semilla: "otra", fecha }).id);
    expect(conA).not.toEqual(conB);
  });

  it("soporta fechas anteriores a la época", () => {
    expect(() => objetivoDelDia(roster, { ...base, fecha: "2025-12-25" })).not.toThrow();
  });

  it("falla con un roster vacío en vez de devolver undefined", () => {
    expect(() => objetivoDelDia([], { ...base, fecha: "2026-01-01" })).toThrow();
  });
});

describe("fechaEnZona", () => {
  it("respeta la zona horaria del reset", () => {
    // 2026-03-15 02:00 UTC todavía es 14 de marzo en Bogotá (UTC-5).
    const instante = new Date("2026-03-15T02:00:00Z");
    expect(fechaEnZona("America/Bogota", instante)).toBe("2026-03-14");
    expect(fechaEnZona("UTC", instante)).toBe("2026-03-15");
  });
});

describe("buscar", () => {
  const roster = [
    // El orden importa: "Hormiga reina" va primero para comprobar que la
    // coincidencia exacta con "Hormiga" le gana igual.
    bicho("hormiga-reina", { nombre: "Hormiga reina", alias: ["La reina"] }),
    bicho("hormiga", { nombre: "Hormiga", alias: ["Hormiga obrera"] }),
    bicho("colibri", { nombre: "Colibrí", alias: ["Picaflor"] }),
  ];

  it("ignora tildes y mayúsculas", () => {
    expect(normalizar("Colibrí Común")).toBe("colibri comun");
    expect(buscar(roster, "COLIBRI")[0].id).toBe("colibri");
  });

  it("prefiere la coincidencia exacta sobre el prefijo", () => {
    expect(buscar(roster, "hormiga")[0].id).toBe("hormiga");
  });

  it("encuentra por alias", () => {
    expect(buscar(roster, "picaflor")[0].id).toBe("colibri");
  });

  it("no devuelve nada con la consulta vacía", () => {
    expect(buscar(roster, "   ")).toEqual([]);
  });

  it("respeta el límite", () => {
    expect(buscar(roster, "hormiga", 1)).toHaveLength(1);
  });
});

describe("validar", () => {
  it("detecta dos entidades indistinguibles", () => {
    const r = colisiones([bicho("a"), bicho("b")], CATEGORIAS.slice(0, 3));
    expect(r[0].ids).toEqual(["a", "b"]);
  });

  it("no reporta nada cuando cada entidad es única", () => {
    expect(colisiones([bicho("a"), bicho("b", { tamanio: 11 })], CATEGORIAS.slice(0, 3))).toEqual([]);
  });

  it("detecta alias que apuntan a dos entidades", () => {
    const r = nombresAmbiguos([bicho("a", { alias: ["Bicho"] }), bicho("b", { nombre: "bicho" })]);
    expect(r[0].ids.sort()).toEqual(["a", "b"]);
  });
});
