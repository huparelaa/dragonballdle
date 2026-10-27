# Taxonomías cerradas (v1)

Resuelve el pendiente §6.1 del README. Estas listas son **cerradas**: si un personaje nuevo no encaja en un valor existente, primero se discute si se agrega el valor — no se escribe un valor libre.

El validador (`build_dataset.py`, ver §7) falla si aparece un valor fuera de estas listas.

Cada taxonomía trae su **criterio de asignación** para que agregar personajes sea mecánico y no una discusión nueva cada vez.

Convención de mayúsculas: los valores que se muestran al jugador (raza, afiliación, universo, debut) van capitalizados y acentuados. Los valores que son enum interno (género, rol, estado, `altura_fuente`) van en minúscula sin acento.

---

## 1. `raza` — multivalor (11 valores)

```
Saiyan
Humano
Namekiano
Androide
Majin
Raza de Freezer
Deidad
Ángel
Demonio
Otra especie
Animal antropomorfo
```

**Por qué 11 y no 40.** La `List_of_Races` de la wiki tiene decenas de razas con un solo miembro (raza de Zarbon, raza de Jiren, raza de Hit, Hera, Tsufur, Konatsiano...). Una raza con un miembro no da señal de juego: nunca pinta amarillo, solo verde en el propio personaje o rojo. Se consolidaron todas esas en `Otra especie`. **El nombre importa:** se descartó `Alienígena` porque es engañoso — los Saiyans, Namekianos y la Raza de Freezer también son alienígenas, así que el jugador se preguntaría por qué Goku no lleva ese valor. `Otra especie` dice lo que realmente significa: una especie sin más representantes en el juego. La regla es: **una raza existe como valor propio solo si tiene ≥2 personajes en el roster y el jugador la reconoce como categoría** (un fan sabe qué es un namekiano; no sabe qué es un "hera-seijin").

**Criterio de asignación**

| Situación | Regla |
|---|---|
| Híbridos | Llevan todos sus componentes. Gohan / Goten / Trunks / Pan = `Saiyan` + `Humano`. Esto es lo que hace útil el tipo multivalor (amarillo). |
| Androides construidos desde cero | `Androide` solo (16, 19, Cell, 13). |
| Humanos modificados en androide/cyborg | `Humano` + `Androide` (17, 18, Dr. Gero, Tao Pai Pai). Es canon y da amarillo contra los androides puros. |
| Raza de Freezer | Valor propio (`Raza de Freezer`) porque tiene 4 miembros en el roster (Freezer, Cooler, Rey Cold, Frost) y el jugador la percibe como grupo. |
| Kaios, Kaio-shins, Dioses de la Destrucción, Zeno | Todos `Deidad`. Son razas distintas en la wiki (Núcleos/Shinjin, raza de Beerus, desconocida) pero para el juego funcionan como un bloque. |
| Ángeles (Whis, Vados, Gran Sacerdote, Marcarita) | `Ángel`, separado de `Deidad`, porque es un grupo reconocible con jerarquía propia. |
| Demonios (Dabura, Janemba, Garlic Jr., y el Reino Demoníaco de Daima) | `Demonio`. |
| Familia Majin (Buu, Babidi, Bibidi, Glorio) | `Majin`. |
| Especies de un solo miembro | `Otra especie`. Aplica a Zarbon, Dodoria, Ginyu, Bojack, Hit, Jiren, Toppo, Baby, Tapion. Verificado el 2026-08-02 (ver abajo). |
| Animales parlantes / antropomorfos | `Animal antropomorfo` (Oolong, Puar, Korin). |
| Fusiones | Heredan la unión de las razas de sus componentes. Gogeta/Vegetto = `Saiyan`. Gotenks = `Saiyan` + `Humano`. Kefla = `Saiyan`. |
| Goku Black | `Saiyan` + `Deidad` — es un Kaio-shin en un cuerpo saiyan. Criterio propio; universo decidido en README §7 (U10). |

### Verificación del 2026-08-02

Se cotejaron contra Dragon Ball Wiki los 7 casos dudosos. Resultado: **ningún cambio de valor, pero dos errores de la API confirmados.**

