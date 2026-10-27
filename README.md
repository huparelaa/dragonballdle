# DragonBallDle

Juego diario tipo "-dle" (Loldle, NarutoDle, Wordle) sobre Dragon Ball: cada día hay un personaje objetivo oculto y el jugador intenta adivinarlo mediante distintos modos de pistas.

Es también el primer juego de una posible familia de juegos "-dle", uno por franquicia (ej. un futuro AvatarDle), cada uno en su propio dominio pero compartiendo el mismo motor.

**Estado (2026-08-02):** modo Clásico funcionando de punta a punta (motor + endpoint + UI), verificado sobre el build de producción, y con la pasada visual hecha (fondo ilustrado, logo, paleta clara y revelado escalonado — el diagnóstico y las decisiones, en §8). Los otros tres modos están sin empezar: dependen de imágenes y citas que todavía son trabajo manual (§7). Estructura del código y cómo correrlo, en §8.

Este documento es la única fuente de verdad del proyecto: qué se decidió, por qué, y qué queda pendiente.

---

## 1. Alcance de la v1

- **Reto diario único.** Un solo personaje objetivo por día, igual para todos (como Wordle). Sin modo práctica ilimitada.
- **4 modos de juego:** Clásico por atributos, Silueta, Frase/cita icónica, Splash-zoom.
- **Canon:** series oficiales (Dragon Ball clásico, Z, Super, GT, Daima) + películas oficiales de Toei. Sin videojuegos ni Dragon Ball Heroes.

### Backlog (no comprometido para v1)

- Modo de técnicas con filtros de blur/color (Kamehameha, Special Beam Cannon, etc.). Depende de conseguir gifs/clips de técnicas — no se ha validado que existan de forma accesible y consistente para suficientes personajes.
- Modo práctica ilimitada. Se puede agregar después sin romper el diseño: el motor de comparación es el mismo.

---

## 2. Decisiones de diseño

Decisiones tomadas antes de escribir código, con su porqué, para no re-discutirlas en cada sesión futura.

### 2.1 Alcance de canon

**Decisión:** solo contenido oficial — Dragon Ball clásico, Z, Super, GT, Daima, y películas oficiales de Toei. **No** se incluyen videojuegos, Dragon Ball Heroes, ni personajes originales de videojuegos (ej. OCs de Xenoverse).

**Por qué:** mantener el dataset consistente y evitar contradicciones de canon entre fuentes. Las películas sí entran porque suman personajes muy pedidos (Broly, Cooler, Janemba) y tienen tratamiento canónico oficial.

**Cómo aplica:** la categoría `debut` usa como valores las series o, si el personaje debutó en una película, el nombre de esa película.

### 2.2 Las transformaciones no son personajes separados

**Decisión:** en el modo clásico, cada personaje es **una sola entrada** (una única entrada "Goku", no una por forma). Las transformaciones se manejan aparte, dentro del modo Splash-zoom: primero se adivina el personaje a partir de un recorte con zoom extremo de una imagen de alguna de sus formas, y luego se elige la transformación específica de una lista (detalle en §3).

**Por qué:** separar por transformación (Goku Base / Goku SSJ / Goku Ultra Instinct como entradas distintas) generaría personajes casi idénticos en todas las categorías del modo clásico, rompiendo la comparación por atributos.

**Cómo aplica:** el modelo de personaje incluye un booleano `tiene_transformaciones` y, para Splash-zoom, una lista de imágenes por forma conocida.

### 2.3 Reto diario, sin modo práctica en v1

**Decisión:** un único personaje objetivo compartido por día. Sin práctica ilimitada en v1.

**Por qué:** simplificar el alcance inicial. Agregar práctica después no rompe nada — el motor de comparación es el mismo.

### 2.4 Monorepo, con separación de módulos estricta

**Decisión:** un solo repositorio para toda la familia de juegos "-dle", con el motor y las apps como paquetes separados dentro:

```
dle/
├── packages/dle-engine/          motor genérico, agnóstico de franquicia
├── packages/dragonballdle-data/  datos y categorías de Dragon Ball
├── apps/dragonballdle/           la app que junta motor + datos
└── apps/avatardle/               futuro, mismo patrón (+ su propio -data)
```

Los datos van en su propio paquete y no dentro de la app, para que quede explícito que la app solo compone: el motor consume un paquete de datos cualquiera, y esa frontera es la que hay que mantener limpia.

**Por qué:** lo que da la reutilización es el **límite de módulo** (que el engine no sepa nada de Dragon Ball), no el límite de repositorio. Y lo reutilizable **no son las categorías** — cada franquicia tiene las suyas — sino la mecánica: comparación de atributos, reto diario, y el contrato de los modos de juego. Con engine y datos evolucionando juntos durante meses, repos separados obligarían a publicar versión y actualizar el pin en cada cambio del contrato — puro overhead con un solo dev y un solo consumidor. En monorepo, un cambio engine+data es un commit atómico, un CI, un `git clone`.

**Reversibilidad:** extraer un paquete de un monorepo después es fácil; fusionar repos con historia separada es molesto. Empezar junto es la opción que se puede deshacer.

**Cuándo reconsiderar:** si aparecen cadencias de release distintas, colaboradores con permisos distintos, o se publica el engine como paquete para terceros.

**Nota:** que cada juego vaya a su propio dominio es un problema de build/deploy, no de repo — cada app se buildea y despliega por separado desde el mismo monorepo (estándar con workspaces de pnpm o Turborepo). La elección de framework, hosting, etc. queda **pendiente a propósito** hasta pasar de diseño a construcción.

---

## 3. El motor (`dle-engine`)

Motor genérico y reutilizable para juegos tipo "-dle". No conoce nada específico de ninguna franquicia: cada juego se conecta dándole un dataset propio que cumpla los contratos de abajo.

Esta sección describe **comportamiento, no implementación** — no compromete ninguna decisión de stack (§2.4).

### Responsabilidad

- Elegir el objetivo del día de forma determinística (semilla basada en la fecha, no random real, para que todos vean el mismo personaje).
- Recibir un intento del jugador y devolver la comparación contra el objetivo, atributo por atributo.
- Correr los modos de juego sobre cualquier dataset que respete su esquema de categorías.

Lo que **no** hace: definir qué categorías existen, qué personajes hay, ni de dónde salen las imágenes/citas. Eso vive en el paquete de datos de cada franquicia.

### Tipos de atributo soportados

Cada franquicia declara sus categorías usando uno de estos tipos:

| Tipo | Comportamiento | Ejemplo |
|---|---|---|
| **Exacto** | Verde si coincide, rojo si no | Género |
| **Multivalor / parcial** | Verde si coincide todo el set, amarillo si hay intersección parcial, rojo si no comparten ningún valor | Afiliación, raza en híbridos |
| **Ordinal con flecha** | Verde si coincide exacto; si no, flecha arriba/abajo indicando si el objetivo es mayor/posterior o menor/anterior que el intento | Saga de debut, altura |
| **Booleano** | Verde/rojo simple | "¿es fusión?", "¿tiene transformaciones?" |

### Contrato de los modos de juego (v1)

Todos los modos comparten el objetivo del día y el sistema de intentos, pero cada uno produce su propia mecánica de pista:

