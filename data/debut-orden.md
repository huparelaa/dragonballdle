# Orden ordinal del campo `debut`

Resuelve el pendiente §6.2 del README: `debut` es una categoría **ordinal** (el motor muestra flecha arriba/abajo), así que necesita un orden total explícito que mezcle series y películas.

---

## 1. Criterio elegido: orden de estreno real en Japón

**Decisión: el índice ordinal es la fecha de primera emisión / estreno en Japón de la obra donde el personaje aparece por primera vez.**

### Por qué, y no cronología interna del universo

Se evaluaron las dos opciones:

| Opción | Qué pasa en la práctica |
|---|---|
| **Cronología interna** (Edad 737, Edad 761, Edad 774…) | Rompe la intuición del jugador. *Bardock, el padre de Goku* ocurre antes que todo Dragon Ball, así que Bardock quedaría con el índice más bajo del dataset — más "viejo" que Goku niño. Peor: las películas de Z son mayoritariamente **no encajables** en la línea temporal (no tienen hueco canónico consistente), así que habría que inventar la ubicación de ~13 títulos. Eso es exactamente el tipo de dato que no se puede verificar. |
| **Orden de estreno real** ✅ | Coincide con lo que el jugador ya tiene en la cabeza. Cuando alguien ve la flecha "más nuevo", piensa "¿esto es más de Super o más de Dragon Ball clásico?", no "¿esto pasa en la Edad 762?". Y es un dato **verificable y no opinable**: son fechas de estreno publicadas. |

La flecha ordinal solo tiene que responder a *"¿el objetivo es de algo más viejo o más nuevo que lo que escribí?"*. Ese "viejo/nuevo" que el jugador intuye es **antigüedad de la obra**, no cronología del relato. Por eso: orden de estreno.

### Casos donde el criterio cambia el resultado (importante)

- **Beerus y Whis debutan en índice 24** (`Dragon Ball Z: La batalla de los dioses`, 2013), **no en Dragon Ball Super** (2015). La película salió dos años antes que la serie.
- **Freezer resucitado / la película *La resurrección de Freezer*** (índice 25, abril 2015) es **anterior** a Dragon Ball Super (índice 26, julio 2015).
- **Dragon Ball GT (índice 21, febrero 1996)** es **anterior** a *El camino hacia el poder* (índice 22, marzo 1996), la película del décimo aniversario. Contraintuitivo pero correcto por fecha.
- ***La historia de Trunks* (índice 14, febrero 1993)** es anterior a *Broly, el Super Saiyajin legendario* (índice 15, marzo 1993).
- ***El árbol del poder* (índice 8, julio 1990)** es anterior a *Bardock, el padre de Goku* (índice 9, octubre 1990).

---

## 2. La lista ordenada

Series **partidas en sagas** y películas/especiales de Toei intercalados por fecha de estreno en Japón. Alcance según README §2.1: sin videojuegos, sin Dragon Ball Heroes, sin OVAs promocionales.

Las sagas se ordenan por la fecha de emisión de su **primer episodio**, y las películas caen entre ellas según su fecha de estreno. Por eso una película puede quedar "dentro" del rango de emisión de una saga: lo que ordena es el arranque, no el rango completo.

