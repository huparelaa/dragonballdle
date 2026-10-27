import { colisiones, nombresAmbiguos } from "@dle/engine";
import { describe, expect, it } from "vitest";
import { categoriasClasico, personajes, taxonomias } from "./index";

/**
 * Red de seguridad sobre el JSON que genera `data/build_dataset.py`. El script
 * ya corre su propio validador, pero esto es lo que impide que un dataset roto
 * llegue a producción sin que nadie haya corrido Python.
 */

/** Espejo de `COMPARABLES` en data/build_dataset.py. */
const COMPARABLES = [
  "raza",
  "genero",
  "debut",
  "afiliacion_principal",
  "universo",
  "tiene_transformaciones",
  "altura_cm",
  "estado",
];

describe("dataset de Dragon Ball", () => {
  it("tiene personajes", () => {
    expect(personajes.length).toBeGreaterThan(0);
  });

  it("no tiene dos personajes indistinguibles (regla de unicidad)", () => {
    expect(colisiones(personajes, categoriasClasico)).toEqual([]);
  });

  it("no tiene ids repetidos", () => {
    expect(new Set(personajes.map((p) => p.id)).size).toBe(personajes.length);
  });

  it("no tiene nombres ni alias ambiguos", () => {
    expect(nombresAmbiguos(personajes)).toEqual([]);
  });

  it("compara exactamente las mismas categorías que build_dataset.py", () => {
    expect(categoriasClasico.map((c) => c.clave)).toEqual(COMPARABLES);
  });
});

describe("taxonomías", () => {
  const dentroDe = (permitidos: string[]) => (valor: string) => permitidos.includes(valor);

  it("usa solo valores declarados en las taxonomías", () => {
    for (const p of personajes) {
      expect(p.raza.every(dentroDe(taxonomias.raza)), `${p.id}: raza`).toBe(true);
      expect(
        p.afiliacion_principal.every(dentroDe(taxonomias.afiliacion_principal)),
        `${p.id}: afiliación`,
      ).toBe(true);
      expect(taxonomias.genero, `${p.id}: género`).toContain(p.genero);
      expect(taxonomias.universo, `${p.id}: universo`).toContain(p.universo);
      expect(taxonomias.rol_narrativo, `${p.id}: rol`).toContain(p.rol_narrativo);
      expect(taxonomias.estado, `${p.id}: estado`).toContain(p.estado);
    }
  });

  it("tiene el debut y su índice sincronizados con la lista ordinal", () => {
    const porNombre = new Map(taxonomias.debut.map((d) => [d.nombre, d.indice]));
    for (const p of personajes) {
      expect(porNombre.get(p.debut), `${p.id}: debut "${p.debut}"`).toBe(p.debut_indice);
    }
  });

  it("mantiene tiene_transformaciones coherente con la lista de formas", () => {
    for (const p of personajes) {
      expect(p.tiene_transformaciones, `${p.id}`).toBe(p.transformaciones.length > 0);
    }
  });

  it("no inventa citas: si hay texto, está marcada como verificada", () => {
    for (const p of personajes) {
      if (p.cita_estado === "pendiente") expect(p.cita, `${p.id}`).toBeNull();
      else expect(p.cita, `${p.id}`).toBeTruthy();
    }
  });
});