1. **Clásico por atributos** — el jugador escribe un personaje (con autocompletado) y se muestra la fila de comparación categoría por categoría usando los tipos de arriba.
2. **Silueta** — se muestra la silueta del personaje objetivo, generada a partir de su imagen base (ver §5), y el jugador adivina el nombre.
3. **Frase/cita icónica** — se muestra una cita y el jugador adivina de quién es.
4. **Splash-zoom** — se muestra un recorte con zoom extremo de una imagen (normal o de una transformación). El jugador primero adivina el personaje; si la imagen correspondía a una transformación, hay un segundo paso donde elige cuál de las formas conocidas es.

**Mínimo que debe proveer cada franquicia, por personaje:** nombre + alias de búsqueda, valores de cada categoría declarada, imagen base, y (si aplica) lista de imágenes de transformación y una cita.

### Pensado para reutilizar

Si en el futuro se arma otro "-dle", ese proyecto reutiliza el motor tal cual y solo aporta su propio paquete de datos con sus propias categorías. No debería requerir tocar la lógica de comparación ni los modos de juego, salvo que aparezca un tipo de categoría genuinamente nuevo.

---

## 4. Los datos de Dragon Ball (`dragonballdle-data`)

Contenido específico de la franquicia que alimenta al motor.

### Modelo de personaje

Una entrada por identidad base del personaje, no una por transformación (§2.2).

| Campo | Tipo de comparación | Notas |
|---|---|---|
| `id`, `nombre`, `alias` | — | `alias` para que el autocompletado acepte apodos comunes (ej. "Trunks del futuro" vs "Trunks") |
| `raza` | Multivalor | Híbridos (ej. Gohan = Saiyan + Humano) llevan más de un valor |
| `genero` | Exacto | |
| `debut` | Ordinal | Valores: `Dragon Ball`, `Dragon Ball Z`, `Dragon Ball Super`, `Dragon Ball GT`, `Dragon Ball Daima`, o el nombre de la película. En la tabla se muestra abreviado (`DBZ · Majin Buu`); el dato guardado sigue completo. Falta definir el orden cronológico de las películas (§6) |
| `afiliacion_principal` | Multivalor | Puede tener más de un valor si cambió de bando de forma relevante |
| `universo` | Exacto | Default: Universo 7. Relevante sobre todo para el Torneo del Poder |
| `tiene_transformaciones` | Booleano | Si es `true`, alimenta la lista de formas para Splash-zoom |
| `es_fusion` | — (fuera de la tabla) | Ej. Vegito, Gogeta, Gotenks, Kefla. Solo 4 de 76 lo tienen en `true`: como columna era "No" en el 95 % de las filas y no ayudaba a descartar. Se mantiene en el dataset para futuros modos |
| `rol_narrativo` | — (fuera de la tabla) | Protagonista / antagonista / secundario. Salió de la tabla: es el único atributo que depende de la lectura de cada uno y no del canon, así que discutir un "parcial" era discutir el criterio, no el personaje. Se mantiene en el dataset |
| `altura_cm` | Ordinal (numérico) | Para la flecha de mayor/menor |
| `estado` | Exacto | Vivo / muerto, binario — tomado "al final de su participación en la serie", para no depender de en qué punto de la trama está el jugador. Hubo un tercer valor `revivido` hasta el 2026-08-02 (ver abajo) |

### Regla de unicidad

Antes de cerrar el dataset (y al agregar personajes nuevos), verificar que no haya dos personajes con la **combinación exacta** de todos los valores anteriores — si eso pasa, el motor no puede distinguirlos como respuesta al reto diario. No hace falta que cada campo individual sea único, solo la combinación completa.

Se valida sobre los **8 atributos que el jugador ve**, no sobre todos los del dataset. Un campo que existe pero no es columna no puede desempatar nada: si dos personajes solo difieren en `rol_narrativo`, para quien juega son el mismo. Por eso sacar una columna de `categoriasClasico` obliga a sacarla también de `COMPARABLES` en `build_dataset.py` y a volver a correr el validador. Con las 8 actuales: **76 firmas únicas, 0 colisiones**.

Aparte, el reporte lista las **cuasi-colisiones**: grupos que solo se distinguen por `altura_cm`. Pasaron de 5 a 7 con las dos simplificaciones del 2026-08-02 — bajar a 8 columnas sumó `androide-16`/`androide-19` y metió a Kefla en el grupo de Caulifla/Kale; volver binario el `estado` sumó `goten`/`gotenks`. No rompen nada (el motor los separa por la flecha de altura), pero son las filas donde el juego se apoya en un solo atributo. Es el techo de cuánto más se puede simplificar la tabla sin empezar a producir colisiones de verdad: **la próxima columna que se saque hay que validarla antes, no después.**

---

## 5. Assets y fuentes de datos

Resultado de la investigación inicial de fuentes para poblar el dataset (datos + imágenes + citas).

> **Actualizado 2026-08-01 tras validación en vivo.** Esta sección contenía dos errores: el dominio correcto es `dragonball-api.com` (con guion) y la lista de campos que se le atribuía era más optimista que la realidad.

### Fuente 1: dragonball-api.com

API REST comunitaria (no oficial). Devuelve personajes, planetas y transformaciones.

Campos que **sí** trae: nombre, raza, género, ki/ki máximo, descripción, afiliación (un solo valor), URL de imagen, transformaciones. Campos que **no** trae, contra lo que se asumió antes: `estado`, `serie de debut` y `nombre en japonés`. Cubre 4 de nuestros 13 campos, con errores de clasificación (marca a Bulma y Nail como "Z Fighter", a Zarbon y Dodoria como "Frieza Race").

**Cobertura medida (2026-08-02).** La API tiene **58 personajes**, no ~42 como decía antes esta sección. Pero solo **39 coinciden** con nuestro roster por nombre o alias: los otros 19 son Kaios, Kaio-shins y ángeles secundarios que §7 excluye a propósito, más tres androides de película (14, 15, 20). O sea que el número más grande no aporta cobertura nueva — **la API está agotada como fuente**.

`GET /transformations` devuelve 44 formas. **Varias violan la regla de DeviantArt de acá abajo**: `..._by_poh2000_...`, `..._by_rmrlr2020_...`, `..._by_ssjrose890_...`, y una además trae `con_aura` en el nombre, que es exactamente el caso que rompe la silueta. Si algún día se importan las formas, hay que filtrar por nombre de archivo antes de mirar nada más.

Límite: 100 requests / 15 min.

**Uso real:** su único valor es como fuente de **URLs de imagen** para las 42 bases que ya están en el dataset. No justifica un script de consolidación (cierra §6.5): el dataset se curó a mano.

### Fuente 2: dragonball.fandom.com (Dragon Ball Wiki)

**Inaccesible desde este entorno** — 5 rutas distintas, incluida una llamada ligera a la API de MediaWiki, todas dieron timeout. Re-probado el 2026-08-02: la llamada a `api.php` volvió a agotar el timeout de 180 s. Por eso las taxonomías (`data/taxonomias.md`) no salieron de `List_of_Races` sino de criterio propio documentado.

### Fuente 3: Jikan / MyAnimeList

API pública de MyAnimeList. `GET /v4/anime/{id}/characters` devuelve, por obra, la lista completa de personajes con una **URL de retrato vertical encuadrado a busto** — bastante más cerca de una cara que el cuerpo entero de la Fuente 1. Y tiene profundidad real: la lista de Dragon Ball Super sola pasa los cientos de entradas e incluye secundarios del Torneo del Poder.

