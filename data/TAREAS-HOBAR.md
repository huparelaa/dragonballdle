# Tareas manuales de Hobar

Dos cosas que no se pueden automatizar y que decidiste hacer tú: las **citas** y las **imágenes**. Ninguna bloquea el desarrollo del código — se pueden llenar a tu ritmo.

Cuando termines cualquiera de las dos, corré `pnpm datos` para regenerar el dataset y revalidarlo.

Para ver en qué vas: `pnpm dev` y abrí **http://localhost:3000/panel**. Ahí está el dataset completo con qué falta, qué está estimado y qué imágenes cargan.

---

## A. Citas del doblaje latino

**Por qué a mano:** se investigaron todas las fuentes candidatas el 2026-08-02 y **ninguna sirve** — el detalle completo está en el README §5. El resumen: no hay API con citas (animechan es solo inglés y sin metadatos; dragonball-api.com no tiene el campo), Wikiquote no tiene la página en español y en inglés la tiene vacía de diálogo, Fandom sigue inaccesible, y **las recopilaciones de "frases" en español son traducciones del doblaje inglés de FUNimation** — o sea frases que en el audio latino no existen. Escribirlas sería llenar el dataset de citas que nadie escuchó.

**De dónde sacarlas entonces:** del audio. En orden de preferencia:

1. **Canal de Toei Animation Latinoamérica en YouTube** — subió episodios de DBZ gratis con el doblaje clásico. Hay que confirmar qué hay disponible.
2. **Crunchyroll o Prime Video**, con la pista de audio latino.

**Anotá siempre episodio y minuto.** Es lo único que separa "verificada" de "me suena así": si dentro de seis meses alguien discute una cita, el número de episodio la defiende y la memoria no.

**Meta mínima: 20-25 citas.** Con eso el modo Frase ya es jugable — el motor elige el objetivo diario solo entre personajes con `cita_estado: "verificada"`, y los otros tres modos funcionan con los 76 desde el día uno.

**Criterio de buena cita:** que un fan la reconozca sin contexto, y que **no contenga el nombre del personaje** (sería regalar la respuesta). Ojo con las muy cortas: "¡Insecto!" es icónica pero no alcanza como pista sola.

**Cómo llenarlo:** escribí el texto en la columna `Cita`, y en `A quién / Arco / Ep.` el destinatario, la saga (usá los nombres de `debut-orden.md`) y el episodio donde la escuchaste. Cuando la tengas, ese personaje pasa a `cita_estado: "verificada"` en el script.

> Los campos `cita_destinatario`, `cita_arco`, `cita_obra` y `cita_episodio` **todavía no existen** en `build_dataset.py`. Anotalos igual acá: cuando se codee el modo Frase se agregan al esquema de una sola vez (esquema propuesto en README §5).