| Índice | `debut` (valor exacto en el dataset) | Tipo | Estreno JP | Referencia |
|---:|---|---|---|---|
| 1 | Dragon Ball – Saga de las Esferas y el 21.º Torneo | saga | 1986-02 | Emperor Pilaf + 21st Tenkaichi |
| 2 | Dragon Ball – Saga del Listón Rojo y el 22.º Torneo | saga | 1986-10 | Red Ribbon Army + 22nd Tenkaichi |
| 3 | Dragon Ball: La leyenda de Shenlong | película | 1986-12-20 | Curse of the Blood Rubies |
| 4 | Dragon Ball: El castillo del demonio | película | 1987-07-18 | Sleeping Princess in Devil's Castle |
| 5 | Dragon Ball – Saga de Piccolo Daimaō y el 23.º Torneo | saga | 1987-11 | King Piccolo + 23rd Tenkaichi |
| 6 | Dragon Ball: Aventura mística | película | 1988-07-09 | Mystical Adventure |
| 7 | Dragon Ball Z – Saga de los Saiyajin | saga | 1989-04-26 | Saiyan Saga |
| 8 | Dragon Ball Z: Devuélveme a mi Gohan | película | 1989-07-15 | Dead Zone |
| 9 | Dragon Ball Z – Saga de Namek y Freezer | saga | 1990-01 | Namek / Frieza Saga |
| 10 | Dragon Ball Z: El hombre más fuerte del mundo | película | 1990-03-10 | The World's Strongest |
| 11 | Dragon Ball Z: El árbol del poder | película | 1990-07-07 | The Tree of Might |
| 12 | Dragon Ball Z: Bardock, el padre de Goku | especial TV | 1990-10-17 | Bardock – The Father of Goku |
| 13 | Dragon Ball Z: Los guerreros más poderosos | película | 1991-03-09 | Lord Slug |
| 14 | Dragon Ball Z: La venganza de Cooler | película | 1991-07-20 | Cooler's Revenge |
| 15 | Dragon Ball Z – Saga de los Androides y Cell | saga | 1991-09 | Android / Cell Saga |
| 16 | Dragon Ball Z: El regreso de Cooler | película | 1992-03-07 | The Return of Cooler |
| 17 | Dragon Ball Z: Los súper androides | película | 1992-07-11 | Super Android 13! |
| 18 | Dragon Ball Z: La historia de Trunks | especial TV | 1993-02-24 | The History of Trunks |
| 19 | Dragon Ball Z: Broly, el Super Saiyajin legendario | película | 1993-03-06 | Broly – The Legendary Super Saiyan |
| 20 | Dragon Ball Z: Los guerreros de plata | película | 1993-07-10 | Bojack Unbound |
| 21 | Dragon Ball Z – Saga de Majin Buu | saga | 1994-02 | Majin Buu Saga |
| 22 | Dragon Ball Z: El regreso de Broly | película | 1994-03-12 | Broly – Second Coming |
| 23 | Dragon Ball Z: Bio-Broly | película | 1994-07-09 | Bio-Broly |
| 24 | Dragon Ball Z: La fusión de Goku y Vegeta | película | 1995-03-04 | Fusion Reborn |
| 25 | Dragon Ball Z: El ataque del dragón | película | 1995-07-15 | Wrath of the Dragon |
| 26 | Dragon Ball GT – Saga de Black Star | saga | 1996-02-07 | Black Star Dragon Ball Saga |
| 27 | Dragon Ball: El camino hacia el poder | película | 1996-03-04 | The Path to Power |
| 28 | Dragon Ball GT – Saga de Baby | saga | 1996-08 | Baby Saga |
| 29 | Dragon Ball GT – Saga de Super 17 | saga | 1997-01 | Super 17 Saga |
| 30 | Dragon Ball GT: 100 años después | especial TV | 1997-03-26 | A Hero's Legacy |
| 31 | Dragon Ball GT – Saga de los Dragones Malignos | saga | 1997-04 | Shadow Dragon Saga |
| 32 | Dragon Ball Z: La batalla de los dioses | película | 2013-03-30 | Battle of Gods |
| 33 | Dragon Ball Z: La resurrección de Freezer | película | 2015-04-18 | Resurrection 'F' |
| 34 | Dragon Ball Super – Saga de Batalla de los dioses | saga | 2015-07-05 | God of Destruction Beerus Saga |
| 35 | Dragon Ball Super – Saga de la Resurrección de F | saga | 2015-11 | Golden Frieza Saga |
| 36 | Dragon Ball Super – Saga del Universo 6 | saga | 2015-12 | Universe 6 Saga |
| 37 | Dragon Ball Super – Saga de Trunks del Futuro | saga | 2016-05 | Future Trunks Saga |
| 38 | Dragon Ball Super – Saga de la Supervivencia Universal | saga | 2017-02 | Universal Survival Saga |
| 39 | Dragon Ball Super: Broly | película | 2018-12-14 | Dragon Ball Super: Broly |
| 40 | Dragon Ball Super: Super Hero | película | 2022-06-11 | Dragon Ball Super: Super Hero |
| 41 | Dragon Ball Daima | serie TV | 2024-10-11 | Dragon Ball Daima |

**41 valores. 22 en uso en el roster v1** (los demás quedan disponibles sin cambiar índices, ver §4).

### Nivel de verificación de esta tabla

- **Orden de las 13 películas de Z y los años**: verificado en búsqueda web contra la lista consolidada de películas de Dragon Ball (Wikipedia / *List of Dragon Ball films*). El orden de estreno de las 13 coincide con el orden numérico oficial de Toei.
- **Fechas exactas de películas (día y mes)**: son fechas de estreno japonés de conocimiento establecido, no re-verificadas una por una. El **orden relativo** — lo único que el motor usa — sí está verificado.
- **Fechas de arranque de las sagas (mes)**: son aproximadas, derivadas del rango de episodios de cada arco. **No están verificadas episodio por episodio.** El orden relativo entre sagas de una misma serie es correcto por construcción (los arcos se emitieron en secuencia); lo que podría moverse un puesto es una película que caiga justo en la frontera entre dos sagas.
- **Títulos en español**: etiquetas de referencia de la comunidad hispanohablante, **no** títulos confirmados del doblaje latino. Decidido en README §7: se aceptan sin verificar.
- **Nombres de las sagas**: criterio propio, agrupando arcos cortos (los dos torneos de DB van con el arco que los precede) para no crear valores con 1-2 personajes.

