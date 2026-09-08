# Especificación de Feature: Armador de Equipo y Pokédex del Juego

**Rama de Feature**: `004-pokedex-team-builder`

**Creado**: 2026-08-23

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Al seleccionar uno de los juegos se despliega el armado de equipo. Se deben visualizar 6 slots vacíos donde se irá mostrando el equipo a armar. Deben verse los Pokémon disponibles en ese juego, principalmente la Pokédex regional de ese juego, y un flag para visualizar la Pokédex nacional de ese juego (en caso de tenerla, 2da a 7ma generación). En caso de tener un DLC igualmente cada una un flag. En esta Pokédex debe visualizarse el nombre, número de Pokédex y sprite correspondiente a ese juego. Los Pokémon deben poder filtrarse por nombre (incluso parcial), tipo (tipo 1 o tipo 2), generación (en que fue introducido); deben aparecer ordenados por número de Pokédex. La visualización debe ser similar a la pantalla de referencia adjunta (grilla de sprites). Cada entrada será seleccionable, por lo que debe tener un estado de hover."

## Escenarios de Usuario y Pruebas *(obligatorio)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
-->

### Historia de Usuario 1 - Ver el armador de equipo y la Pokédex del juego seleccionado (Prioridad: P1)

Un usuario que ya eligió un juego (feature 001-select-game) abre la
pantalla de armado de equipo para ese juego y ve de inmediato los 6
espacios de equipo — vacíos, o mostrando los Pokémon ya elegidos en una
sesión anterior — junto con la Pokédex regional de ese juego: cada
entrada muestra su nombre, su número de Pokédex y el sprite
correspondiente a ese juego específico, todas ordenadas de menor a mayor
número.

**Por qué esta prioridad**: Es el punto de entrada de todo el flujo de
armado — sin ver los espacios de equipo y la Pokédex del juego no hay
nada contra qué actuar. Aporta valor por sí sola: incluso sin poder
todavía agregar Pokémon, el usuario obtiene una referencia precisa y
actualizada de qué existe en ese juego específico.

**Prueba Independiente**: Se puede probar completamente seleccionando un
juego, abriendo el armador, y confirmando que se muestran los 6 espacios
(vacíos o prellenados) y que la lista de Pokémon corresponde a la
Pokédex regional de ese juego, ordenada ascendentemente por número, con
nombre/número/sprite en cada entrada — sin necesitar aún filtros,
flags ni la posibilidad de agregar o quitar Pokémon.

**Escenarios de Aceptación**:

1. **Dado** un juego recién seleccionado sin equipo en progreso,
   **Cuando** el usuario abre el armador de equipo, **Entonces** se
   muestran 6 espacios vacíos y la Pokédex regional del juego, ordenada
   ascendentemente por número de Pokédex, con nombre, número y sprite en
   cada entrada.
2. **Dado** un equipo en progreso con entre 1 y 6 Pokémon agregados
   previamente, **Cuando** el usuario abre el armador para ese juego,
   **Entonces** cada espacio ocupado muestra el Pokémon correspondiente
   y los espacios restantes aparecen vacíos.
3. **Dado** un Pokémon de la Pokédex regional sin sprite disponible para
   ese juego específico, **Cuando** la lista se renderiza, **Entonces**
   se muestra una imagen de reemplazo clara en lugar de un espacio roto
   o vacío.

---

### Historia de Usuario 2 - Agregar y quitar Pokémon de los espacios del equipo (Prioridad: P2)

Un usuario selecciona una entrada de la Pokédex — que es interactiva y
se resalta al pasar el cursor sobre ella — para agregarla al primer
espacio vacío del equipo, y puede quitar un Pokémon ya agregado para
liberar su espacio nuevamente.

**Por qué esta prioridad**: Es la acción que le da sentido al nombre de
la feature ("armado de equipo"); sin ella, la Historia de Usuario 1 es
solo un catálogo de solo lectura.

**Prueba Independiente**: Con la Historia de Usuario 1 disponible, se
puede probar completamente seleccionando varios Pokémon de la Pokédex y
confirmando que ocupan los espacios en el orden en que fueron elegidos;
quitando uno y confirmando que su espacio vuelve a quedar vacío mientras
los demás no se alteran; e intentando agregar un séptimo Pokémon con los
6 espacios ya ocupados y confirmando que se impide con un aviso claro.

**Escenarios de Aceptación**:

1. **Dado** al menos un espacio vacío, **Cuando** el usuario selecciona
   una entrada de la Pokédex, **Entonces** ese Pokémon ocupa el próximo
   espacio vacío disponible y la entrada indica visualmente que ya forma
   parte del equipo.