| Personaje | Especie canónica | Verificado | Decisión |
|---|---|---|---|
| Bojack | Clan Hera / Herā-seijin, planeta Hera | ✅ sí | Queda `Otra especie` — es el único del clan en el roster |
| Tapion | Konatsiano, planeta Konats | ✅ sí | Queda `Otra especie` — Minotia no está en el roster |
| Baby | Origen tsufur; forma actual Machine Mutant creado por el Dr. Myuu | ✅ sí (doble lectura) | Queda `Otra especie` — único en cualquiera de las dos lecturas |
| Zarbon | Especie **sin nombre oficial**, distinta de la de Freezer | ✅ sí | Queda `Otra especie`. **La API se equivoca** al marcarlo "Frieza Race" |
| Dodoria | Especie sin nombre oficial, distinta de la de Freezer y de la de Zarbon | ⚠️ parcial (solo snippet de búsqueda) | Queda `Otra especie`. **La API se equivoca** al marcarlo "Frieza Race" |
| Toppo | Alienígena humanoide **mortal** del Universo 11 | ✅ sí | Queda `Otra especie`. **La API se equivoca** al marcarlo "God": su condición de Dios de la Destrucción es una candidatura posterior, no su especie — y en el dataset ya vive como transformación, no como raza |
| Dyspo | Sin raza confirmada en canon | ❌ no verificado | No está en el roster. Si se agrega, tratarlo como Toppo y dejar la raza marcada como no verificada |

**Conclusión:** la barra de "≥2 personajes en el roster" hizo su trabajo. Los tres candidatos a raza propia (Hera, Konatsiano, Tsufur) tienen nombre canónico real, pero un solo portador cada uno, así que crear el valor solo agregaría ruido.

---

## 2. `afiliacion_principal` — multivalor (18 valores)

```
Guerreros Z
Escuela Tortuga
Escuela de la Grulla
Corporación Cápsula
Deidades de la Tierra
Kaios y Kaio-shins
Dioses de la Destrucción
Ángeles
Clan Namekiano
Ejército Saiyan
Ejército de Freezer
Fuerzas Especiales Ginyu
Ejército del Listón Rojo
Androides del Dr. Gero
Familia Majin
Tropas del Orgullo
Equipo del Universo 6
Sin afiliación
```

**Sinónimos prohibidos.** El nombre canónico es el de la izquierda; lo de la derecha NO se escribe nunca:

| Canónico | No usar |
|---|---|
| Guerreros Z | Z Fighters, Z Warriors, Guerreros del Espacio |
| Escuela Tortuga | Kame House, Kame Sen'nin Ryu, Escuela de la Tortuga |
| Ejército de Freezer | Frieza Force, Army of Frieza, Fuerzas de Freezer |
| Ejército del Listón Rojo | Red Ribbon Army, Patrulla Roja, Cinta Roja |
| Tropas del Orgullo | Pride Troopers, Patrulla del Orgullo |
| Corporación Cápsula | Capsule Corp, CC |

**Criterio de asignación**

1. **Multivalor, no historial completo.** Se listan las afiliaciones que un jugador asociaría con el personaje, no cada grupo al que perteneció un episodio. Máximo 3 valores.
2. **Los cambios de bando relevantes sí se acumulan.** Vegeta = `Guerreros Z` + `Ejército Saiyan` + `Ejército de Freezer`: las tres son parte de su identidad y dan amarillo tanto contra Goku como contra Nappa. Androide 17/18 = `Androides del Dr. Gero` + `Ejército del Listón Rojo` (+ `Guerreros Z` para 18, que sí se integró).
3. **Jerarquías anidadas se escriben las dos.** Ginyu = `Ejército de Freezer` + `Fuerzas Especiales Ginyu`. Así el escuadrón sigue siendo distinguible pero comparte amarillo con el resto del ejército.
4. **Las escuelas de artes marciales cuentan como afiliación** y son buena señal: `Escuela Tortuga` (Goku, Krilin, Yamcha, Muten Roshi, Launch) vs `Escuela de la Grulla` (Ten Shin Han, Chaoz, Tao Pai Pai).
5. **Los androides derivados del Listón Rojo llevan las dos.** Todo lo creado por el Dr. Gero es `Androides del Dr. Gero` + `Ejército del Listón Rojo`, incluido Cell (creado por la computadora de Gero) — Cell lleva solo `Androides del Dr. Gero` porque nunca operó para el Listón Rojo.
6. **`Sin afiliación` no es "no sé".** Es el valor para villanos de película que actúan solos o con secuaces sin nombre de grupo (Garlic Jr., Turles, Lord Slug, Bojack, Janemba, Baby, Broly, Rey Piccolo, Mr. Satan, Tapion, Oolong, Puar). Si un personaje nuevo tiene grupo reconocible, se agrega el valor a la lista en vez de usar este.
7. **`Equipo del Universo 6`** cubre a los luchadores del U6 en el Torneo del Poder y el torneo entre universos (Hit, Cabba, Caulifla, Kale, Kefla, Frost). No se creó `Equipo del Universo 7` porque esos personajes ya están cubiertos por `Guerreros Z`.

---

## 3. `rol_narrativo` — 3 valores

```
protagonista
antagonista
secundario
```

> **Ya no es columna del modo Clásico** (README §4). El campo sigue en el dataset y se sigue validando contra esta lista, pero salió de la tabla: los criterios de abajo son razonables y aun así son *criterios*, y una casilla en rojo por un juicio nuestro sobre quién es "secundario" no es lo mismo que una en rojo por un dato del canon. Reservado para futuros modos.