Tres límites, todos conocidos antes de usarla:

1. **Son JPG con fondo, sin canal alfa.** Sirven para Splash-zoom; **no** para el modo Silueta, que necesita alfa (§5, "Las siluetas programáticas").
2. **El encuadre no está verificado.** El formato retrato de MAL se da por conocido, no comprobado archivo por archivo — no se pudo inspeccionar ninguno. Cada URL hay que verla antes de aceptarla.
3. **Inestable, y con un endpoint directamente roto.** `/v4/anime/{id}/characters` responde. **`/v4/anime?q=` no**: devolvió cuerpo vacío desde el entorno del agente y **HTTP 504** desde la máquina de Hobar, así que la falla es de Jikan y no del entorno. Tampoco respondió `/v4/characters/{id}`. Aparte, desde el entorno del agente la API dejó de contestar del todo tras los dos primeros requests (siete intentos vacíos, con esperas de hasta 40 s), lo que se asume bloqueo por agente.

Por (3) la consulta se hace **desde la máquina de Hobar** con `python3 data/imagenes_mal.py`. Consecuencias de diseño del script, todas forzadas por lo de arriba:

- **No usa el buscador.** Los ids de las cuatro series van como semilla (`223`, `813`, `225`, `30694`) y las películas y especiales se descubren con `/anime/{id}/relations`, expandido **a dos niveles** porque MAL encadena las películas entre sí y desde la serie no se ven todas. Movie-only como Broly Legendario, Cooler o Tapion aparecen recién en el segundo nivel.
- **Las semillas se autovalidan.** Antes de usar un id pide `/anime/{id}` y comprueba que el título diga "Dragon Ball". Si un id estuviera mal, lo dice y lo salta en vez de traer personajes de otra serie.
- **Reintentos con backoff** (2/5/12 s) para 429 y 5xx, que es el modo de falla habitual de Jikan. El 404 no se reintenta.
- **Caché en `data/.cache-mal/`** (ignorada por git): retocar la tabla `PUENTE` y volver a correr no le pega otra vez a la API.
- **No escribe en el dataset.** Deja `data/imagenes-candidatas.json` con `"revisado": false` en cada entrada, para que las URLs pasen por el ojo de Hobar antes de entrar a `build_dataset.py`. El emparejamiento usa la tabla `PUENTE` (MAL romaniza del japonés, el dataset usa doblaje latino), que es **criterio propio, no dato verificado**.

Probado de punta a punta con la red apagada y una caché sintética: los 34 faltantes emparejan y 0 quedan sin coincidencia. Eso valida la lógica, **no** los nombres reales de MAL.

### No existe una API de caras con zoom

Se buscó explícitamente el 2026-08-02: **no hay ninguna**, ni de Dragon Ball ni de anime en general. Los datasets de "anime faces" de HuggingFace y Kaggle (21 k y 63 k caras recortadas de getchu.com) son caras genéricas de visual novels sin identidad de personaje, y los de Kaggle sobre Dragon Ball son de clasificación de transformaciones o datos tabulares. Ninguno sirve.

Es la conclusión esperada, y no cambia el plan: la regla de seguridad de §8 ya exige que **el recorte se sirva ya generado**, así que el zoom lo produce nuestro build de todas formas. Dos vías para producirlo:

| Vía | Estado |
|---|---|
| Detector de cara anime (`lbpcascade_animeface`, `anime-face-detector` con mmdet) → recorte + margen | **Sin verificar, y con un riesgo concreto:** están entrenados en caras anime estándar y buena parte del roster no lo es (Piccolo, Célula, Buu, Freezer, los androides, Bills, Janemba). No se pudo probar porque no hay ni una imagen en disco |
| Coordenada de cara a mano en el dataset (`cara: {x, y, r}` como fracción de la imagen) y el recorte en `build_dataset.py` | Determinista y acierta siempre. 76 puntos son un rato de trabajo. Es la opción que se recomienda arrancar |

### Citas

**Investigado a fondo el 2026-08-02. Conclusión: no existe fuente reutilizable. Las citas se transcriben a mano, y la verificación se hace contra audio.** Detalle de qué se probó y por qué falló, para no volver a buscar:

| Fuente | Estado verificado | Por qué no sirve |
|---|---|---|
| **animechan.io** (ex `animechan.vercel.app`) | ✅ Viva. Docs y endpoints accesibles. Gratis 5 req/**hora**, premium USD 5/mes por 1.000/h | **Solo inglés**, y el objeto `Quote` es `{content, anime{id,name}, character{id,name}}` — **nada** de destinatario, arco, episodio ni idioma. `/quotes?anime=X` devuelve **5** citas por anime. Inútil para nosotros en las tres dimensiones que necesitamos |
| **dragonball-api.com** | ✅ Viva (JSON directo) | **No tiene campo de citas.** Verificado en vivo sobre `/api/characters?name=Goku`: los campos son `name, ki, maxKi, race, gender, description, image, affiliation`. Varios directorios de APIs (publicapi.dev entre ellos) afirman que trae "iconic quotes" — **es falso** |
| **en.wikiquote.org/wiki/Dragon_Ball_Z** | ✅ Accesible | La página existe pero **no contiene ni un diálogo de personaje**: solo una sección "About Dragon Ball Z" con comentarios de terceros sobre la serie. Wikiquote purgó los listados de diálogo de anime |
| **es.wikiquote.org** | ⚠️ El dominio responde (`/wiki/Portada` carga) pero `/wiki/Dragon_Ball` y `/wiki/Dragon_Ball_Z` vuelven vacíos | **Inferencia, no verificación directa:** el artículo no existe. Wikiquote en español tiene ~6.258 artículos en total y Dragon Ball no figura en su índice de historietas |
| **Fandom** (`dragonball.fandom.com/es`, `doblaje.fandom.com`) | ❌ Inaccesible desde este entorno: respuesta vacía o timeout | Mismo bloqueo que ya documentaba esta sección. **Doblaje Wiki era la única candidata con metadatos de doblaje latino** y no se pudo leer |
| **Datasets públicos** (GitHub, Kaggle) | ✅ Existen datasets de Dragon Ball | Todos son de **niveles de poder y fichas de personaje**. No hay ninguno de diálogo |
| **Recopilaciones de "frases" en español** (lifeder, alfabetajuega, freakuotes, blogs) | ✅ Accesibles y abundantes | **Son traducciones del doblaje inglés, no del latino.** Ver abajo — este es el hallazgo importante |
| **Subtítulos** (opensubtitles.org, tvsubtitles.net) | ✅ Existen en español | Un subtítulo **no es el guion del doblaje**: se traduce del japonés por su cuenta, y casi todo lo etiquetado "español" es de España. Además redistribuir el `.srt` es material con derechos, y bajarlo saldría de las herramientas permitidas (ver CLAUDE.md) |

#### El hallazgo que importa: las listas en español están traducidas del doblaje inglés

Casi todas las recopilaciones de "frases de Dragon Ball" en español son la lista inglesa pasada por traductor. La prueba está en lifeder, que atribuye a Goku *"Soy la respuesta a todos los seres vivos que claman por la paz… ¡Aliado para bien! ¡Pesadilla para ti!"*. Eso es el discurso `"I am the hope of the universe…"` que **inventó FUNimation** para el doblaje inglés de 1999: en el guion japonés Goku dice algo mucho más contenido ("soy el saiyajin que vino de la Tierra a derrotarte…"). Lo mismo con *"Hay tres cosas que no puedo tolerar: cobardía, malos peinados e insurrección militar"* (Freezer) y *"Preferiría ser un mono sin cerebro que un monstruo sin corazón"* (Goku), ambas exclusivas del inglés.

Y el doblaje latino **se tradujo del japonés**, no del inglés — Brenda Nava tradujo todo DBZ. O sea: esas frases **no existen en el audio que nuestro jugador reconoce**. Copiarlas sería llenar el dataset de citas que nadie escuchó nunca, presentadas como si fueran del latino. Es exactamente el error que la regla de honestidad de datos existe para evitar.

Detalle adicional: esas listas tampoco traen episodio ni arco, no citan fuente, y varias están en español de España (`lifeder` declara `og:locale: es_ES`).

#### La fuente real es el audio, y hay una legítima

Lo único que verifica una cita del doblaje latino es escucharla. Dos caminos, en orden de preferencia:

1. **Canal oficial de Toei Animation Latinoamérica en YouTube.** Según prensa de julio de 2025 subió episodios de Dragon Ball Z gratis con el doblaje clásico. **No verificado de primera mano** — hay que abrir el canal y confirmar qué episodios están y si siguen arriba.
2. **Crunchyroll o Prime Video**, que tienen la serie con pista de audio latino.

Cualquiera de los dos sirve para transcribir con el número de episodio y el minuto a mano, que es lo que hace la cita defendible.

#### Los metadatos que hay que capturar (y el esquema que falta)

Hoy el dataset guarda `cita`, `cita_idioma` y `cita_estado`. Para el modo Frase hacen falta más campos: **quién lo dijo** es la respuesta (o sea, la entrada del personaje — no necesita campo), pero **a quién** y **en qué arco** son la pista y el texto de revelado. Esquema propuesto, aún **no implementado** en `build_dataset.py` ni en `personaje.ts`:

| Campo | Para qué | Nota |
|---|---|---|
| `cita` | El texto | Ya existe |
| `cita_idioma` | `es-419` | Ya existe. Fijarlo explícito evita que se cuele una del inglés |
| `cita_estado` | `pendiente` / `verificada` | Ya existe. `verificada` debe significar **escuchada**, no leída en un blog |
| `cita_destinatario` | A quién se la dice | Pista opcional que el jugador puede pedir, y parte del revelado. `null` si es monólogo o al público |
| `cita_arco` | En qué saga | **Reusar los valores de `data/debut-orden.md`**, no una taxonomía nueva. Así el arco es ordinal y se puede mostrar con la misma abreviatura que la columna `debut` |
| `cita_obra` + `cita_episodio` | Dónde se verificó | Es lo que separa "verificada" de "me suena". Va al panel del creador, no al jugador |
| `cita_nota` | Aclaraciones del curador | Ej. el caso del scouter (abajo) |

Dos decisiones de diseño que quedan abiertas y conviene cerrar antes de codear el modo:

- **Una cita por personaje o varias.** Hoy el campo es singular. Un arreglo permitiría que el mismo personaje salga en días distintos con frases distintas, y cuesta poco ahora y mucho después.
- **Cuánto revelar como pista.** El arco y el destinatario son pistas fuertes: decir "se la dijo a Nappa en la saga Saiyajin" reduce el roster a un puñado. Probablemente vayan escalonadas (por intento fallido), no todas de entrada.

#### Regla de contenido, que ya estaba y sigue

La cita no debe contener el nombre del personaje que la dice, ni el del destinatario si ese nombre regala la respuesta. Y ojo con la trampa de atribución más común de la franquicia: **"su poder de pelea es más de 8.000" la dice Vegeta hablando con Nappa** — no Nappa, y no es "9.000", que es el error del doblaje inglés.

La lista de las 25 citas objetivo y el criterio de selección están en `data/TAREAS-HOBAR.md`.

### Alturas

Las alturas oficiales solo existen para ~50 personajes en todo el material publicado (Daizenshuu 7, Super Exciting Guide). El dataset distingue esto con un campo `altura_fuente`: 25 personajes `canonica`, 50 `estimada`.

### Cuántas imágenes hacen falta

| | Cantidad |
|---|---|
| Imágenes base (1 por personaje, obligatoria: alimenta Silueta y Splash-zoom) | 76 |
| Formas listadas para Splash-zoom | 95 |
| **Total teórico** | **171** |

**Recorte para el MVP:** el Splash-zoom no necesita las 93 formas. Con **máximo 3 formas por personaje** (las más reconocibles) el total baja a **~130**, y el segundo paso del modo sigue funcionando: la lista de opciones puede ser completa aunque solo algunas formas tengan imagen.

De esas, la API cubre 42 bases y ~43 formas (estas últimas requieren mapeo manual: los nombres de la API no coinciden con los del dataset). **Quedan ~83 imágenes por conseguir a mano.**

> **Precisión sobre lo que hay hoy (2026-08-02).** El dataset guarda un solo campo de imagen, `imagen_base`, y **ninguna URL de forma**: las ~43 que la API podría aportar no están capturadas. Lo concreto en disco son 42 bases con URL y 34 sin. Las 95 formas listadas son nombres, no imágenes. El panel del creador (§8) muestra el conteo en vivo, así que estos números no hay que mantenerlos a mano.

### Las siluetas programáticas: dos problemas reales

La idea de generar la silueta desde la imagen base sigue en pie, pero **no está verificada** — no se pudo inspeccionar ni un archivo de imagen. Hay evidencia indirecta de canal alfa (varios nombres terminan en `-removebg-preview.webp`, que es salida literal de remove.bg), pero:

1. **El pipeline no puede ser uniforme.** Las imágenes son un mosaico de orígenes distintos, así que habrá una fracción con fondo opaco que hay que recortar a mano. No es "un script y listo".
2. **Las auras rompen la silueta.** Al menos cuatro archivos traen efectos alrededor del personaje, y uno lo dice en el nombre (`..._con_aura_by_...`). Una máscara de alfa sobre eso no da la silueta del personaje, da una mancha con forma de llama. Esas imágenes hay que reemplazarlas.

**Mitigación:** al importar, chequear automáticamente si la imagen tiene canal alfa y si el alfa cubre >60 % del lienzo (síntoma de aura o fondo pegado); si falla, marcarla para revisión manual. La imagen base del modo Silueta puede ser distinta de la del Splash-zoom.

### Nota de copyright (leer antes de avanzar)

Las imágenes y el material oficial son propiedad de Toei Animation / Bird Studio / Shueisha. Un proyecto de fans como este opera en zona gris legal, sin licencia oficial — el mismo terreno en el que operan Loldle, NarutoDle, etc. respecto a Riot, Toei y demás. Recomendaciones a tener en cuenta antes de publicar:

- Tratar el proyecto explícitamente como no comercial / fan project, con disclaimer visible.
- Estar preparado para reemplazar o retirar assets si Toei/Shueisha lo solicitan.
- **Minimizar el arte externo:** generar la silueta programáticamente a partir de una sola imagen base por personaje, en vez de buscar una silueta ya hecha.

**Riesgo adicional que apareció al validar las fuentes:** varias imágenes de la API tienen nombres con el patrón `by_<usuario>_<id>`, que es de **DeviantArt**. No son capturas de Toei: son obras derivadas de artistas individuales identificables, re-hospedadas sin crédito. Un artista particular es mucho más propenso a mandar un aviso de retirada que Toei, y tiene un reclamo más limpio. **Regla: no usar ninguna imagen cuyo nombre contenga `by_<algo>`.**

---

## 6. Stack técnico

**Decidido 2026-08-02.** Cierra el pendiente que §2.4 dejó abierto a propósito.

### Decisión

**Next.js para todo en la v1**, con el motor `dle-engine` en TypeScript. Monorepo con workspaces de pnpm. **.NET entra después**, como servicio aparte, cuando aparezca estado de servidor que lo justifique (cuentas de usuario, leaderboards globales, estadísticas agregadas).

### Por qué

El backend real de la v1 es **un puñado de endpoints y cero base de datos**: validar un intento y devolver la comparación, y servir personajes e imágenes. Las rachas y estadísticas caben en `localStorage`.

> Al construirlo quedó en **un solo endpoint**, no tres: la lista de personajes y las cabeceras de las columnas las pasa el Server Component como props, así que no necesitan endpoint propio. Los otros aparecerán con los modos que faltan (siluetas y recortes servidos ya generados).

Con esa superficie, el factor decisivo es que **la comparación tiene que correr en el servidor** (si el objetivo del día se calcula en el cliente, se lee el JS y el juego se rompe). Eso significa que el lenguaje del motor le fija el lenguaje al backend. En TypeScript el mismo motor sirve en el servidor para validar y en el cliente para el autocompletado; en C# habría que elegir uno de los dos o duplicarlo.

Lo demás refuerza: SSG/ISR calza con contenido que rota una vez al día, `next/image` resuelve gratis el problema más pesado del proyecto (imágenes, siluetas y recortes con zoom), y un solo toolchain encaja con el monorepo de §2.4.

### Por qué no las alternativas

**Vite + .NET** quedó descartada: pierde SSR/SSG, y en este género la gente llega por búsqueda orgánica. Además obliga a construir a mano el pipeline de imágenes.

**Next + .NET desde el día uno** es defendible pero prematuro: dos runtimes, dos deploys, CORS, y DTOs duplicados en TS y C# que exigen OpenAPI + codegen desde el principio — todo para 3 endpoints.

### Route Handlers (REST), no Server Actions

**Decidido 2026-08-02.** La lógica del juego se expone como un endpoint REST (`POST /api/intento`), no como Server Action.

**Por qué:** es el mismo argumento de reversibilidad de acá abajo. El plan explícito es que estos endpoints migren a .NET; un Route Handler es un contrato HTTP que se muda cambiando la URL base, mientras que una Server Action es RPC atado al runtime de React y habría que reescribirla. De paso: se prueba con `curl` sin levantar React, y las respuestas llevan sus propias cabeceras de caché (el intento va `no-store`; la lista de personajes es estática y se prerenderiza).

**Costo aceptado:** hay que serializar y validar el cuerpo a mano — unas 10 líneas en `route.ts`. Con un solo endpoint no justifica traer una librería de validación.

### Reversibilidad

Mismo criterio que §2.4: se empieza por lo que se puede deshacer. Extraer 3 endpoints a un servicio .NET más adelante es trabajo de un fin de semana; desarmar dos runtimes montados desde el día uno, no. Cuando .NET entre, Next se queda como front y BFF.

### Idioma

**Solo español (doblaje latino) en la v1.** Los -dle establecidos (Loldle, NarutoDle) están en inglés, así que hay hueco real, y la comunidad hispana de Dragon Ball es enorme. Consecuencia directa: las citas del modo Frase se toman del **doblaje latino**, no del japonés ni del inglés — el jugador latino reconoce "más de 8.000", no el "over 9000" del doblaje inglés.

---

## 7. Estado del dataset y trabajo pendiente

El dataset vive en `data/`. **`personajes.json` es generado, no fuente**: se produce con `python3 data/build_dataset.py`, que además corre el validador. Si hay que cambiar datos, se edita el script, no el JSON.

### Qué hay hoy

76 personajes con los 13 campos poblados, taxonomías cerradas (`data/taxonomias.md`), y el orden ordinal de 41 obras y sagas (`data/debut-orden.md`). Última validación (2026-08-02): **0 colisiones de unicidad**, 0 errores de taxonomía, 0 alias ambiguos.

### Decisiones de contenido cerradas el 2026-08-02

| Tema | Decisión |
|---|---|
| Granularidad de `debut` | **Partido por sagas**, no por obra. Con obras completas el 83 % del roster caía en 3 valores (DBZ 32, DB 17, Super 13) y la flecha ordinal casi no aportaba señal. Ya implementado: el balde más grande bajó de 32 a 11 |
| Broly | **Dos entradas separadas**: `broly-legendario` (1993, dimensión alterna, `muerto`) y `broly-super` (2018, versión de Toriyama, continuidad principal, `vivo`). Oficialmente son personajes distintos |
| Nombre del balde de razas consolidadas | **`Otra especie`**, no `Alienígena`. El nombre viejo era engañoso: los Saiyans, Namekianos y la Raza de Freezer también son alienígenas, así que el jugador se preguntaría por qué Goku no lo lleva |
| Universo de Goku Black y Zamasu | **Universo 10 para ambos.** Son la misma entidad, así que comparten valor |
| `estado` es binario | **Vivo o muerto, sin `revivido`.** El tercer valor tenía 29 personajes contra 21 `vivo` puros: en Dragon Ball morir y volver es lo normal, así que la casilla casi no descartaba y el jugador tenía que acordarse de cuál de los dos verdes le tocaba. Quien murió y volvió pasó a `vivo`, que es lo que es al final de su participación — no se introduce ningún dato falso, solo se pierde granularidad. Quedó 50/26, el reparto más parejo de todas las categorías exactas |
| Casos finos de `estado` | Se quedan como están: Kami `vivo` (fusión permanente ≠ muerte), Kaio del Norte `muerto`, Majin Buu `muerto` (Kid Buu destruido). Los 14 terrícolas del arco de Buu son `vivo` por el deseo a Porunga. Los criterios completos siguen en `data/taxonomias.md` §4: con dos valores hacen igual de falta, porque son los que deciden si el que murió cuenta como vivo o como muerto |
| Roster | **76 personajes.** Quedan fuera a propósito los de Daima (canon pero aún irreconocibles), Shenron, los Kaios secundarios, y las Fuerzas Ginyu salvo el Capitán |
| Títulos de películas | Se aceptan las etiquetas actuales sin verificar el doblaje. El jugador nunca las teclea, solo las ve como valor de categoría |
| Pares que solo difieren en altura | Aceptados. Hoy son 7 grupos: krilin/yamcha, ten-shin-han/chaoz, oolong/puar, raditz/nappa, caulifla/kale/kefla, androide-16/androide-19, goten/gotenks. **Partir `debut` por sagas NO los separó** — cada par debuta en la misma saga. Siguen distinguiéndose solo por la flecha de altura. Eran 5 con 10 columnas y 3 valores de estado; los dos recortes de columnas sumaron dos grupos, que es el precio conocido de haber simplificado la tabla |

### Verificación de razas (2026-08-02)

Se cotejaron los 7 casos dudosos contra Dragon Ball Wiki. **Ningún valor cambió**, pero se confirmaron tres errores de la API: Zarbon y Dodoria no son de la especie de Freezer, y Toppo no es una deidad (su candidatura a Dios de la Destrucción es posterior y en el dataset vive como transformación, no como raza).

Bojack, Tapion y Baby sí tienen especie canónica con nombre propio (Clan Hera, Konatsiano, tsufur/Machine Mutant), pero cada una con un solo portador en el roster, así que se quedan en el balde consolidado. Detalle en `data/taxonomias.md` §1.

Único caso sin resolver: **Dyspo**, cuya raza no está confirmada en canon. No está en el roster; si se agrega, dejar la raza marcada como no verificada.

### Asignaciones de saga que conviene que un fan revise

Cinco de las 62 reasignaciones se decidieron por criterio y son las más fáciles de discutir: `bardock` (flashback en la saga vs. su especial propio), `rey-cold` (frontera entre Freezer y Androides), `mr-satan` (debuta en los Juegos de Cell, no en Buu), `launch` y `zeno`. Están en `data/debut-orden.md` §5 con el razonamiento de cada una.

### Pendiente manual de Hobar

Las citas y las imágenes son trabajo humano y están desacopladas del código — ver `data/TAREAS-HOBAR.md`. No bloquean el desarrollo: el motor puede elegir el objetivo del modo Frase solo entre personajes con `cita_estado: "verificada"`.

### Validador en CI

Hecho. `packages/dragonballdle-data/src/datos.test.ts` corre la regla de unicidad —y ocho chequeos más: ids repetidos, alias ambiguos, valores fuera de taxonomía, `debut_indice` desincronizado, citas inventadas, y que las columnas del Clásico sean exactamente las de `COMPARABLES`— sobre el JSON generado. `data/build_dataset.py` sigue siendo quien produce el dataset; el test es la red que impide que un dataset con dos respuestas correctas llegue a producción.

---

## 8. El código

### Estructura

```
packages/dle-engine/src/
  tipos.ts        contratos: Categoria, Entidad, Celda, Resultado
  comparar.ts     un intento vs. el objetivo → una celda por categoría
  objetivo.ts     elección determinística del objetivo del día
  buscar.ts       autocompletado por nombre y alias, sin tildes
  validar.ts      regla de unicidad y alias ambiguos (genéricas)
  index.ts        superficie pública del paquete
  motor.test.ts   el motor sobre una franquicia de juguete

packages/dragonballdle-data/src/
  personaje.ts    el tipo Personaje, espejo de build_dataset.py
  index.ts        carga data/personajes.json y declara las categorías
  datos.test.ts   unicidad y taxonomías sobre el dataset real

apps/dragonballdle/
  .env.development.local   OBJETIVO_DEV: fija el objetivo para probar (solo dev)

apps/dragonballdle/src/
  juego/reto.ts    ÚNICO módulo que conoce el objetivo del día
  juego/tipos.ts   lo que cruza de servidor a cliente
  juego/*.tsx      UI: Juego (estado), Buscador, Tabla, Miniatura, Modos
  images/          logo y fondo (import estático, los sirve next/image)
  app/api/intento/route.ts   POST {id} → comparación
  app/page.tsx     Server Component: pasa opciones y columnas al cliente
  app/globals.css  Tailwind v4: las dos paletas, las piezas y las animaciones
  app/panel/       panel del creador, solo en desarrollo (ver abajo)
```

`data/personajes.json` se importa desde la raíz en vez de copiarse al paquete: es salida de `build_dataset.py` y tiene que existir una sola copia.

Los paquetes se publican como TypeScript sin compilar (`main` apunta a `src/index.ts`) y Next los transpila con `transpilePackages`. No hay paso de build intermedio ni `dist/` que se desincronice.

### El panel del creador (`/panel`)

Herramienta para curar el dataset, no parte del juego. Muestra los 76 personajes con todos sus campos, las imágenes cargadas desde su URL real, y qué tan confiable es cada dato: altura canónica vs. estimada, cita pendiente, saga asignada por criterio, raza en el balde consolidado, y las notas del curador. Filtra, busca, ordena, y da listas copiables de lo que falta.

Las reglas de confianza están en `panel/auditoria.ts`, cada una citando de dónde sale (README §5, `debut-orden.md` §5, …). Si una regla se discute, se discute ahí.

**Solo existe en desarrollo, y eso hay que sostenerlo con cuidado.** Publicar la tabla completa de atributos rompe el juego: con ella a mano, un intento basta para deducir el objetivo del día por eliminación.

El primer intento fue un `if (NODE_ENV === "production") notFound()` dentro del componente. **No alcanza:** la ruta devuelve 404, pero el panel igual se compila y queda en un chunk de cliente descargable — se verificó y ahí estaban `altura_fuente`, `cita_estado`, `DeviantArt` y el valor `Otra especie`. Lo que sí funciona es sacarlo del build por extensión: el archivo se llama `page.dev.tsx` y `next.config.ts` solo declara `dev.tsx` como extensión de página cuando la fase es `PHASE_DEVELOPMENT_SERVER`. En producción la ruta no existe y no hay código que descargar.

> **Lección general:** un guard en tiempo de ejecución no saca nada del bundle. Para que algo no llegue al cliente hay que impedir que se compile.

### El aspecto: por qué la primera versión se veía apagada

**Decidido 2026-08-02**, comparando contra NarutoDle. La pregunta era por qué el referente se ve más vivo, y la respuesta no era una sola cosa:

| Factor | Cuánto pesaba | Qué se hizo |
|---|---|---|
| **Fondo** | Lo que más. NarutoDle tiene una ilustración a sangre con personajes; acá había un `#0a0e1a` plano. Un color plano no compite con una ilustración por más que se afine la tipografía | `background.png` fijo a pantalla completa con `next/image`, con un velo mínimo (`from-black/25 … to-black/45`). El velo es a propósito flojo: oscurecerlo apaga justo lo que aporta |
| **Superficie clara sobre fondo vivo** | Mucho. El contraste del género no lo da el color del texto sino la **tarjeta clara** apoyada sobre la foto | Paleta nueva `crema / tinta / sepia / madera` para todo el juego. El texto suelto (leyenda, footer, contador) va en píldoras `bg-black/45` |
| **Saturación de los estados** | Bastante. Verde `#2f9e5c` y rojo `#a63a3a` estaban apagados para no cansar sobre fondo oscuro, y sobre fondo claro se veían sucios | `#37b355 / #e79c14 / #d8443a`, y las celdas pasaron a leerse como **ficha** de juego: brillo arriba, sombra abajo, sombra proyectada (`.ficha`) |
| **Tipografía** | Real pero menor. Todo iba en la sans del sistema | Baloo 2 (display, del mismo registro redondo que el logo) + Nunito (prosa), vía `next/font` |
| **Logo** | Real. El título era `<h1>` con texto | El PNG de la marca, en su propia tarjeta |
| **Cantidad de contenido** | Real. NarutoDle llena la cabecera con selector de modos, estadísticas y contador de aciertos | Fila de modos (`Modos.tsx`) y leyenda visible desde el arranque. Estadísticas y contador **no**: no hay backend ni `localStorage` todavía y serían datos inventados |
| **Tamaño** | Menor de lo que parece. Las celdas sí crecieron, pero por el peso visual de la ficha, no por los píxeles | Celda de 6 → 6.6 rem y 3.5 → 4.5 rem de alto |

### Cómo el motor no sabe de Dragon Ball

Una categoría no dice *qué campo* leer sino *cómo obtener su valor*: trae funciones `valor(entidad)` y, si es ordinal, `orden(entidad)`. El motor nunca indexa un campo por nombre, así que no hay un solo string de la franquicia en `dle-engine` — ni siquiera los nombres de las columnas.

Eso resuelve además el caso del debut, donde lo que se muestra y lo que se compara son cosas distintas: `valor` devuelve `"Dragon Ball Z – Saga de los Saiyajin"` y `orden` devuelve `7`.

### Cómo se sostiene la regla de seguridad

El objetivo del día vive solo en `juego/reto.ts`, que empieza con `import "server-only"`: si algún componente de cliente lo importa, el build falla. El cliente recibe únicamente `{id, nombre, alias}` de cada personaje para el autocompletado, y los valores del *intento* que él mismo mandó — `Celda.valores` nunca lleva valores del objetivo, y hay un test del motor que lo comprueba.

**Verificado sobre el build de producción (2026-08-02).** Se buscaron los 81 valores de taxonomía en los 14 archivos que el navegador puede descargar: HTML prerenderizado + **todo** `.next/static` (10 chunks de JS y 1 de CSS). De los 75 valores que existen **solo** como atributo y nunca como nombre de personaje, no aparece ninguno como texto. Los que sí aparecen son substrings de nombres que el autocompletado necesita (`Majin` dentro de `Majin Buu`, `Androide` dentro de `Androide 18`) y las `clave` de las columnas (`raza`, `altura_cm`…), que son cabeceras de tabla sin valores.

**El scan tiene que incluir los chunks, no solo el HTML.** La primera versión filtraba por `\static\` con backslash pero armaba las rutas con `/`, así que miraba 4 archivos en vez de 14 y daba limpio de mentira. Fue lo que ocultó por un rato la fuga del panel.

**Re-verificado tras el rediseño visual (2026-08-02).** El build limpio expone 15 archivos descargables. De los 82 valores de taxonomía, 76 existen solo como atributo y **ninguno** aparece; tampoco los rastros del panel (`altura_fuente`, `cita_estado`, `imagen_fuente`, `DeviantArt`). Se corre así:

```bash
pnpm build   # y después el scan sobre .next/static + .next/server/app/*.html
```

Vale repetirlo cada vez que se le agregue texto a la página: el riesgo real no es que se filtre el objetivo, es que un copy nuevo mencione un valor de categoría.

**Una filtración menor, conocida y aceptada.** Desde que el autocompletado muestra miniaturas, las URLs de imagen viajan al cliente. Tres de ellas codifican un atributo en el nombre del archivo: `Krilin_Universo7.webp`, `Tenshinhan_Universo7.webp` y `BuuGordo_Universo7.webp` revelan el `universo` de esos tres personajes. No mueve la aguja —70 de los 76 son Universo 7, es el valor por defecto— y no acerca a nadie al objetivo del día. Se resuelve solo cuando las imágenes pasen a `data/img/base/<id>.webp`, donde el nombre del archivo es únicamente el id. **Criterio para las imágenes que consigas a mano: el nombre del archivo no debe decir nada del personaje más que su id.**

**La escotilla de desarrollo.** `OBJETIVO_DEV=<id>` fija el objetivo del día para poder probar el flujo de victoria sin acertar de casualidad. Se edita en **`apps/dragonballdle/.env.development.local`**, que es el único lugar donde hay que tocarla:

```bash
OBJETIVO_DEV=goku    # el id del dataset, no el nombre
```

Ese nombre de archivo hace tres cosas a la vez: Next lo carga solo cuando `NODE_ENV` es `development` (`pnpm build` y `pnpm start` no lo miran), el `.gitignore` de la raíz ya excluye `.env*.local`, y queda dentro de la app y no en la raíz del monorepo. Se lee al arrancar el servidor, así que después de editarlo hay que reiniciar `pnpm dev`.

No abre ningún agujero, y esta vez el guard en tiempo de ejecución **sí** alcanza —al contrario que el caso del panel— por dos razones distintas: la comparación es contra `process.env.NODE_ENV`, que Next reemplaza al compilar, así que la rama entera desaparece del build (verificado: 0 apariciones de `OBJETIVO_DEV` en `.next/server`); y aunque quedara, vive en `reto.ts`, que es `server-only`. Probado sobre el build de producción **con el archivo en disco**: el objetivo sigue siendo el del día. **No cambiar la `SEMILLA` para probar** — eso reordena todo el histórico.

Lo que este diseño **no** impide es que alguien mande los 76 ids al endpoint y deduzca el objetivo. Es el modelo de amenaza aceptado: cuesta 76 requests al servidor y no se puede hacer leyendo el bundle. Si algún día molesta, se limita por tasa.

### Comandos

```bash
pnpm install
pnpm dev         # http://localhost:3000  ·  panel en /panel
pnpm test        # motor (20 tests) + validación del dataset (9)
pnpm typecheck   # los tres paquetes
pnpm build
pnpm start       # sirve el build de producción
pnpm datos       # regenera data/personajes.json (corre build_dataset.py)
```

Para probar la victoria sin adivinar, fijá `OBJETIVO_DEV` en `apps/dragonballdle/.env.development.local` y reiniciá `pnpm dev`. Solo funciona en desarrollo — ver la escotilla más arriba.

El endpoint se prueba sin levantar React, que es media razón por la que es REST:

```bash
curl -X POST localhost:3000/api/intento -H "Content-Type: application/json" -d '{"id":"goku"}'
```

### Decisiones chicas que conviene saber

| Tema | Decisión |
|---|---|
| Reset diario | `America/Bogota`, constante `ZONA` en `reto.ts` |
| Cómo se elige el objetivo | Se baraja el roster una vez por vuelta con semilla determinística y se recorre en orden, en vez de `hash(fecha) % n`. Así no se repite un personaje hasta agotar los 76 |
| Semilla | `dragonballdle:clasico:v1`. Cada modo lleva la suya, así el mismo día no da el mismo personaje en los cuatro modos. Cambiarla reordena todo el histórico |
| Época del calendario | `2026-01-01` (constante `EPOCA` en `objetivo.ts`) |
| Generador pseudoaleatorio | FNV-1a para hashear la semilla + mulberry32 para barajar. Se comprobó que no sesga: χ² = 74.3 sobre 75 grados de libertad para la posición de un personaje en 20.000 vueltas (el crítico al 5 % es 96.2) |
| Orden de las columnas | Definido en `categoriasClasico`. Tiene que coincidir con `COMPARABLES` de `build_dataset.py` — es la lista sobre la que se valida la unicidad, y un test lo verifica. Vale en los dos sentidos: agregar una columna sin agregarla allá valida de menos, sacarla sin sacarla allá valida de más |
| Cuántas columnas | 8. Se sacaron `es_fusion` y `rol_narrativo` (§4): con 10 la fila era tan ancha que ninguna pantalla la mostraba entera, y esas dos eran las que menos descartaban |
| Debut abreviado | El accessor `valor` de la categoría devuelve `DBZ · Majin Buu` en vez del nombre completo de 54 caracteres. Un valor así se envolvía en seis renglones y estiraba toda la fila. Solo cambia el texto visible: el orden lo da `debut_indice` y la firma de unicidad usa ese índice, no la cadena. Se comprobó que las 22 abreviaturas siguen siendo distintas entre sí |
| La cara en la tabla de intentos | La saca `Juego` del mismo `opciones` que alimenta al buscador, indexado por id, y se la pasa a `Tabla`. No la manda el servidor en cada `Resultado`: sería repetir en cada respuesta algo que el cliente ya tiene, y obligaría a meter un campo de presentación en el tipo `Resultado` del motor |
| El tipo `booleano` | Se compara igual que `exacto`; existe solo para que la UI lo dibuje como sí/no. El accessor devuelve el texto ya armado, así el motor no carga con un idioma |
| El input nunca se deshabilita | Ni siquiera mientras se envía un intento. El navegador le quita el foco a un campo deshabilitado y **no se lo devuelve**, así que había que hacer clic entre intento e intento. El doble envío lo corta la guarda de `intentar()`, no el atributo `disabled` |
| Ritmo del revelado | `RETRASO_CELDA` (200 ms) y `DURACION_REVELADO` (620 ms) en `Tabla.tsx`, acopladas a mano con `.revelar` de `globals.css`. Si cambiás una, cambiá la otra: el cartel de victoria espera esa duración para no adelantar el resultado, y el anillo de `.destello` arranca a 460 ms, que es el fotograma donde el color termina de encenderse. La cara del personaje entra primero y las 8 celdas van detrás, así que una fila tarda **2,2 s** en descubrirse entera |
| La sacudida del acierto | `.sacudir` en la fila que acertó, con el retraso puesto en `duracionFila()`: el golpe cae cuando la fila terminó de revelarse, o sea en el mismo instante en que aparece el cartel de victoria. Va **sin `fill-mode`** a propósito — la fila contiene la columna `sticky` del personaje y un `transform` que quedara pegado al final le cambiaría el bloque contenedor; como el fotograma 0 % ya es "sin transform", no hace falta relleno |
| Por qué el retraso va en `--retraso` y no en `animation-delay` | Los aciertos llevan **dos** animaciones (el volteo y el anillo de `.destello`, que arranca 380 ms después) y un `animation-delay` inline se aplicaría igual a las dos. Con la custom property, el segundo deriva el suyo con `calc()` |
| `animation` y `box-shadow` son atajos | Dos clases que escriban `animation` se pisan y gana la última del archivo, no la del `className`. Por eso el cartel de victoria es **una** clase (`.cartel-victoria`) con las dos animaciones en una declaración, y por eso el latido repite la sombra de `.tarjeta` en sus fotogramas: una `box-shadow` animada reemplaza la de la clase, no se suma |
| Anchos de la tabla | En custom properties (`--col-nombre`, `--col-celda` en `.tablero`) y no en el `style` inline que arma `Tabla.tsx`: así el móvil usa columnas más angostas, que es lo que un valor calculado en JS no puede hacer. 6.6 rem es el ancho más grande que no fuerza scroll en escritorio |
| Cabeceras en caja mixta | Sin `uppercase` ni `tracking`: "Transformaciones" en versales espaciadas no entra en la columna, y al partirse queda "TRANSFORMAC / IONES" — es una sola palabra, no hay dónde cortar, y el diccionario de guionado del español no está garantizado en todos los navegadores |
| Columna del personaje pegada | `sticky left-0` con fondo opaco, y con cabecera propia ("Personaje") justamente porque es la pieza que tapa a las demás cuando pasan por debajo. En móvil son 9 columnas con scroll horizontal: sin esto se pierde de vista de qué personaje es la fila |
| Contraste de las fichas | Blanco sobre los tres colores de estado da entre 2,5:1 y 3:1, por debajo del 4,5:1 de WCAG AA. Es la convención del género (el verde de Wordle con blanco da 2,9:1) y lo que compensa es la negrita más la sombra de texto de `.ficha`. Bajarlos a 4,5:1 los deja casi grises: el trueque es consciente |
| El logo se mezcla con `multiply` | `dragonballdle.png` viene en RGB **sin canal alfa**, o sea con fondo blanco opaco, así que sobre el paisaje sería un rectángulo blanco. `mix-blend-multiply` sobre la tarjeta crema lo resuelve sin tocar el archivo (blanco × crema = crema) y el `isolate` de la tarjeta evita que el multiply se coma también el fondo. Los márgenes negativos en % recortan el aire del PNG (30 % arriba, 25 % abajo). Todo esto se cae solo si algún día el logo se exporta con transparencia y recortado |
| Dos paletas en `globals.css` | La clara es del juego; la oscura (`fondo`, `panel`, `borde`, `texto`, `tenue`) quedó intacta porque es la del panel del creador, que es una herramienta de datos y se lee mejor en oscuro. El fondo ilustrado lo monta `page.tsx`, no el layout, para que el panel no lo herede |
| La fila de modos no navega | Solo existe el Clásico. Los otros tres se dibujan apagados y con candado: le dicen al jugador que el juego es más grande que la tabla, y el día que existan no hay que rediseñar la cabecera. Son `<span>`, no `<button>` — un botón que no hace nada es peor que un cartel que dice "pronto" |
| Miniaturas | Componente `Miniatura.tsx`, compartido por el buscador y la tabla; solo cambia el tamaño y la forma que le pasa cada uno. `<img>` y no `next/image`: son URLs remotas que van a desaparecer cuando las imágenes pasen a `data/img/`, y varias pueden estar caídas — con `<img>` una URL rota cae en la inicial del nombre en vez de reventar el optimizador. Hoy 34 de 76 personajes no tienen imagen y muestran la inicial |
| Estilos | Tailwind v4. La paleta está en `@theme` dentro de `globals.css`; no hay `tailwind.config` |
| Tipado de las taxonomías | `raza`, `estado`, etc. se tipan como `string`, no como uniones literales. La lista permitida vive en el JSON generado y `datos.test.ts` la valida en runtime; repetirla en TS sería una segunda fuente de verdad que se desincroniza |

### Pendiente inmediato

- **La partida no sobrevive a un refresh.** Los intentos viven en estado de React. Falta persistir en `localStorage` con la fecha como clave, que es también donde van las rachas (§6).
- **No hay límite de intentos ni revelación del objetivo al perder.** Hoy se puede seguir adivinando indefinidamente.
- **No hay cuenta regresiva al próximo reto** ni nada que le avise al jugador que el día cambió mientras tenía la pestaña abierta.
- **La tabla en celular sigue siendo scroll horizontal.** Son 9 columnas (personaje + 8 atributos). Mejoró con el rediseño —columnas más angostas por CSS y la del personaje pegada a la izquierda, así no se pierde de vista de quién es la fila— pero en pantalla chica no se ven las 8 categorías a la vez. Si molesta, la salida es una vista apilada (una tarjeta por intento) en vez de la grilla.
- **El logo no tiene canal alfa.** Hoy se resuelve con `mix-blend-multiply` sobre una tarjeta crema (§8). Con un PNG transparente y recortado se podría poner suelto sobre el paisaje, que se ve mejor.
- Los tres modos restantes, bloqueados por imágenes y citas (§7).