2. **Dado** los 6 espacios ya ocupados, **Cuando** el usuario selecciona
   otra entrada de la Pokédex, **Entonces** el sistema impide agregarla y
   le indica claramente que el equipo está completo.
3. **Dado** un espacio ocupado por un Pokémon, **Cuando** el usuario lo
   quita de ese espacio, **Entonces** el espacio vuelve a quedar vacío y
   ese Pokémon puede volver a seleccionarse desde la Pokédex.
4. **Dado** cualquier entrada seleccionable de la Pokédex, **Cuando** el
   cursor pasa sobre ella, **Entonces** la entrada muestra un estado de
   hover distintivo que indica que puede seleccionarse.

---

### Historia de Usuario 3 - Buscar y filtrar la Pokédex (Prioridad: P3)

Un usuario que busca uno o varios Pokémon puntuales dentro de una
Pokédex extensa la acota escribiendo un nombre (aunque sea parcial),
eligiendo un tipo, o eligiendo una generación, en lugar de desplazarse
por toda la lista.

**Por qué esta prioridad**: Sin una forma de acotar la lista, la
Historia de Usuario 1 es usable pero poco práctica para Pokédex con
cientos de entradas; esta mejora de usabilidad es secundaria a poder
ver y armar el equipo, por eso va después.

**Prueba Independiente**: Se puede probar completamente escribiendo
parte de un nombre, eligiendo un filtro de tipo o de generación (por
separado y combinados), y confirmando que la lista visible se reduce
solo a las coincidencias, sin importar si se agrega algún Pokémon al
equipo.

**Escenarios de Aceptación**:

1. **Dado** la Pokédex completa, **Cuando** el usuario escribe parte del
   nombre de un Pokémon, **Entonces** solo permanecen visibles las
   entradas cuyo nombre contiene ese texto.
2. **Dado** la Pokédex completa, **Cuando** el usuario filtra por un
   tipo (por ejemplo Roca), **Entonces** solo permanecen visibles los
   Pokémon que tienen ese tipo como tipo 1 o como tipo 2.
3. **Dado** la Pokédex completa, **Cuando** el usuario filtra por una
   generación, **Entonces** solo permanecen visibles los Pokémon
   introducidos en esa generación.
4. **Dado** varios filtros activos a la vez (nombre, tipo y generación),
   **Cuando** se aplican en conjunto, **Entonces** solo permanecen
   visibles las entradas que cumplen todos los criterios activos, y
   siguen ordenadas por número de Pokédex.
5. **Dado** una combinación de filtros que no coincide con ningún
   Pokémon, **Cuando** el usuario ve los resultados, **Entonces** el
   sistema indica claramente que no hay coincidencias y ofrece una
   forma de limpiar los filtros.

---

### Historia de Usuario 4 - Alternar Pokédex Nacional y Pokémon de DLC (Prioridad: P4)

Un usuario que juega un título con Pokédex Nacional y/o contenido
descargable activa los flags correspondientes para ampliar, más allá de
la Pokédex regional, el conjunto de Pokémon disponibles para su equipo.

**Por qué esta prioridad**: La mayoría de las decisiones de equipo se
toman sobre la Pokédex regional; ampliar la vista a la nacional o a los
Pokémon de DLC es un incremento independiente y de menor prioridad, útil
solo cuando el juego seleccionado lo admite.

**Prueba Independiente**: Se puede probar completamente abriendo el
armador para un juego con Pokédex Nacional y/o DLC, activando cada flag
por separado y confirmando que la lista se amplía/renumera en
consecuencia, y confirmando que esos flags no aparecen para un juego que
no los admite.

**Escenarios de Aceptación**:

1. **Dado** un juego de 2da a 7ma generación (con Pokédex Nacional
   disponible), **Cuando** el usuario activa el flag "Pokédex Nacional",
   **Entonces** la lista pasa a mostrar la Pokédex nacional de ese
   juego, ordenada por el número nacional.
2. **Dado** ese mismo juego con el flag activo, **Cuando** el usuario lo
   desactiva, **Entonces** la lista vuelve a la Pokédex regional del
   juego, ordenada por el número regional.
3. **Dado** un juego sin Pokédex Nacional (1ra generación o 8va en
   adelante), **Cuando** el usuario abre el armador, **Entonces** no se
   ofrece el flag de Pokédex Nacional.
4. **Dado** un juego con uno o más DLC, **Cuando** el usuario activa el
   flag de un DLC específico, **Entonces** los Pokémon agregados por ese
   DLC se incluyen en la lista actualmente visible (regional o
   nacional).
5. **Dado** un juego sin ningún DLC, **Cuando** el usuario abre el
   armador, **Entonces** no se ofrece ningún flag de DLC.

### Casos Límite