**Definiciones**

- **protagonista** — figura central que sostiene al menos un arco completo *desde el bando protagónico*, con peso narrativo propio (no solo apoyo).
- **antagonista** — su función definitoria es ser el oponente central de al menos un arco o película.
- **secundario** — todo lo demás: aliados de apoyo, mentores, alivio cómico, deidades observadoras, secuaces y villanos menores.

**Regla para casos ambiguos (redención / cambio de bando)**

Se mira el **peso total de su participación canónica**, no el momento en que aparece:

1. Si fue antagonista central de un arco y después se integró al núcleo heroico **por más tiempo de serie del que fue villano** → `protagonista`. Aplica a **Vegeta** y **Piccolo**.
2. Si fue antagonista y después se volvió aliado, pero **de apoyo, no de núcleo** → `secundario`. Aplica a **Androide 17**, **Androide 18**, **Tao Pai Pai**.
3. Si el papel de villano domina su participación aunque después se aliara → `antagonista`. Aplica a **Freezer**, **Broly**, **Kefla**, **Frost**, **Caulifla**, **Kale**.
4. Deidades y observadores que son antagonistas de una sola película pero neutrales en el resto → `secundario`. Aplica a **Beerus** y **Whis** (antagonistas de *La batalla de los dioses*, pero mentores/neutrales en Super).
5. **Fusiones se evalúan por su propia participación, no por sus componentes.** Vegetto y Gogeta = `protagonista` (cargan el clímax de su arco/película desde el bando héroe). Gotenks = `secundario`. Kefla = `antagonista` (es la oponente).

**Reparto resultante en el roster v1:** 7 protagonistas (Goku, Vegeta, Gohan, Piccolo, Trunks del Futuro, Vegetto, Gogeta), 33 antagonistas, 35 secundarios.

---

## 4. `estado` — exacto (2 valores)

```
vivo
muerto
```

**Regla base del README:** el estado se toma **al final de su participación canónica**, no en un punto arbitrario de la trama. Esto evita que el dato dependa de por dónde va el jugador.

**Definiciones**

- **vivo** — su última aparición canónica lo muestra vivo. Da igual si murió antes y volvió.
- **muerto** — murió y no fue devuelto a la vida antes del final de su participación.

> **Por qué no hay un tercer valor.** Hasta el 2026-08-02 existía `revivido` para quien murió y volvió. Se eliminó: eran **29 personajes contra 21 `vivo` puros**, o sea que en Dragon Ball morir y volver es lo normal y no lo excepcional — la casilla casi no descartaba nada y obligaba al jugador a recordar cuál de los dos verdes le tocaba. Colapsarlo no introduce ningún dato falso: Goku *está* vivo al final de su participación. El reparto quedó **50 `vivo` / 26 `muerto`**, que es el más parejo de todas las categorías exactas.

**Reglas derivadas (las que resuelven el 90% de los casos)**

Siguen haciendo falta con dos valores: son las que deciden si alguien que murió cuenta como `vivo` o como `muerto`.

| Regla | Efecto |
|---|---|
| **R1 — Fusión permanente ≠ muerte.** El estado se toma del último momento en que el personaje existía por separado. | Kami = `vivo`, Nail = `vivo` (fundidos con Piccolo, no muertos). Las fusiones temporales (Gogeta, Vegetto, Gotenks, Kefla) = `vivo`. |
| **R2 — Muerte masiva del arco de Buu.** Kid Buu destruyó la Tierra y el deseo posterior a Porunga revivió a todos. Todo terrícola presente en ese arco vuelve, así que queda `vivo`. | Bulma, Chi-Chi, Krilin, Yamcha, Ten Shin Han, Chaoz, Goten, Trunks, Videl, Yajirobe, Oolong, Puar, Korin, Muten Roshi. |
| **R2-excepción** | Mr. Satan y Dende **no** murieron: fueron llevados al Planeta Sagrado antes de la destrucción. Con dos valores caen en el mismo `vivo` que el resto, pero la distinción se deja anotada porque es la que aplicaría si alguna vez se necesita el dato. |
| **R3 — Borrado en el Torneo del Poder + restauración con las Súper Esferas cuenta como volver.** | Champa, Vados, Frost, Hit, Cabba, Caulifla, Kale, Kefla, Jiren, Toppo = `vivo`. |
| **R4 — Si el personaje dejó de participar antes de la muerte masiva, se usa su propio último momento.** | Launch = `vivo` (su participación termina en DB / inicio de Z). |
| **R5 — Encierro o sellado no es muerte.** | Garlic Jr. = `vivo` (encerrado para siempre en la Zona Muerta). |
| **R6 — Identidades con mitad buena y mitad mala se resuelven por la identidad que da nombre a la entrada.** | Majin Buu = `muerto` (Kid Buu fue destruido); que Mr. Buu siga vivo se trata como forma, no como estado. |