| # | Personaje | Escena / momento a extraer | Cita | A quién / Arco / Ep. |
|---:|---|---|---|---|
| 1 | Goku | Presentación ante Freezer en Namek: se identifica como saiyajin criado en la Tierra | | |
| 2 | Vegeta | Scouter, saga Saiyajin | ✅ "Su poder de pelea es más de 8,000" — **todavía no está en el dataset**: `cita_estado` de Vegeta sigue en `pendiente`. Hay que pasarla a `build_dataset.py`. | |
| 3 | Piccolo | Despedida a Gohan antes de morir contra Nappa | | |
| 4 | Gohan | Estallido contra Cell tras la destrucción del Androide 16 | | |
| 5 | Freezer | Al revelar que aún no ha mostrado todo su poder ante Goku en Namek | | |
| 6 | Cell | Presentación / desafío al anunciar los Juegos de Cell | | |
| 7 | Krilin | Reacción al ver el poder de Freezer | | |
| 8 | Muten Roshi | Enseñanza sobre el Kame Hame Ha, o su frase de maestro pervertido | | |
| 9 | Mr. Satan | Su bravata de campeón del mundo ante la multitud | | |
| 10 | Majin Buu | La línea infantil-amenazante de Kid Buu | | |
| 11 | Beerus | Su desdén por los mortales al despertar en *La batalla de los dioses* | | |
| 12 | Whis | Su comentario burlón sobre la comida de la Tierra | | |
| 13 | Trunks del Futuro | Al explicar el futuro devastado por los androides | | |
| 14 | Bulma | Su primer encuentro con Goku, o su reclamo característico | | |
| 15 | Androide 18 | Su línea despectiva hacia Krilin o Vegeta en la saga de los Androides | | |
| 16 | Jiren | Su discurso sobre la fuerza y la soledad en el Torneo del Poder | | |
| 17 | Zamasu | Su declaración sobre el "Plan Cero Mortales" | | |
| 18 | Broly (DBZ) | Su grito recurrente hacia Goku | | |
| 19 | Gogeta o Vegetto | Presentación al fusionarse | | |
| 20 | Nappa | La pregunta que abre la escena del scouter | | |
| 21 | Nº 17 | Su indiferencia / su línea sobre la isla y los animales | | |
| 22 | Gotenks | Su presentación fanfarrona al fusionarse | | |
| 23 | Chi-Chi | Su reclamo sobre los estudios de Gohan | | |
| 24 | Kaio del Norte | Un chiste malo, o su reacción a la autodestrucción de Cell | | |
| 25 | Bardock | Su desafío final a Freezer | | |

**Nota sobre la #2:** el original japonés dice 8.000; el "over 9000" es del doblaje inglés. Y en la escena la dice **Vegeta hablando con Nappa**, no Nappa — es un error común.

---

## B. Imágenes

**Por qué a mano:** `dragonball-api.com` solo cubre 42 de los 76 personajes y no existe otra API. Las que faltan hay que sacarlas de renders oficiales o fotogramas del anime.

### Dónde van

```
data/img/base/<id>.webp          imagen base, 1 por personaje (obligatoria)
data/img/formas/<id>__<forma>.webp   formas para Splash-zoom (máx. 3 por personaje)
```

El `<id>` es exactamente el del dataset. El validador avisa cuáles faltan.

### Criterio de la imagen base

Es la más importante porque alimenta **dos modos** (Silueta y Splash-zoom):

- Cuerpo completo, pose limpia y reconocible por contorno.
- **Sin aura ni efectos** — arruinan la silueta (quedaría una mancha con forma de llama, no el personaje).
- Fondo transparente (canal alfa). Si no lo tiene, hay que recortarlo.
- Si un personaje solo tiene buena imagen con aura, se puede usar una base distinta para Silueta y otra para Splash-zoom.

### Regla de derechos, importante

**No usar ninguna imagen cuyo nombre contenga `by_<algo>`.** Ese patrón es de DeviantArt: son obras de artistas individuales identificables, no material de Toei. Un artista particular es mucho más propenso a reclamar que Toei y tiene un caso más limpio.

> **Corregido 2026-08-02.** Acá decía que había 4 imágenes así en el dataset (Freezer forma perfecta, Beast Gohan, dos de Gogeta). **No las hay: son 0.** Esas cuatro eran imágenes de *transformación* que devuelve la API, y el dataset nunca guardó URLs de transformación — solo `imagen_base`. La regla sigue en pie para cuando consigas imágenes de formas.

### Los 34 personajes sin imagen base

```
trunks-futuro, chaoz, goten, videl, pan, kami, korin, yajirobe, oolong, puar,
uub, kefla, rey-piccolo, tao-pai-pai, nappa, rey-cold, dabura, garlic-jr,
turles, lord-slug, cooler, bojack, tapion, champa, vados, frost, hit, cabba,
caulifla, kale, zamasu, goku-black, baby, broly-legendario
```

> **Corregido 2026-08-02.** La lista decía 33 y le faltaba `broly-legendario`. En vez de mantenerla a mano, usá la lista viva del panel del creador (`pnpm dev` → `/panel`), que la calcula del dataset y trae botón para copiar los ids.

Cuando consigas una, cambiá `imagen_fuente` de `"pendiente"` al origen real en `build_dataset.py`.