- ¿Qué ocurre si el usuario cambia de juego (feature 001) mientras el
  armador está abierto? Se aplica la reconciliación ya definida en
  001-select-game (FR-010/FR-011): los Pokémon inválidos para el nuevo
  juego se eliminan del equipo con un aviso claro, y el resto se
  conserva.
- ¿Qué ocurre si los filtros activos (nombre/tipo/generación) se
  mantienen al activar o desactivar un flag de Pokédex Nacional o de
  DLC? Los filtros se vuelven a aplicar sobre el nuevo conjunto visible
  resultante, sin necesidad de que el usuario los reingrese.
- ¿Qué ocurre cuando los datos de la Pokédex del juego no se pueden
  obtener (la fuente no está disponible o se agota el tiempo de
  espera)? El sistema DEBE mostrar un error claro y permitir reintentar,
  sin dejar el armador en un estado roto o parcialmente cargado.
- ¿Qué ocurre si el usuario selecciona la misma especie de Pokémon más
  de una vez? Se permite — al igual que en los juegos originales, una
  misma especie puede ocupar más de un espacio del equipo.
- ¿Qué ocurre si el usuario intenta quitar un Pokémon de un espacio ya
  vacío? No hay ninguna acción disponible sobre un espacio vacío más
  allá de agregar un Pokémon.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE mostrar, de inmediato al entrar al armador
  de equipo de un juego seleccionado, 6 espacios de equipo, marcando
  como vacío cualquiera que no tenga un Pokémon asignado todavía.
- **FR-002**: El sistema DEBE prellenar cada espacio con los Pokémon ya
  agregados al equipo en progreso de ese juego en una sesión anterior,
  dejando el resto vacíos.
- **FR-003**: El sistema DEBE mostrar junto a los espacios de equipo la
  Pokédex regional del juego seleccionado, listando por defecto todos
  los Pokémon disponibles en ese juego.
- **FR-004**: Cada entrada de la Pokédex DEBE mostrar su nombre, su
  número de Pokédex (según la numeración de la vista actualmente
  activa — regional o nacional) y el sprite correspondiente al juego
  seleccionado.
- **FR-005**: El sistema DEBE mostrar una imagen de reemplazo clara en
  lugar de un sprite roto o vacío cuando no exista un sprite disponible
  para un Pokémon en el juego seleccionado.
- **FR-006**: La lista de la Pokédex DEBE permanecer ordenada
  ascendentemente por número de Pokédex en todo momento,
  independientemente de qué filtros o flags estén activos.
- **FR-007**: Cada entrada de la Pokédex DEBE ser seleccionable y DEBE
  mostrar un estado de hover distintivo que indique que puede
  seleccionarse.
- **FR-008**: Seleccionar una entrada de la Pokédex que aún no está en
  el equipo DEBE agregarla al próximo espacio vacío disponible, en
  orden, cuando exista al menos un espacio libre.
- **FR-009**: El sistema DEBE impedir agregar un Pokémon cuando los 6
  espacios ya están ocupados, e indicar claramente al usuario que el
  equipo está completo.
- **FR-010**: El sistema DEBE permitir quitar un Pokémon de un espacio
  ocupado, devolviendo ese espacio de inmediato al estado vacío.
- **FR-011**: El sistema DEBE permitir filtrar la Pokédex por nombre,
  con coincidencias parciales y sin distinguir mayúsculas/minúsculas.
- **FR-012**: El sistema DEBE permitir filtrar la Pokédex por tipo,
  incluyendo a un Pokémon cuando el tipo elegido coincide con su tipo 1
  o con su tipo 2.
- **FR-013**: El sistema DEBE permitir filtrar la Pokédex por la
  generación en la que cada Pokémon fue introducido.
- **FR-014**: Cuando varios filtros (nombre, tipo, generación) están
  activos a la vez, el sistema DEBE mostrar únicamente las entradas que
  cumplen todos los criterios activos simultáneamente.
- **FR-015**: El sistema DEBE indicar claramente cuando una búsqueda o
  combinación de filtros no produce ningún Pokémon coincidente, y DEBE
  ofrecer una forma de limpiarlos y ver de nuevo la lista completa.
- **FR-016**: Para un juego de 2da a 7ma generación, el sistema DEBE
  ofrecer un flag para alternar la Pokédex entre la regional y la
  nacional de ese juego; para un juego fuera de ese rango, el sistema NO
  DEBE mostrar ese flag.
- **FR-017**: Cuando el flag de Pokédex Nacional está activo, el sistema
  DEBE listar los Pokémon por su número de Pokédex nacional en lugar del
  regional, y ordenarlos en consecuencia.
- **FR-018**: Para un juego con uno o más DLC, el sistema DEBE ofrecer
  un flag por cada DLC para incluir en la lista actualmente visible los
  Pokémon agregados por ese DLC específico.
