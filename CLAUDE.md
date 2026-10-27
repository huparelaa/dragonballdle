# CLAUDE.md

Instrucciones para agentes que trabajen en este repositorio.

## Lo primero

**Leé `README.md` completo antes de hacer cualquier cosa.** Es la única fuente de verdad del proyecto: alcance, decisiones de diseño con su porqué, modelo de datos, stack y estado actual. Este archivo dice *cómo trabajar*; el README dice *qué es el proyecto*.

## Qué es

DragonBallDle: juego diario tipo Loldle/NarutoDle sobre Dragon Ball. Cada día hay un personaje objetivo oculto y el jugador lo adivina mediante 4 modos de pistas (Clásico por atributos, Silueta, Frase icónica, Splash-zoom).

Es también el primer juego de una familia de "-dle" planeada, uno por franquicia. Esa es la razón de ser de casi toda la arquitectura: **el motor no debe saber nada de Dragon Ball.**

## Convenciones del proyecto

### Un solo archivo de diseño

Hobar prefiere **no** tener muchos `.md` sueltos. El README es la fuente de verdad y ahí van las decisiones. No crees documentos nuevos de diseño, resumen, plan o changelog salvo que te lo pidan explícitamente — actualizá el README.

Los únicos `.md` que deben existir hoy:

| Archivo | Para qué |
|---|---|
| `README.md` | Fuente de verdad: diseño, decisiones, stack, estado |
| `CLAUDE.md` | Este archivo |
| `data/taxonomias.md` | Diccionario de valores permitidos y criterios de asignación |
| `data/debut-orden.md` | Orden ordinal de series, películas y sagas |
| `data/TAREAS-HOBAR.md` | Trabajo manual de Hobar (citas e imágenes) |

Si creás uno nuevo, justificá por qué no cabía en los que ya hay.

### Idioma

Todo en **español**: README, comentarios, nombres de campo del dataset, contenido del juego. Los `id` de personaje van en minúsculas con guiones (`trunks-futuro`, `goku-black`). Las citas son del **doblaje latino**, no del japonés ni del inglés.

### El dataset es generado

`data/personajes.json` **es salida, no fuente.** Se produce con:

```bash
python3 data/build_dataset.py
```

Ese script regenera el JSON e imprime el reporte de validación. **Si hay que cambiar datos, se edita el script, no el JSON** — el siguiente build borra cualquier edición directa.

### La regla de unicidad es sagrada

No pueden existir dos personajes con la combinación exacta de todos los atributos comparables. Si la hay, el reto diario tiene dos respuestas correctas y el juego está roto. El validador de `build_dataset.py` lo comprueba.

**Corré el validador después de cualquier cambio al dataset.** Sin excepción.

## Honestidad con los datos

Esta es la regla que más importa en este proyecto, porque el contenido es canon de una franquicia con muchísima información contradictoria dando vueltas.

- **No inventes datos que no pudiste verificar.** Ni citas, ni alturas, ni razas, ni fechas.
- Cuando no haya dato confiable, **dejalo vacío y marcalo como pendiente**. El dataset tiene campos para esto (`altura_fuente`, `cita_estado`, `imagen_fuente`) — usalos.
- Distinguí siempre entre "verificado en fuente" y "criterio propio". Un valor inferido con criterio está bien; presentarlo como verificado, no.
- Si una fuente que el README da por buena no funciona, **decilo y actualizá el README** en vez de asumir que funciona. Ya pasó una vez: el README afirmaba campos de la API que no existen.

## Cómo traer contenido web

Usá solo las herramientas de fetch/búsqueda web disponibles. **Nunca** `curl`, `wget`, `requests`, `urllib` ni ningún otro método desde bash o Python para descargar URLs. Si una URL no se puede traer, anotala como bloqueada y seguí.

Estado conocido de las fuentes:

- `dragonball-api.com` — funciona. Ojo: el dominio **lleva guion**. Solo sirve como fuente de URLs de imagen; cubre 4 de nuestros 13 campos y tiene errores de clasificación.
- `dragonball.fandom.com` — dio timeout en 5 rutas distintas. Alternativa que sí respondió en búsquedas: `kanzenshuu.com/wiki`.

## Arquitectura

Monorepo con workspaces de pnpm:

```
packages/dle-engine/      motor genérico, agnóstico de franquicia
apps/dragonballdle/       app Next.js + datos de Dragon Ball
apps/avatardle/           futuro, mismo patrón
```

**El límite que importa es el de módulo, no el de repo.** `dle-engine` no puede importar nada específico de Dragon Ball, ni tener strings de la franquicia, ni conocer los nombres de las categorías. Recibe un dataset que cumple sus contratos y opera sobre él. Si te encontrás queriendo meter algo de Dragon Ball en el engine, la abstracción está mal — pará y replanteá.

### Next.js, y por qué el motor va en TypeScript

Stack decidido: Next.js para todo en v1, motor en TS. La razón no es preferencia — es que **la comparación tiene que correr en el servidor** (si el objetivo del día se calcula en el cliente, se lee el JS y el juego se rompe), y en TS el mismo motor sirve en el servidor para validar y en el cliente para el autocompletado.

.NET entra más adelante como servicio aparte, cuando aparezca estado de servidor real (cuentas, leaderboards). No lo adelantes.

### Regla de seguridad del juego

**El personaje objetivo del día nunca sale al cliente.** El cliente manda un intento, el servidor devuelve la comparación. Cualquier diseño que exponga el objetivo (aunque sea ofuscado o en un bundle) rompe el juego. Aplica igual a las siluetas y a los recortes de Splash-zoom: el recorte se sirve ya generado, no la imagen completa para que el cliente la recorte.

## Antes de dar algo por terminado

- Si tocaste datos: corriste `build_dataset.py` y el reporte salió limpio.
- Si tocaste el engine: no hay ninguna referencia a Dragon Ball en `packages/dle-engine/`.
- Si tomaste una decisión de diseño: quedó escrita en el README con su porqué, no solo en el chat.
- Si descubriste que el README estaba mal: lo corregiste.