---

## 3. Cómo se asigna `debut` a un personaje

1. **La obra donde aparece por primera vez**, aunque su papel ahí sea mínimo. Trunks del Futuro = `Dragon Ball Z` (índice 5), aunque su especial propio sea el índice 14.
2. **Granularidad: la saga, no la obra completa.** Un personaje que debuta en el arco de Cell lleva `Dragon Ball Z – Saga de los Androides y Cell`, no `Dragon Ball Z`. Decidido el 2026-08-02 e implementado (ver §5 para el antes/después).
3. **Si un personaje aparece primero en una película y después en la serie, gana la película.** Beerus y Whis = índice 24, no 26.
4. **Si un personaje aparece primero en la serie y después en película, gana la serie.** Gogeta es la excepción aparente: no aparece nunca en la serie Z, solo en *La fusión de Goku y Vegeta*, así que su debut es el índice 19.
5. **Personajes que existen en dos versiones no-continuas comparten entrada y usan el debut más antiguo.** Broly = índice 15 (*Broly, el Super Saiyajin legendario*, 1993), no el índice 27. **Decidido el 2026-08-02: se separan en dos entradas** (README §7). Esta regla queda obsoleta y el índice 27 pasa a usarse; pendiente de implementar.
6. **Flashbacks cuentan.** Bardock = `Dragon Ball Z` (índice 5) porque aparece en flashbacks del arco de Namek, antes de su especial de octubre de 1990.

---

## 4. Cómo agregar obras nuevas sin romper nada

Los índices son **densos y consecutivos hoy**, lo que es cómodo pero frágil: insertar una película entre la 8 y la 9 obligaría a renumerar.

**Recomendación:** cuando haya que insertar una obra intermedia, usar **decimales** (`8.5`) en vez de renumerar. El motor solo necesita que el orden sea comparable, no que sea entero. Para obras nuevas al final (una película de Daima, una serie futura), se continúa en 30, 31, …

Lo que **no** se debe hacer nunca: reordenar los índices existentes, porque `debut_indice` puede quedar cacheado en resultados compartidos por los jugadores.

---

## 5. Por qué se partió por sagas (resuelto)

Con granularidad de obra completa la distribución era mala: **el 83 % del roster caía en 3 valores** (DBZ 32, DB 17, Super 13). `debut` pintaba verde muy seguido y la flecha ordinal casi no aportaba — era la categoría más débil del set.

Partido por sagas, el balde más grande baja de 32 a 11:

```
Dragon Ball Z – Saga de Majin Buu                        11
Dragon Ball – Saga de las Esferas y el 21.º Torneo        9
Dragon Ball Z – Saga de los Androides y Cell              9
Dragon Ball Z – Saga de los Saiyajin                      6
Dragon Ball Z – Saga de Namek y Freezer                   6
Dragon Ball Super – Saga del Universo 6                   6
Dragon Ball Super – Saga de la Supervivencia Universal    5
Dragon Ball – Saga de Piccolo Daimaō y el 23.º Torneo     4
... 14 valores más con 1-3 personajes
```

**Ya está implementado.** 62 personajes de serie reasignados; las películas no se tocaron.

### Asignaciones que conviene que un fan verifique

La mayoría son inequívocas, pero estas cinco se decidieron por criterio y son las que más fácil podrían estar mal:

| Personaje | Asignado a | Duda |
|---|---|---|
| `bardock` | Saga de los Saiyajin | Aparece en flashback dentro de la saga, pero su debut real como personaje es el especial de 1990 (índice 12). Se mantuvo el criterio "primera aparición en pantalla". |
| `rey-cold` | Saga de los Androides y Cell | Llega con Mecha-Freezer en lo que se suele llamar "saga de Trunks", justo en la frontera entre el final de Freezer y el arranque de los Androides. |
| `mr-satan` | Saga de los Androides y Cell | Debuta en los Juegos de Cell, no en el arco de Buu donde tiene más peso. |
| `launch` | Saga de las Esferas y el 21.º Torneo | Aparece durante el entrenamiento en Kame House; según dónde se corte el arco podría caer en el siguiente. |
| `zeno` | Saga del Universo 6 | Aparece al final del torneo entre U6 y U7, no en el Torneo del Poder. |
