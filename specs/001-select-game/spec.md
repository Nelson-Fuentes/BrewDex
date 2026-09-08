# Especificación de Feature: Selección de Juego para el Constructor de Equipos

**Rama de Feature**: `001-select-game`

**Creado**: 2026-08-22

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Principalmente necesito poder consumir la PokeAPI para construir equipos Pokémon. El primer feature es para elegir el juego para el que se va a construir el equipo, por lo que el usuario debe poder tener esta opción ya sea mediante un listado, aunque preferiría algo más interactivo considerando que son varios juegos."

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Elegir un juego para construir un equipo (Prioridad: P1)

Un usuario abre el constructor de equipos y, antes de agregar cualquier
Pokémon, elige para qué juego de Pokémon se está construyendo su equipo.
Esta elección determina qué Pokémon y mecánicas estarán disponibles más
adelante.

**Por qué esta prioridad**: Este es el punto de entrada de todo el flujo de
construcción de equipos — sin un juego seleccionado no hay nada válido
contra qué construir, por lo que este es el mínimo necesario para
desbloquear cualquier feature futura.

**Prueba Independiente**: Se puede probar completamente abriendo el
constructor de equipos, eligiendo un juego del selector y confirmando que
la aplicación reporta ese juego como el objetivo activo para un nuevo
equipo — sin necesitar aún ninguna funcionalidad de construcción de
equipos.

**Escenarios de Aceptación**:

1. **Dado** que el usuario aún no ha seleccionado un juego, **Cuando**
   abre el constructor de equipos, **Entonces** se le presentan los juegos
   disponibles y no puede iniciar ningún equipo hasta elegir uno.
2. **Dado** el listado de juegos disponibles, **Cuando** el usuario elige
   uno, **Entonces** el sistema confirma ese juego como la selección
   activa y permite al usuario avanzar a construir un equipo.
3. **Dado** que el usuario ya había seleccionado un juego en una sesión
   anterior, **Cuando** regresa al constructor de equipos, **Entonces** se
   muestra su juego previamente seleccionado como la selección activa.

---

### Historia de Usuario 2 - Encontrar un juego rápidamente entre muchas opciones (Prioridad: P2)

Un usuario que sabe aproximadamente qué juego quiere (por nombre o por
generación) reduce el listado de forma interactiva en lugar de desplazarse
por todos los juegos de Pokémon lanzados.

**Por qué esta prioridad**: La franquicia Pokémon abarca decenas de
lanzamientos; sin una forma de acotar el listado, la Historia de Usuario 1
es técnicamente usable pero poco práctica, por eso el usuario pidió
explícitamente algo más interactivo que un listado plano.

**Prueba Independiente**: Se puede probar completamente escribiendo parte
del nombre de un juego o eligiendo un filtro de generación y confirmando
que las opciones visibles se reducen solo a las coincidencias,
independientemente de si se finaliza alguna selección.

**Escenarios de Aceptación**:

1. **Dado** el listado completo de juegos, **Cuando** el usuario escribe
   parte del nombre de un juego, **Entonces** solo permanecen visibles los
   juegos que coinciden con ese texto.
2. **Dado** el listado completo de juegos, **Cuando** el usuario filtra
   por generación, **Entonces** solo permanecen visibles los juegos de esa
   generación.
3. **Dado** una búsqueda o filtro que no coincide con ningún juego,
   **Cuando** el usuario ve los resultados, **Entonces** el sistema indica
   claramente que no se encontraron coincidencias y ofrece una forma de
   limpiar la búsqueda/filtro.

---

### Historia de Usuario 3 - Cambiar el juego con un equipo ya en progreso (Prioridad: P3)

Un usuario que ya empezó a construir un equipo decide cambiar a un juego
distinto, y el sistema reconcilia automáticamente el equipo en progreso
con las restricciones del nuevo juego.

**Por qué esta prioridad**: Este es un flujo de corrección/borde más que
el camino principal — la mayoría de los usuarios elige un juego una vez y
avanza — pero debe comportarse de forma predecible una vez que existen
equipos, por lo que se define como un incremento independiente y de menor
prioridad.

**Prueba Independiente**: Se puede probar completamente seleccionando un
juego, agregando al menos un Pokémon a un equipo, cambiando a un juego
distinto y confirmando que los Pokémon que ya no son válidos para el
nuevo juego se eliminan con un aviso claro, mientras los válidos
permanecen.

**Escenarios de Aceptación**:

1. **Dado** un equipo en progreso bajo el Juego A con únicamente Pokémon
   que también existen en el Juego B, **Cuando** el usuario cambia la
   selección al Juego B, **Entonces** el equipo se conserva sin cambios
   bajo la nueva selección.
2. **Dado** un equipo en progreso bajo el Juego A con al menos un Pokémon
   que no está disponible en el Juego B, **Cuando** el usuario cambia la
   selección al Juego B, **Entonces** los Pokémon inválidos se eliminan
   del equipo y se muestra al usuario un aviso claro que enumera qué se
   eliminó y por qué.
3. **Dado** que el usuario está a mitad de cambiar de juego, **Cuando**
   cancela el cambio, **Entonces** el juego original y el equipo
   permanecen sin cambios.

### Casos Límite

- ¿Qué ocurre cuando los datos de los juegos no se pueden obtener (la
  fuente no está disponible o se agota el tiempo de espera)? El sistema
  DEBE mostrar un error claro y permitir reintentar, sin dejar una
  selección rota o parcial.
- ¿Qué ocurre si un usuario no tiene ningún equipo en progreso y cambia de
  juego repetidamente? Cada cambio simplemente actualiza la selección
  activa sin nada que reconciliar.