Los casos que quedan con duda documentada (Kaio del Norte, Kami, Majin Buu, la aplicación en bloque de R2) se revisaron el 2026-08-02 y se confirmaron tal cual (README §7).

---

## 5. `universo` — exacto (5 valores)

```
Universo 6
Universo 7
Universo 10
Universo 11
Multiverso
```

**Criterio**

1. **Default `Universo 7`.** Todo lo de DB, Z, GT, Daima y el Universo principal de Super.
2. Los otros valores existen solo porque el **Torneo del Poder** y el arco de Zamasu los hicieron relevantes: U6 (Champa, Vados, Hit, Frost, Cabba, Caulifla, Kale, Kefla), U11 (Jiren, Toppo), U10 (Zamasu, Goku Black).
3. **`Multiverso`** para seres que están por encima de los universos: Zeno, y a futuro el Gran Sacerdote y Daishinkan.
4. **El Otro Mundo / Infierno no es un universo.** Janemba es `Universo 7` (el Otro Mundo del U7).
5. **Líneas temporales alternas no crean valores nuevos.** Trunks del Futuro es `Universo 7`; su condición de línea alterna va en `notas`.
6. **No se agregan U1–U12 completos.** Solo se añade un universo cuando entra un personaje de ese universo al roster.

---

## 6. `genero` — exacto (2 valores)

```
masculino
femenino
```

Valor `indefinido` **reservado, no usado en v1**. Todos los personajes del roster tienen género definido en canon, incluidos Majin Buu, Zeno, Whis y Androide 16 (masculinos). Si entra un personaje sin género canónico (algunos Kaio-shin, algunos ángeles), se activa `indefinido` en vez de adivinar.

---

## 7. Campos que no son taxonomía

| Campo | Tipo | Notas |
|---|---|---|
| `id` | slug | minúsculas, sin acentos, guiones. Es la clave estable: **no se cambia nunca** aunque cambie el nombre mostrado. |
| `alias` | lista | Variantes que un jugador teclearía: doblaje latino, doblaje español, romanización japonesa, apodos. El validador falla si un alias apunta a dos personajes distintos (rompería el autocompletado). |
| `debut` / `debut_indice` | ordinal | Ver `debut-orden.md`. `debut_indice` es el número que consume el motor; `debut` es la etiqueta que ve el jugador. |
| `tiene_transformaciones` | booleano | Debe ser `true` exactamente cuando `transformaciones` no está vacío. El validador lo comprueba. |
| `transformaciones` | lista | Nombres de formas para Splash-zoom. **Las técnicas no son formas**: Kamehameha, Cuatro Cuerpos, Cambio de Cuerpo de Ginyu y el Kai-Kai quedan fuera. El Kaio-Ken sí entra (cambia el aspecto visible). |
| `es_fusion` | booleano | Ya no es columna del Clásico (README §4); se mantiene en el dataset. `true` solo para fusiones reales por Potara o Danza de la Fusión: Gogeta, Vegetto, Gotenks, Kefla. Piccolo **no** es fusión (absorbió a Nail y Kami: es asimilación, no fusión) y Cell tampoco (es un bioandroide con células de varios, no una fusión). |
| `altura_cm` | ordinal numérico | Ver abajo. |
| `altura_fuente` | `canonica` \| `estimada` | **Obligatorio.** Ver abajo. |
| `cita`, `cita_idioma`, `cita_estado` | — | En v1 todas van `null` / `pendiente`. Se transcriben a mano: ver `TAREAS-HOBAR.md`. |
| `imagen_base`, `imagen_fuente` | — | URL de la API cuando existe, `null` + `pendiente` cuando no. |
| `notas` | texto libre | Solo para documentar decisiones raras. No lo consume el motor. |

### `altura_cm` y `altura_fuente`

- `canonica` (25 de 75 personajes): valor publicado en **Daizenshuu 7** o en la **Dragon Ball Super Exciting Guide**. Son las únicas alturas oficiales que existen; ver README §5.
- `estimada` (50 de 75): **no hay dato oficial**. El número es criterio propio por comparación visual con personajes de altura conocida. Sirve para que la flecha ordinal funcione, pero **no es un dato canónico** y cualquiera puede corregirlo sin romper nada.
- Regla de qué forma se mide: **la forma base adulta más representativa** del personaje. Excepciones documentadas en `notas` (Goten y Trunks se miden de niños porque es su única altura oficial; Freezer se mide en forma final; Cell en forma perfecta).
- Nunca se inventa un valor sin marcarlo. Si no hay ni base para estimar, se deja el personaje fuera del roster.
