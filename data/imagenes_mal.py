#!/usr/bin/env python3
"""Propone URLs de retrato para los personajes que no tienen imagen.

Fuente: Jikan (API pública de MyAnimeList). Sus imágenes de personaje son
retratos verticales encuadrados a busto, que es lo que sirve para Splash-zoom.
NO sirven para el modo Silueta: son JPG con fondo, sin canal alfa.

Este script NO toca el dataset. Escribe `data/imagenes-candidatas.json` para
que Hobar revise cada propuesta antes de que entre a `build_dataset.py`.
El emparejamiento por nombre es criterio propio, no dato verificado.

Uso:
    python3 data/imagenes_mal.py

Por qué lo corrés vos y no el agente: api.jikan.moe deja de responder desde
el entorno del agente (cuerpo vacío tras los primeros dos requests). Desde una
máquina normal funciona.

No usa el buscador de Jikan (`/anime?q=`): devolvió 504 y, desde el entorno
del agente, cuerpo vacío. Los ids de las series van como semilla y las
películas y especiales se descubren con `/anime/{id}/relations`. Cada semilla
se valida contra su propio título antes de usarse, así que si un id estuviera
mal el script lo dice en vez de traer personajes de otra serie.

Las respuestas se cachean en `data/.cache-mal/` (ignorado por git): si hay que
retocar la tabla PUENTE, la segunda corrida no vuelve a pegarle a la API.
"""

from __future__ import annotations

import json
import re
import sys
import time
import unicodedata
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

RAIZ = Path(__file__).resolve().parent.parent
DATASET = RAIZ / "data" / "personajes.json"
SALIDA = RAIZ / "data" / "imagenes-candidatas.json"
CACHE = RAIZ / "data" / ".cache-mal"

JIKAN = "https://api.jikan.moe/v4"
PAUSA = 0.5  # Jikan permite 3 req/s; vamos holgados a propósito.
REINTENTOS = 4
ESPERAS = [2, 5, 12]  # backoff para 429 y 5xx, que en Jikan son frecuentes

# Semillas: las cuatro series. Verificado en vivo que 813 y 30694 devuelven
# personajes de Dragon Ball; 223 y 225 se validan en tiempo de ejecución.
SEMILLAS = [223, 813, 225, 30694]

# Nombres con los que MAL puede listar a cada personaje del roster.
# Es criterio propio: MAL usa romanización japonesa y nuestro dataset usa el
# doblaje latino, así que el puente hay que escribirlo a mano.
PUENTE: dict[str, list[str]] = {
    "trunks-futuro": ["Trunks Briefs", "Mirai Trunks", "Future Trunks"],
    "chaoz": ["Chaozu", "Chiaotzu"],
    "goten": ["Goten Son", "Son Goten"],
    "videl": ["Videl Satan", "Videl"],
    "pan": ["Pan Son", "Son Pan"],
    "kami": ["Kamisama", "Kami", "God"],
    "korin": ["Karin", "Korin"],
    "yajirobe": ["Yajirobee", "Yajirobe"],
    "oolong": ["Oolong", "Uuron"],
    "puar": ["Puar", "Pu'ar"],
    "uub": ["Uub", "Oob"],
    "kefla": ["Kefla", "Kefura"],
    "rey-piccolo": ["Piccolo Daimaou", "Piccolo Daimao", "King Piccolo"],
    "tao-pai-pai": ["Taopaipai", "Tao Pai Pai", "Mercenary Tao"],
    "nappa": ["Nappa"],
    "rey-cold": ["King Cold", "Cold"],
    "dabura": ["Dabura", "Darbura"],
    "garlic-jr": ["Garlic Jr.", "Garlic Junior"],
    "turles": ["Tullece", "Turles", "Tarles"],
    "lord-slug": ["Slug", "Lord Slug"],
    "cooler": ["Cooler", "Coola"],
    "broly-legendario": ["Broly", "Broli"],
    "bojack": ["Bojack", "Bujin"],
    "tapion": ["Tapion"],
    "champa": ["Champa"],
    "vados": ["Vados"],
    "frost": ["Frost", "Frost (Dragon Ball)"],
    "hit": ["Hit"],
    "cabba": ["Cabba", "Kyabe"],
    "caulifla": ["Caulifla", "Kyabetsu"],
    "kale": ["Kale"],
    "zamasu": ["Zamasu", "Zamas"],
    "goku-black": ["Goku Black", "Black"],
    "baby": ["Baby", "Baby Vegeta"],
}