- ¿Qué ocurre cuando dos juegos tienen nombres muy similares o
  compartidos (por ejemplo, lanzamientos pareados)? Cada opción
  seleccionable DEBE estar etiquetada con la claridad suficiente para no
  generar ambigüedad (ver FR-002).
- ¿Qué ocurre si el catálogo de juegos subyacente cambia (se añade un
  juego) entre sesiones? La próxima vez que el selector se cargue, DEBE
  reflejar el catálogo actual sin requerir ninguna actualización manual
  por parte del usuario.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE presentar al usuario el catálogo completo de
  juegos de Pokémon disponibles para construir un equipo, antes de
  habilitar cualquier acción de construcción de equipos.
- **FR-002**: El sistema DEBE presentar cada lanzamiento pareado (por
  ejemplo, dos versiones vendidas como par, como "Escarlata/Púrpura")
  como una única opción seleccionable en lugar de entradas separadas,
  etiquetada con claridad suficiente para distinguirla de cualquier otra
  opción.
- **FR-003**: Los usuarios DEBEN poder seleccionar exactamente un juego
  como objetivo activo para un equipo.
- **FR-004**: El sistema DEBE permitir a los usuarios acotar el catálogo
  de forma interactiva — como mínimo escribiendo parte de un nombre — sin
  requerir que se desplacen por todo el listado sin filtrar.
- **FR-005**: El sistema DEBE permitir a los usuarios acotar el catálogo
  por generación.
- **FR-006**: El sistema DEBE indicar claramente cuando una búsqueda o
  filtro no produce ningún juego coincidente y ofrecer una forma de
  limpiarlo y ver de nuevo el catálogo completo.
- **FR-007**: El sistema DEBE impedir que el usuario avance a la
  construcción de equipos hasta que se haya seleccionado un juego.
- **FR-008**: El sistema DEBE recordar el juego seleccionado más
  recientemente por el usuario entre sesiones y presentarlo como la
  selección activa al regresar.
- **FR-009**: Los usuarios DEBEN poder cambiar la selección de juego
  activa en cualquier momento, incluso mientras un equipo ya está en
  progreso.
- **FR-010**: Cuando la selección de juego activa cambia mientras un
  equipo está en progreso, el sistema DEBE eliminar automáticamente
  cualquier Pokémon de ese equipo que no sea válido para el juego
  recién seleccionado, y DEBE mostrar al usuario un aviso claro que
  identifique qué se eliminó y por qué.
- **FR-011**: Cuando la selección de juego activa cambia y todos los
  Pokémon del equipo en progreso siguen siendo válidos para el nuevo
  juego seleccionado, el sistema DEBE conservar el equipo sin cambios.
- **FR-012**: El sistema DEBE mostrar un mensaje de error claro y
  accionable, y permitir reintentar, si el catálogo de juegos no se
  puede obtener, sin dejar al usuario con un selector roto o
  parcialmente cargado.

### Entidades Clave

- **Juego**: Una opción de juego de Pokémon seleccionable (un lanzamiento
  pareado se representa como un solo Juego). Atributos clave: nombre para
  mostrar, generación. Determina qué Pokémon y mecánicas son válidos para
  cualquier equipo construido en base a él.
- **Sesión de Construcción de Equipo**: El equipo en progreso del usuario,
  vinculado a exactamente un Juego seleccionado en cada momento.
  Reconciliado automáticamente cada vez que cambia su Juego asociado.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Un usuario puede encontrar y seleccionar el juego que busca
  en menos de 15 segundos, sin conocimiento previo de dónde aparece en el
  catálogo completo.
- **SC-002**: El 100% de los juegos del catálogo son alcanzables mediante
  búsqueda y/o filtro por generación — ninguno requiere desplazarse por
  un listado sin filtrar para alcanzarlo.
- **SC-003**: Un usuario que regresa al constructor de equipos ve su
  último juego seleccionado como la selección activa sin tener que
  volver a elegirlo, en el 100% de las visitas de retorno.
- **SC-004**: Cuando un usuario cambia de juego con un equipo en
  progreso, se conserva el 100% de los Pokémon que siguen siendo válidos
  para el nuevo juego, y el 100% de los eliminados se enumera
  explícitamente en el aviso mostrado al usuario.
- **SC-005**: Los usuarios que encuentran un fallo al cargar el catálogo
  pueden identificar que algo salió mal y reintentar sin necesidad de
  recargar toda la aplicación.

## Supuestos

- "Construir un equipo" para un juego determinado significa que el equipo
  está pensado para usar únicamente Pokémon y mecánicas válidos para ese
  juego específico; este feature cubre solo el paso de selección de
  juego, no la mecánica de agregar Pokémon a un equipo, que es un feature
  futuro y separado.
- El catálogo de juegos (listado de juegos de Pokémon, sus generaciones y
  qué lanzamientos están pareados) proviene de una fuente de datos
  externa ya existente y no necesita ser curado ni ingresado
  manualmente por los usuarios.
- La persistencia de "sesión" (FR-008) significa que la selección se
  recuerda para el mismo usuario entre visitas; la sincronización
  multi-dispositivo queda fuera del alcance de este feature.
- Un filtro de "generación" agrupa los juegos tal como ya los categoriza
  la fuente de datos; no es necesario inventar un esquema de agrupación
  propio.
- Solo puede haber un equipo en progreso por selección a la vez, para
  efectos del comportamiento de reconciliación de la Historia de Usuario
  3; gestionar varios equipos simultáneos queda fuera del alcance de este
  feature.