- **FR-019**: Para un juego sin ningún DLC, el sistema NO DEBE mostrar
  ningún flag de DLC.
- **FR-020**: El sistema DEBE mostrar un mensaje de error claro y
  accionable, y permitir reintentar, si la Pokédex del juego
  seleccionado no se puede obtener, sin dejar el armador en un estado
  roto o parcialmente cargado.

### Entidades Clave

- **Entrada de Pokédex**: Un Pokémon tal como aplica a un juego y a una
  vista de Pokédex activa específicos. Atributos clave: nombre para
  mostrar, número de Pokédex (regional o nacional según la vista
  activa), sprite correspondiente a ese juego, tipo 1, tipo 2
  (opcional), generación de introducción.
- **Espacio de Equipo**: Una de las 6 posiciones fijas del equipo en
  progreso; está vacío o contiene la referencia a una Entrada de
  Pokédex.
- **Sesión de Construcción de Equipo**: El equipo en progreso del
  usuario y su Juego activo (entidad ya definida por
  001-select-game). Esta feature es quien agrega y quita Pokémon de su
  lista de Pokémon en el equipo (hasta 6).
- **Criterios de Filtro de Pokédex**: El texto de búsqueda, el tipo y la
  generación elegidos, junto con el estado del flag de Pokédex Nacional
  y el de cada flag de DLC; en conjunto determinan qué subconjunto de la
  Pokédex es visible y con qué numeración.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Al abrir el armador de equipo de un juego, el usuario ve
  los 6 espacios de equipo y la Pokédex regional completa de ese juego
  sin necesitar ninguna acción adicional.
- **SC-002**: El 100% de las entradas de la Pokédex mostradas incluyen
  nombre, número de Pokédex y sprite visibles y correctos para el juego
  seleccionado.
- **SC-003**: Un usuario puede localizar un Pokémon puntual por nombre
  parcial en menos de 10 segundos, sin importar cuántos Pokémon tenga la
  Pokédex del juego.
- **SC-004**: El 100% de las combinaciones de filtros (nombre, tipo,
  generación) aplicadas simultáneamente devuelven únicamente resultados
  que cumplen todos los criterios activos, siempre ordenados por número
  de Pokédex.
- **SC-005**: Un usuario puede completar sus 6 espacios de equipo
  seleccionando Pokémon directamente desde la Pokédex, sin salir de la
  pantalla de armado ni recargarla.
- **SC-006**: El 100% de los intentos de agregar un séptimo Pokémon con
  el equipo ya completo son bloqueados con un aviso claro, sin alterar
  el equipo existente.
- **SC-007**: Para juegos con Pokédex Nacional o DLC disponibles, el
  100% de los Pokémon adicionales que estos aportan permanecen ocultos
  hasta que el usuario activa explícitamente el flag correspondiente, y
  vuelven a ocultarse al desactivarlo.

## Supuestos

- Esta feature reutiliza las entidades Juego, DLC de Juego, Generación y
  Sesión de Construcción de Equipo ya definidas por 001-select-game; el
  armador solo es alcanzable después de haber seleccionado un juego.
- La "Pokédex regional" de un juego es el catálogo oficial de Pokémon
  disponibles en ese juego según la fuente de datos externa ya utilizada
  por el proyecto (ver 001-select-game); no se define un listado propio.
- Al igual que en los juegos originales (Pokédex Nacional disponible de
  2da a 7ma generación, tal como indicó el usuario), activar el flag de
  Pokédex Nacional reemplaza por completo la lista y numeración
  regional por la nacional, en lugar de combinar ambas numeraciones a la
  vez.
- Una misma especie de Pokémon puede ocupar más de un espacio del
  equipo (no se restringen especies duplicadas), igual que en los juegos
  originales.
- El equipo en progreso (contenido de los espacios) persiste entre
  sesiones de la misma forma en que ya persiste la selección de juego
  activa (FR-008 de 001-select-game), de modo que un usuario que regresa
  ve su equipo tal como lo dejó.
- El sprite mostrado por cada entrada es el sprite frontal por defecto
  (no shiny) de ese juego; formas alternativas y variantes shiny quedan
  fuera del alcance de esta feature.
- Reordenar espacios, y editar movimientos, habilidad, objeto equipado u
  otras mecánicas de equipo más allá de agregar/quitar una especie,
  quedan fuera del alcance de esta feature — son parte de una futura
  feature de edición de equipo.
- El estado de hover (FR-007) aplica a interacción por puntero
  (web/escritorio); en dispositivos táctiles se usa el estado
  presionado/seleccionado equivalente, en línea con el sistema de diseño
  Material web-first-pero-responsive ya definido por
  002-material-design-ui.