def normalizar(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)


def traer(ruta: str) -> dict:
    """GET con caché en disco y reintentos con backoff para 429/5xx."""
    CACHE.mkdir(parents=True, exist_ok=True)
    archivo = CACHE / (re.sub(r"[^a-zA-Z0-9]+", "_", ruta).strip("_") + ".json")
    if archivo.exists():
        return json.loads(archivo.read_text(encoding="utf-8"))

    ultimo: Exception | None = None
    for intento in range(REINTENTOS):
        req = Request(
            f"{JIKAN}{ruta}",
            headers={"User-Agent": "DragonBallDle/1.0 (curacion de dataset)"},
        )
        try:
            with urlopen(req, timeout=45) as r:
                cuerpo = r.read().decode("utf-8")
            datos = json.loads(cuerpo)
            archivo.write_text(cuerpo, encoding="utf-8")
            return datos
        except HTTPError as e:
            ultimo = e
            # 404 no se reintenta: la ruta no existe y no va a aparecer.
            if e.code == 404:
                raise
            transitorio = e.code == 429 or 500 <= e.code < 600
            if not transitorio or intento == REINTENTOS - 1:
                raise
        except (URLError, TimeoutError, json.JSONDecodeError) as e:
            ultimo = e
            if intento == REINTENTOS - 1:
                raise
        espera = ESPERAS[min(intento, len(ESPERAS) - 1)]
        print(f"    (reintento {intento + 1}/{REINTENTOS - 1} en {espera}s: {ultimo})")
        time.sleep(espera)
    raise ultimo  # type: ignore[misc]


def titulos_de(mal_id: int) -> list[str]:
    datos = traer(f"/anime/{mal_id}")
    a = datos.get("data") or {}
    titulos = [a.get("title"), a.get("title_english"), a.get("title_japanese")]
    titulos += [t.get("title") for t in (a.get("titles") or [])]
    return [t for t in titulos if t]


def obras_dragon_ball() -> list[tuple[int, str]]:
    """Ids de MAL sin usar el buscador: semillas validadas + sus relaciones."""
    obras: dict[int, str] = {}
    pendientes: list[int] = []

    for mal_id in SEMILLAS:
        try:
            titulos = titulos_de(mal_id)
        except Exception as e:  # noqa: BLE001
            print(f"  ! semilla {mal_id} no se pudo verificar: {e}", file=sys.stderr)
            continue
        if not any("dragon ball" in t.lower() for t in titulos):
            print(
                f"  ! semilla {mal_id} NO es Dragon Ball ({titulos[0]!r}) — se salta",
                file=sys.stderr,
            )
            continue
        obras[mal_id] = titulos[0]
        pendientes.append(mal_id)
        print(f"  semilla ok: {mal_id} · {titulos[0]}")
        time.sleep(PAUSA)

    # Las películas y especiales cuelgan de las series como relaciones. Se
    # expande a dos niveles porque MAL encadena las películas entre sí (la 6 es
    # secuela de la 5, etc.) y desde las series no siempre se ven todas.
    vistos: set[int] = set()
    for nivel in (1, 2):
        siguiente: list[int] = []
        for mal_id in pendientes:
            if mal_id in vistos or len(obras) > 80:
                continue
            vistos.add(mal_id)
            try:
                datos = traer(f"/anime/{mal_id}/relations")
            except Exception as e:  # noqa: BLE001
                print(f"  ! relaciones de {mal_id} fallaron: {e}", file=sys.stderr)
                time.sleep(PAUSA)
                continue
            for rel in datos.get("data") or []:
                for ent in rel.get("entry") or []:
                    if ent.get("type") != "anime":
                        continue
                    nombre = ent.get("name") or ""
                    if "dragon ball" not in nombre.lower():
                        continue
                    if ent["mal_id"] not in obras:
                        obras[ent["mal_id"]] = nombre
                        siguiente.append(ent["mal_id"])
            time.sleep(PAUSA)
        print(f"  nivel {nivel}: {len(obras)} obras acumuladas")
        pendientes = siguiente

    return sorted(obras.items(), key=lambda o: o[1])


def indice_de_personajes(obras: list[tuple[int, str]]) -> dict[str, dict]:
    """nombre normalizado -> {nombre, url, obra}. Gana la primera aparición."""
    indice: dict[str, dict] = {}
    for mal_id, titulo in obras:
        try:
            datos = traer(f"/anime/{mal_id}/characters")
        except Exception as e:  # noqa: BLE001
            print(f"  ! {titulo} ({mal_id}) falló: {e}", file=sys.stderr)
            time.sleep(PAUSA)
            continue
        nuevos = 0
        for entrada in datos.get("data") or []:
            ch = entrada.get("character") or {}
            nombre = ch.get("name")
            url = (ch.get("images") or {}).get("jpg", {}).get("image_url")
            if not nombre or not url:
                continue
            # MAL escribe "Apellido, Nombre"; probamos las dos formas.
            formas = [nombre]
            if "," in nombre:
                ap, _, no = nombre.partition(",")
                formas.append(f"{no.strip()} {ap.strip()}")
            for f in formas:
                clave = normalizar(f)
                if clave and clave not in indice:
                    indice[clave] = {"nombre": nombre, "url": url, "obra": titulo}
                    nuevos += 1
        print(f"  {titulo}: {nuevos} nombres nuevos")
        time.sleep(PAUSA)
    return indice


def main() -> int:
    dataset = json.loads(DATASET.read_text(encoding="utf-8"))
    personajes = dataset["personajes"]
    faltantes = [p for p in personajes if not p.get("imagen_base")]
    print(f"{len(faltantes)} personajes sin imagen_base de {len(personajes)}\n")

    print("Descubriendo obras en MAL…")
    obras = obras_dragon_ball()
    if not obras:
        print("No se pudo listar ninguna obra. ¿Jikan caído o sin red?", file=sys.stderr)
        return 1
    print(f"{len(obras)} obras\n")

    print("Trayendo listas de personajes…")
    indice = indice_de_personajes(obras)
    print(f"\n{len(indice)} nombres indexados\n")

    candidatos, sin_match = [], []
    for p in faltantes:
        intentos = [p["nombre"], *p.get("alias", []), *PUENTE.get(p["id"], [])]
        hallado = None
        for nombre in intentos:
            clave = normalizar(nombre)
            if clave in indice:
                hallado = (nombre, indice[clave])
                break
        if hallado:
            usado, dato = hallado
            candidatos.append(
                {
                    "id": p["id"],
                    "nombre_dataset": p["nombre"],
                    "nombre_mal": dato["nombre"],
                    "coincidio_por": usado,
                    "obra_mal": dato["obra"],
                    "url": dato["url"],
                    # El emparejamiento es por nombre, no verificado a ojo.
                    "revisado": False,
                }
            )
        else:
            sin_match.append(p["nombre"])

    SALIDA.write_text(
        json.dumps(
            {
                "generado_por": "data/imagenes_mal.py",
                "fuente": "api.jikan.moe (MyAnimeList)",
                "advertencia": (
                    "Retratos JPG con fondo, sin canal alfa: sirven para "
                    "Splash-zoom, no para Silueta. Emparejados por nombre; "
                    "cada uno hay que verlo antes de aceptarlo."
                ),
                "candidatos": candidatos,
                "sin_coincidencia": sin_match,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(f"{len(candidatos)} candidatos · {len(sin_match)} sin coincidencia")
    for c in candidatos:
        print(f"  ✓ {c['nombre_dataset']:22} ← {c['nombre_mal']} ({c['obra_mal']})")
    for n in sin_match:
        print(f"  · {n:22} ← nada; buscar a mano")
    print(f"\nEscrito: {SALIDA.relative_to(RAIZ)}")
    print("Revisá cada URL antes de pasarla a build_dataset.py.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
