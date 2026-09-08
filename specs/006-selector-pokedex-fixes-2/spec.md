# Especificación de Feature: Segunda Ronda de Correcciones del Selector de Juego, la Pokédex y el Armador de Equipo

**Rama de Feature**: `006-selector-pokedex-fixes-2`

**Creado**: 2026-08-23

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Que por defecto los toggles aparezcan colapsados, no expandidos. Dentro de los toggles, al momento de elegir una opción, los toggles se compriman automáticamente; en la versión web considerar mostrar más de una opción por fila, en mobile está bien que sea solo una. Los íconos de los atributos (tipos) se deben sacar de https://github.com/PokeAPI/sprites/tree/master/sprites/types, están divididos por generaciones y juegos. En la parte de armado de equipo, en la parte de arriba debe salir el nombre del juego. Oro/Plata no tienen los sprites correctos del juego, verificar que siempre se llame al sprite que corresponde al juego; Rojo/Verde ocurre lo mismo, y Azul también. Los juegos de Blanco/Negro y Blanco 2/Negro 2 no están llevando a armar el equipo. En X/Y sigue saliendo la Pokédex mal (imagen adjunta), doble número y mal ordenamiento. En los casos que hay DLC's las pokédex se están mezclando, la pokédex de los DLC debe aparecer como una grilla aparte en la sección de abajo y solo aparecer los pokémon que aparecieron en el juego principal o en otro DLC activado. Diamante Brillante y Perla Reluciente sí deben tener Pokédex Nacional, único juego de la generación 8 que corresponde. Al seleccionar un Pokémon, si este tiene varias formas disponibles en el juego seleccionado, debe permitir al usuario elegir qué forma se agregará; esto puede modificarse desde el slot del Pokémon ya seleccionado. El modal de selección de forma debe usar sprites del juego, el slot se mantiene con el sprite estilo HOME. Desde el slot de un Pokémon seleccionado se debe poder indicar si es variocolor (shiny) y cambiar el sprite a la versión shiny."

## Clarifications

### Session 2026-08-23

- Q: ¿Qué variantes de una especie deben contar como "forma" seleccionable en el modal de la Historia 10 (FR-020/FR-021), además de las formas regionales ya resueltas como forma principal en [[005-selector-pokedex-fixes]]? → A: El modal de selección de forma al agregar el Pokémon al slot se ofrece únicamente para formas de plantilla con diseño propio (Rotom, Arceus, Deoxys, Genesect, Zygarde, Giratina, Shaymin, etc.). Las diferencias de género NO se resuelven en este modal: el slot ofrece un control de género editable después de agregado, con macho como valor por defecto, hembra si la especie no tiene macho, y la única opción disponible si la especie no tiene género. Las formas puramente cosméticas con muchas variantes (por ejemplo los patrones de Vivillon o las manchas de Spinda) no requieren elegirse en el modal al agregar — el Pokémon se agrega con una variante por defecto y esa variante se puede cambiar después desde el slot, igual que el resto de las formas. Todos estos atributos editables desde un slot ya ocupado (forma, género, variante cosmética y variocolor/shiny — ver siguientes clarificaciones) se agrupan en una única sección modal/tarjeta de "Personalización de Pokémon" que opera sobre ese slot, en lugar de controles sueltos e independientes.
- Q (revisión aportada por el usuario sobre la respuesta anterior): ¿Deben Mega Evolución y Gigamax/Dinamax ser opciones dentro del modal de selección de forma? → A: No. Se excluyen del modal de forma (FR-020/FR-021) y se representan en su lugar como botones dedicados (con el ícono de cada mecánica) dentro de la tarjeta de Personalización de Pokémon del slot; cada botón solo aparece si el Pokémon del slot puede usar esa mecánica en el juego seleccionado (Historia 11). Activar uno de estos botones desactiva el otro automáticamente si ambos estuvieran disponibles a la vez, ya que son mutuamente excluyentes.
- Q: Cuando un mismo Pokémon es obtenible a través de más de un DLC activo a la vez (FR-011/FR-012), ¿de qué depende en qué grilla de DLC aparece? → A: Del orden canónico de introducción por DLC según los datos del juego (fijo y determinista, igual en cualquier sesión), no del orden en que el usuario activó los DLC en la sesión actual.
- Q (aportado por el usuario, sin pregunta formal previa): ¿Qué ocurre cuando un DLC desbloquea una forma nueva para una especie que ya existía en el juego base o en otro DLC? → A: La forma nueva se agrega como opción dentro del modal/tarjeta de selección de forma ya existente de esa especie (FR-028); la especie se sigue mostrando una única vez en la grilla de Pokédex a la que ya pertenecía, nunca duplicada por cada DLC que le agrega una forma (FR-029). Si más de un DLC activo desbloquea formas distintas de la misma especie, todas esas formas conviven como opciones del mismo selector.
- Q: Cuando un Pokémon o forma no tiene sprite shiny disponible en la fuente de datos, ¿el sistema debe permitir marcarlo como variocolor igual (con una imagen de reemplazo) o debe ocultar/deshabilitar la opción? → A: Ocultar la opción de variocolor para ese slot; no mostrarla ni deshabilitada ni con una imagen de reemplazo. En la práctica la fuente de datos del proyecto provee sprite shiny para la totalidad de los Pokémon y formas, por lo que esta regla es una salvaguarda para el caso excepcional de que falte.
- Q (aportado por el usuario, sin pregunta formal previa): Al cambiar de juego, ¿qué debe pasar con un slot cuyo Pokémon deja de ser válido en el juego nuevo? → A: El slot debe quedar completamente vacío y disponible para agregar otro Pokémon, no quedar marcado como reservado/ocupado sin un Pokémon visible (ver nueva Historia 2 e Historia de Usuario 1 en [[001-select-game]] para la reconciliación de estado al cambiar de juego).

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Poder armar el equipo en todos los juegos de la saga (Prioridad: P1)

Un usuario que selecciona Pokémon Blanco, Negro, Blanco 2 o Negro 2 en el
catálogo llega igual que con cualquier otro juego a la pantalla de armado
de equipo de ese juego, en vez de quedar atascado o sin poder continuar.

**Por qué esta prioridad**: Es un bloqueo total de la funcionalidad
principal de la aplicación para cuatro juegos completos; ningún usuario
puede usar el armador de equipo en esos juegos hasta que se corrija, por
lo que antecede a cualquier otra mejora de datos o de diseño.

**Prueba Independiente**: Se puede probar completamente seleccionando
cada uno de los cuatro juegos (Blanco, Negro, Blanco 2, Negro 2) desde el
catálogo y confirmando que en los cuatro casos la aplicación llega a la
pantalla de armado de equipo con su Pokédex correspondiente cargada.

**Escenarios de Aceptación**:

1. **Dado** el catálogo de juegos, **Cuando** el usuario selecciona
   Pokémon Blanco o Pokémon Negro, **Entonces** la aplicación navega a la
   pantalla de armado de equipo de ese juego y muestra su Pokédex.
2. **Dado** el catálogo de juegos, **Cuando** el usuario selecciona
   Pokémon Blanco 2 o Pokémon Negro 2, **Entonces** la aplicación navega a
   la pantalla de armado de equipo de ese juego y muestra su Pokédex.
3. **Dado** cualquiera de estos cuatro juegos ya en la pantalla de
   armado de equipo, **Cuando** el usuario interactúa con sus slots y
   filtros, **Entonces** se comportan igual que en el resto de los
   juegos ya soportados.

---

### Historia de Usuario 2 - Liberar el slot cuando su Pokémon deja de ser válido tras un cambio de juego (Prioridad: P2)

Un usuario que cambia de juego y tenía un slot ocupado por un Pokémon
que ya no es válido para el juego nuevo ve ese slot completamente vacío
y disponible, en lugar de quedar marcado como reservado/ocupado sin un
Pokémon visible que se pueda editar o quitar.

**Por qué esta prioridad**: Es un bloqueo funcional del armador de
equipo — el usuario no puede rellenar ese slot con otro Pokémon aunque
esté visualmente vacío — que puede ocurrir en cualquier juego al
cambiar de título, no solo en los cuatro de la Historia 1; se corrige
justo después del bloqueo total porque también impide usar el armador
con normalidad.

**Prueba Independiente**: Se puede probar completamente ocupando un
slot con un Pokémon, cambiando a un juego en el que ese Pokémon ya no es
válido (según la reconciliación de estado de [[001-select-game]]
FR-010/FR-011), y confirmando que el slot queda libre y se puede
rellenar de inmediato con otro Pokémon de la Pokédex del juego nuevo.

**Escenarios de Aceptación**:

1. **Dado** un slot ocupado por un Pokémon, **Cuando** el usuario cambia
   a un juego en el que ese Pokémon deja de ser válido, **Entonces** el
   slot queda vacío y disponible, sin ninguna marca de reserva ni rastro
   del Pokémon anterior.
2. **Dado** ese slot ya vacío tras el cambio de juego, **Cuando** el
   usuario intenta agregarle un Pokémon de la Pokédex del juego nuevo,
   **Entonces** el Pokémon se agrega con normalidad, igual que en
   cualquier otro slot vacío.
3. **Dado** varios slots afectados por el mismo cambio de juego,
   **Cuando** el usuario revisa el equipo completo, **Entonces** todos
   los slots cuyo Pokémon dejó de ser válido quedan vacíos y
   disponibles, no solo el primero.

---

### Historia de Usuario 3 - Ver la Pokédex de X/Y con números correctos (Prioridad: P3)

Un usuario que abre la Pokédex de Pokémon X o Pokémon Y ve cada especie
listada una sola vez, con su número de Pokédex regional correcto, en
orden numérico ascendente y sin duplicados.

**Por qué esta prioridad**: Es un error de datos que hace inutilizable la
Pokédex de dos juegos completos (entradas repetidas y desordenadas
impiden ubicar un Pokémon); es una corrección de datos crítica, aunque
acotada a estos dos juegos, por lo que va después del bloqueo total de
Historia 1.

**Prueba Independiente**: Se puede probar completamente abriendo la
Pokédex de Pokémon X y de Pokémon Y y confirmando que cada número de
Pokédex regional aparece una única vez, en la lista completa, ordenado de
menor a mayor.

**Escenarios de Aceptación**:

1. **Dado** la Pokédex de Pokémon X o Pokémon Y, **Cuando** el usuario la
   visualiza completa, **Entonces** ningún número de Pokédex regional se
   repite en más de una entrada.
2. **Dado** esa misma Pokédex, **Cuando** el usuario la visualiza,
   **Entonces** las entradas están ordenadas de forma ascendente por su
   número de Pokédex regional.
3. **Dado** una especie con forma regional o alterna relevante para X/Y,
   **Cuando** aparece en la Pokédex, **Entonces** se muestra en una única
   entrada con su número correcto, no en dos entradas separadas para el
   mismo número.

---

### Historia de Usuario 4 - Ver los sprites correctos por juego en Oro/Plata, Rojo/Verde y Azul (Prioridad: P4)

Un usuario que abre la Pokédex de Pokémon Oro, Pokémon Plata, Pokémon
Rojo, Pokémon Verde o Pokémon Azul ve en cada entrada el sprite oficial
propio de esa versión específica, no el de otro juego.

**Por qué esta prioridad**: Es un error de datos que ya se corrigió para
Pokémon Amarillo en [[005-selector-pokedex-fixes]] y ahora se extiende a
otros cinco juegos clásicos; afecta la confianza del usuario en la
Pokédex pero no bloquea el flujo como las Historias 1 y 3, por lo que va
después.

**Prueba Independiente**: Se puede probar completamente abriendo la
Pokédex de cada uno de los cinco juegos (Oro, Plata, Rojo, Verde, Azul) y
comparando una muestra de sprites contra los sprites oficiales
publicados para esa versión específica.

**Escenarios de Aceptación**:

1. **Dado** la Pokédex de Pokémon Oro, **Cuando** el usuario la visualiza,
   **Entonces** cada entrada muestra el sprite oficial de la versión Oro
   para esa especie y forma.
2. **Dado** la Pokédex de Pokémon Plata, **Cuando** el usuario la
   visualiza, **Entonces** cada entrada muestra el sprite oficial de la
   versión Plata.
3. **Dado** la Pokédex de Pokémon Rojo o Pokémon Verde, **Cuando** el
   usuario la visualiza, **Entonces** cada entrada muestra el sprite
   oficial de esa versión específica (Rojo o Verde respectivamente), no el
   de la otra ni el de Azul.
4. **Dado** la Pokédex de Pokémon Azul, **Cuando** el usuario la
   visualiza, **Entonces** cada entrada muestra el sprite oficial de la
   versión Azul.

---

### Historia de Usuario 5 - Ver la Pokédex de cada DLC correctamente separada y acotada (Prioridad: P5)

Un usuario que juega un título con uno o más DLC activables ve, debajo de
la Pokédex del juego principal, una grilla separada por cada DLC activo,
que contiene únicamente los Pokémon que efectivamente aparecen en el
juego principal o en otro DLC ya activado — nunca Pokémon de un DLC que
no está activo ni una mezcla indistinguible con la Pokédex base.

**Por qué esta prioridad**: Profundiza y corrige un problema de alcance
de datos ya abordado parcialmente en
[[005-selector-pokedex-fixes]] (FR-012/FR-013); sigue siendo una
corrección de datos, pero acotada a los juegos con DLC, por lo que va
después de las correcciones más generales de Historias 1 a 4.

**Prueba Independiente**: Se puede probar completamente abriendo un
juego con DLC, activando uno o más DLC, y confirmando que aparece una
grilla adicional por cada DLC activo debajo de la grilla principal, que
esa grilla solo contiene Pokémon obtenibles en el juego principal o en un
DLC activo, y que desactivar un DLC hace desaparecer su grilla sin
afectar las demás.

**Escenarios de Aceptación**:

1. **Dado** un juego con al menos un DLC, **Cuando** el usuario activa ese
   DLC, **Entonces** aparece una grilla de Pokédex adicional, ubicada
   debajo de la grilla del juego principal, dedicada a ese DLC.
2. **Dado** esa grilla de DLC, **Cuando** el usuario la revisa,
   **Entonces** solo contiene Pokémon que aparecen en el juego principal o
   en algún DLC actualmente activado, nunca Pokémon exclusivos de un DLC
   que el usuario no ha activado.
3. **Dado** dos o más DLC activables, **Cuando** el usuario activa más de
   uno, **Entonces** cada DLC activo tiene su propia grilla separada,
   identificable individualmente, sin fusionarse entre sí ni con la
   grilla principal.
4. **Dado** un DLC activo con su grilla visible, **Cuando** el usuario lo
   desactiva, **Entonces** esa grilla desaparece y la grilla del juego
   principal y la de cualquier otro DLC que siga activo permanecen sin
   cambios.
5. **Dado** un DLC que desbloquea una forma nueva para una especie que ya
   aparece en la grilla del juego principal o de otro DLC activo,
   **Cuando** el usuario revisa las grillas de Pokédex, **Entonces** esa
   especie sigue apareciendo una única vez, en la grilla a la que ya
   pertenecía, y la forma nueva se ofrece como opción adicional en su
   modal/tarjeta de selección de forma en lugar de crear una entrada
   separada.
6. **Dado** dos o más DLC activos que desbloquean formas distintas para
   una misma especie ya listada, **Cuando** el usuario abre el
   modal/tarjeta de selección de forma de esa especie, **Entonces** ve
   todas esas formas como opciones dentro del mismo selector, sin que la
   especie se duplique entre grillas.

---

### Historia de Usuario 6 - Ver la Pokédex Nacional en Diamante Brillante y Perla Reluciente (Prioridad: P6)

Un usuario que juega Pokémon Diamante Brillante o Pokémon Perla
Reluciente puede activar el flag de Pokédex Nacional y ver la lista
nacional correspondiente, ya que estos son los únicos juegos de la
octava generación a los que corresponde tener esa opción.

**Por qué esta prioridad**: Es una corrección puntual de disponibilidad
de una funcionalidad ya definida en
[[004-pokedex-team-builder]]/[[005-selector-pokedex-fixes]] para un par
de juegos específico; menor alcance que las historias anteriores.

**Prueba Independiente**: Se puede probar completamente abriendo Pokémon
Diamante Brillante o Pokémon Perla Reluciente, activando el flag de
Pokédex Nacional, y confirmando que la lista nacional se muestra
correctamente (acotada a especies obtenibles en ese juego, según
[[005-selector-pokedex-fixes]] FR-010).

**Escenarios de Aceptación**:

1. **Dado** Pokémon Diamante Brillante o Pokémon Perla Reluciente,
   **Cuando** el usuario abre el armador de equipo, **Entonces** el flag
   de Pokédex Nacional está disponible para activarse.
2. **Dado** ese flag activado, **Cuando** el usuario lo visualiza,
   **Entonces** ve la Pokédex Nacional de ese juego siguiendo el mismo
   comportamiento de alcance y de actualización parcial ya definido en
   [[005-selector-pokedex-fixes]] (FR-010/FR-011).
3. **Dado** cualquier otro juego de la octava generación (por ejemplo
   Leyendas Arceus, Espada o Escudo), **Cuando** el usuario abre su
   armador de equipo, **Entonces** el flag de Pokédex Nacional no se
   ofrece, salvo que ya estuviera definido para ese juego por una
   especificación previa.

---

### Historia de Usuario 7 - Ver el nombre del juego en la pantalla de armado de equipo (Prioridad: P7)

Un usuario que está en la pantalla de armado de equipo ve, en la parte
superior, el nombre del juego que seleccionó, sin tener que volver al
selector de juego para recordarlo.

**Por qué esta prioridad**: Es una mejora de orientación y contexto de
bajo esfuerzo; no corrige datos incorrectos ni bloquea ningún flujo.

**Prueba Independiente**: Se puede probar completamente seleccionando
distintos juegos desde el catálogo y confirmando que, en cada caso, el
nombre del juego elegido aparece visible en la parte superior de la
pantalla de armado de equipo.

**Escenarios de Aceptación**:

1. **Dado** cualquier juego seleccionado, **Cuando** el usuario llega a
   la pantalla de armado de equipo, **Entonces** el nombre de ese juego se
   muestra en la parte superior de la pantalla.
2. **Dado** un juego con un DLC activo, **Cuando** el usuario visualiza la
   parte superior, **Entonces** el nombre mostrado sigue correspondiendo
   al juego base seleccionado.

---

### Historia de Usuario 8 - Usar secciones colapsables consistentes en toda la aplicación (Prioridad: P8)

Un usuario que abre cualquier pantalla con secciones colapsables (filtros,
selectores de opciones, etc.) las encuentra colapsadas por defecto; al
elegir una opción dentro de una de ellas, la sección se colapsa
automáticamente para liberar espacio; y en la versión web puede ver más
de una opción por fila dentro de la sección expandida, mientras que en
mobile ve una opción por fila.

**Por qué esta prioridad**: Es una mejora de consistencia visual y de
uso de espacio transversal a varias pantallas ya existentes
([[001-select-game]], [[004-pokedex-team-builder]],
[[005-selector-pokedex-fixes]]); no corrige datos ni desbloquea flujos,
por lo que se prioriza después de las correcciones funcionales.

**Prueba Independiente**: Se puede probar completamente abriendo
cualquier pantalla con secciones colapsables, confirmando que aparecen
colapsadas al cargar, que se colapsan solas al elegir una opción, y
comparando el número de opciones por fila entre la versión web (más de
una) y la versión mobile (una).

**Escenarios de Aceptación**:

1. **Dado** cualquier pantalla con una sección colapsable, **Cuando** el
   usuario la abre por primera vez, **Entonces** la sección aparece
   colapsada por defecto.
2. **Dado** una sección colapsable expandida, **Cuando** el usuario elige
   una opción dentro de ella, **Entonces** la sección se colapsa
   automáticamente de inmediato.
3. **Dado** una sección colapsada con una selección previa, **Cuando** el
   usuario la expande manualmente, **Entonces** ve reflejada la selección
   activa y puede elegir una opción distinta.
4. **Dado** la versión web de una sección colapsable expandida, **Cuando**
   el usuario la visualiza, **Entonces** las opciones se distribuyen en
   más de una por fila cuando el ancho de pantalla lo permite.
5. **Dado** la versión mobile de esa misma sección expandida, **Cuando**
   el usuario la visualiza, **Entonces** las opciones se distribuyen en
   una sola por fila.

---

### Historia de Usuario 9 - Ver el ícono de tipo correspondiente al juego o generación (Prioridad: P9)

Un usuario que visualiza los tipos de un Pokémon o un filtro de tipo ve
el ícono de tipo propio del juego o generación seleccionado, en lugar de
un ícono genérico o de una generación distinta.

**Por qué esta prioridad**: Refina el requisito de íconos de tipo ya
introducido en [[005-selector-pokedex-fixes]] (FR-017/FR-018),
precisando la fuente de íconos a usar; es una mejora visual sin impacto
en datos ni en flujo.

**Prueba Independiente**: Se puede probar completamente comparando el
ícono de un mismo tipo (por ejemplo "Fuego") entre dos juegos de
generaciones distintas y confirmando que cada uno usa el ícono propio de
su generación/juego, no un ícono compartido genérico.

**Escenarios de Aceptación**:

1. **Dado** un tipo mostrado en la Pokédex o en su filtro, **Cuando** el
   juego seleccionado pertenece a una generación con un set de íconos de
   tipo propio, **Entonces** se usa el ícono de ese set específico.
2. **Dado** dos juegos de generaciones distintas con íconos de tipo
   visualmente diferentes para el mismo tipo, **Cuando** el usuario
   cambia de un juego a otro, **Entonces** el ícono mostrado cambia para
   reflejar el set correspondiente al nuevo juego.
3. **Dado** un juego cuya generación no tiene un set de íconos de tipo
   propio y distinguible en la fuente de datos, **Cuando** se muestra un
   tipo, **Entonces** se usa el set de íconos disponible más cercano a esa
   generación, nunca un ícono roto o ausente.

---

### Historia de Usuario 10 - Elegir la forma, el género o la variante cosmética de un Pokémon en el equipo (Prioridad: P10)

Un usuario que agrega a su equipo un Pokémon con varias formas de
plantilla propia (por ejemplo Rotom, Arceus, Deoxys, Genesect, Zygarde)
disponibles en el juego seleccionado puede elegir cuál de esas formas
agregar, y más adelante puede cambiar esa elección desde la
tarjeta/modal de Personalización de Pokémon de ese slot (ver también
Historia 11 sobre Mega Evolución/Gigamax y Historia 12 sobre
variocolor). Si la especie tiene diferencia de género, el usuario indica
el género desde esa misma tarjeta en cualquier momento, sin que eso
bloquee agregarlo. Si la especie tiene muchas variantes puramente
cosméticas (por ejemplo los patrones de Vivillon o las manchas de
Spinda), el Pokémon se agrega con una variante por defecto sin pedir
elección previa, y el usuario puede cambiarla después desde esa misma
tarjeta si lo desea.

**Por qué esta prioridad**: Es una funcionalidad nueva (no una
corrección) que amplía lo ya definido en
[[005-selector-pokedex-fixes]] Historia 1 sobre formas regionales;
depende de que la Pokédex y los slots ya funcionen correctamente
(Historias 1 a 7), por lo que se ubica después.

**Prueba Independiente**: Se puede probar completamente seleccionando de
la Pokédex un Pokémon con formas de plantilla disponibles en el juego
actual, confirmando que se ofrece un selector de forma antes de
completar el slot y que puede cambiarse después desde la tarjeta de
Personalización de Pokémon de ese slot; agregando una especie con
diferencia de género y confirmando que el género se indica desde esa
misma tarjeta sin bloquear el agregado; y agregando una especie con
variantes cosméticas (Vivillon, Spinda) confirmando que se agrega con
una variante por defecto y que esta puede cambiarse luego desde ahí.

**Escenarios de Aceptación**:

1. **Dado** un Pokémon con más de una forma de plantilla propia (por
   ejemplo Rotom o Arceus) disponible en el juego seleccionado,
   **Cuando** el usuario lo elige desde la Pokédex para agregarlo a un
   slot, **Entonces** se le presenta un modal para elegir cuál de esas
   formas agregar antes de completar el slot.
2. **Dado** ese modal de selección de forma, **Cuando** el usuario lo
   visualiza, **Entonces** cada opción de forma se muestra con el sprite
   correspondiente a esa forma en el juego seleccionado (no el sprite
   estilo HOME), y NO incluye Mega Evolución ni formas Gigamax/Dinamax
   como opciones (ver Historia 11).
3. **Dado** un Pokémon sin formas de plantilla propia disponibles en el
   juego seleccionado, **Cuando** el usuario lo elige desde la Pokédex,
   **Entonces** se agrega directamente al slot sin mostrar el modal de
   selección de forma, sin importar si ese Pokémon tiene Mega Evolución
   o forma Gigamax/Dinamax disponible (esas se activan aparte, ver
   Historia 11).
4. **Dado** un slot ya ocupado por un Pokémon con formas de plantilla
   disponibles, **Cuando** el usuario abre la tarjeta de Personalización
   de Pokémon de ese slot, **Entonces** puede volver a elegir la forma
   igual que en el modal inicial, y el slot se actualiza según la nueva
   forma elegida.
5. **Dado** una especie con diferencia de género disponible en el juego
   seleccionado, **Cuando** el usuario la agrega a un slot, **Entonces**
   se agrega sin pedir el género de antemano, y la tarjeta de
   Personalización de Pokémon de ese slot ofrece un control para
   indicarlo, con macho preseleccionado por defecto (o hembra si la
   especie no tiene macho, o la única opción si la especie no tiene
   género).
6. **Dado** ese control de género en la tarjeta de Personalización de
   Pokémon, **Cuando** el usuario lo cambia, **Entonces** el slot refleja
   el género elegido sin afectar la forma, la variante cosmética ni la
   marca de variocolor ya asignadas.
7. **Dado** una especie con variantes puramente cosméticas (por ejemplo
   los patrones de Vivillon o las manchas de Spinda) disponible en el
   juego seleccionado, **Cuando** el usuario la agrega a un slot,
   **Entonces** se agrega directamente con una variante por defecto, sin
   mostrar el modal de selección antes de completar el slot.
8. **Dado** un slot ocupado por una especie con variantes cosméticas,
   **Cuando** el usuario abre la tarjeta de Personalización de Pokémon de
   ese slot, **Entonces** puede elegir una variante distinta de la
   asignada por defecto.

---

### Historia de Usuario 11 - Activar Mega Evolución o Gigamax/Dinamax desde botones en la tarjeta de Personalización (Prioridad: P11)

Un usuario que tiene en un slot un Pokémon capaz de Mega Evolucionar o
de usar la forma Gigamax/Dinamax en el juego seleccionado ve, en la
tarjeta de Personalización de Pokémon de ese slot, un botón con el
ícono de esa mecánica (independiente del selector de forma de la
Historia 10), y puede activarlo o desactivarlo para que el slot muestre
esa forma. El botón correspondiente a una mecánica solo aparece cuando
el Pokémon del slot puede usarla en el juego seleccionado.

**Por qué esta prioridad**: Es una funcionalidad nueva, acotada a los
Pokémon con Mega Evolución o Gigamax/Dinamax disponibles en el juego
seleccionado; depende de que la tarjeta de Personalización de Pokémon
ya exista (Historia 10), por lo que se ubica justo después.

**Prueba Independiente**: Se puede probar completamente agregando a un
slot un Pokémon con Mega Evolución disponible y confirmando que aparece
su botón en la tarjeta de Personalización, que activarlo cambia el
sprite del slot a la Mega Evolución y desactivarlo lo revierte; repitiendo
la prueba con un Pokémon con forma Gigamax/Dinamax disponible; y
confirmando que ningún botón aparece para un Pokémon sin ninguna de las
dos mecánicas disponibles en el juego seleccionado.

**Escenarios de Aceptación**:

1. **Dado** un Pokémon con Mega Evolución disponible en el juego
   seleccionado agregado a un slot, **Cuando** el usuario abre la tarjeta
   de Personalización de Pokémon de ese slot, **Entonces** ve un botón
   con el ícono de Mega Evolución.
2. **Dado** un Pokémon con forma Gigamax/Dinamax disponible en el juego
   seleccionado agregado a un slot, **Cuando** el usuario abre la tarjeta
   de Personalización de Pokémon de ese slot, **Entonces** ve un botón
   con el ícono de Gigamax/Dinamax.
3. **Dado** un Pokémon sin Mega Evolución ni forma Gigamax/Dinamax
   disponibles en el juego seleccionado, **Cuando** el usuario abre la
   tarjeta de Personalización de Pokémon de ese slot, **Entonces** no ve
   ninguno de los dos botones.
4. **Dado** el botón de Mega Evolución (o de Gigamax/Dinamax) visible en
   la tarjeta, **Cuando** el usuario lo activa, **Entonces** el slot
   muestra el sprite estilo Pokémon HOME de esa Mega Evolución (o forma
   Gigamax/Dinamax) en lugar del sprite de la forma base.
5. **Dado** ese botón activado, **Cuando** el usuario lo desactiva,
   **Entonces** el slot vuelve a mostrar el sprite de la forma base
   seleccionada (según Historia 10, si aplica).
6. **Dado** un Pokémon con Mega Evolución y forma Gigamax/Dinamax
   disponibles a la vez, **Cuando** el usuario activa uno de los dos
   botones, **Entonces** el otro se desactiva automáticamente, ya que
   ambas mecánicas son mutuamente excluyentes para un mismo slot.

---

### Historia de Usuario 12 - Marcar un Pokémon del equipo como variocolor (shiny) desde la tarjeta de Personalización (Prioridad: P12)

Un usuario que tiene un Pokémon agregado a un slot del equipo puede
marcarlo como variocolor (shiny) desde la tarjeta/modal de
Personalización de Pokémon de ese slot — la misma sección desde la que
edita forma, género y variante cosmética (Historia 10) — y al hacerlo el
sprite mostrado en el slot cambia a la versión shiny de ese Pokémon (y
forma).

**Por qué esta prioridad**: Es una funcionalidad nueva y acotada al slot
ya ocupado; no afecta la Pokédex ni la selección inicial, por lo que es
la de menor prioridad de este conjunto.

**Prueba Independiente**: Se puede probar completamente agregando
cualquier Pokémon a un slot, activando la opción de variocolor desde la
tarjeta de Personalización de Pokémon de ese slot, y confirmando que el
sprite mostrado cambia a la versión shiny; desactivándola de nuevo
confirma que vuelve a la versión normal.

**Escenarios de Aceptación**:

1. **Dado** un slot ocupado por un Pokémon, **Cuando** el usuario activa
   la opción de variocolor (shiny) desde la tarjeta de Personalización de
   Pokémon de ese slot, **Entonces** el sprite mostrado en el slot cambia
   a la versión shiny de ese Pokémon y forma.
2. **Dado** un slot marcado como variocolor, **Cuando** el usuario
   desactiva esa opción desde esa misma tarjeta, **Entonces** el sprite
   vuelve a la versión estándar (no shiny).
3. **Dado** un Pokémon o forma sin sprite shiny disponible en la fuente
   de datos (caso excepcional, ya que la fuente de datos del proyecto
   provee sprite shiny para la totalidad de los Pokémon y formas),
   **Cuando** el usuario abre la tarjeta de Personalización de Pokémon de
   ese slot, **Entonces** el sistema NO muestra la opción de variocolor
   para ese slot, en lugar de mostrarla deshabilitada o con una imagen de
   reemplazo.
4. **Dado** un slot cuya forma se cambia (Historia 10) o cuyo botón de
   Mega Evolución/Gigamax-Dinamax se activa (Historia 11) mientras está
   marcado como variocolor, **Cuando** se confirma el cambio, **Entonces**
   el slot muestra la versión shiny de la forma, Mega Evolución o
   Gigamax/Dinamax resultante.
5. **Dado** un slot ya ocupado, **Cuando** el usuario abre su tarjeta de
   Personalización de Pokémon, **Entonces** encuentra en una sola
   sección los controles de forma (si aplica), género (si aplica),
   variante cosmética (si aplica), los botones de Mega Evolución/
   Gigamax-Dinamax (si aplican) y variocolor, en lugar de tener que abrir
   controles separados para cada atributo.

### Casos Límite

- ¿Qué ocurre si un usuario tiene Blanco/Negro o Blanco 2/Negro 2
  seleccionado y la aplicación ya guardó un estado roto de una sesión
  anterior a esta corrección? El sistema DEBE poder recuperar o
  reconstruir el armador de equipo para esos juegos sin requerir que el
  usuario borre datos manualmente.
- ¿Qué ocurre si dos entradas de la Pokédex de X/Y comparten el mismo
  número regional por tratarse de formas de una misma especie (por
  ejemplo formas de género o formas cosméticas sin diferencia de tipo)?
  El sistema DEBE listarlas como una única entrada bajo ese número, no
  como entradas duplicadas.
- ¿Qué ocurre si la fuente de datos no distingue un sprite propio para
  alguno de los cinco juegos clásicos corregidos (Oro, Plata, Rojo,
  Verde, Azul) en una especie puntual? El sistema DEBE usar el sprite
  oficial más cercano disponible para esa versión específica, nunca el
  de un juego no relacionado.
- ¿Qué ocurre si un DLC agrega un área o mecánica pero ningún Pokémon
  nuevo obtenible respecto al juego principal y a los demás DLC activos?
  La grilla de ese DLC no se muestra o se muestra vacía con un aviso
  claro, sin bloquear la visualización de la grilla principal ni de las
  demás grillas de DLC.
- ¿Qué ocurre si el usuario activa un DLC y luego otro que reintroduce
  Pokémon del primero? Cada Pokémon aparece siempre en la grilla del DLC
  que lo introdujo primero según el orden canónico de los datos del
  juego, sin duplicarse entre grillas de DLC y sin importar en qué orden
  el usuario los haya activado.
- ¿Qué ocurre con una sección colapsable (Historia 8) que permite
  selección múltiple (por ejemplo varios tipos a la vez en un filtro)?
  El sistema DEBE colapsar la sección automáticamente después de cada
  cambio de selección (agregar o quitar una opción), igual que en una
  sección de selección única.
- ¿Qué ocurre si el usuario cambia de juego mientras el modal de
  selección de forma (Historia 10) está abierto? El modal se cierra sin
  agregar ningún Pokémon al slot, siguiendo el mismo criterio de
  reconciliación de estado ya definido en [[001-select-game]]
  FR-010/FR-011.
- ¿Qué ocurre si el Pokémon de un slot marcado como variocolor (Historia
  12) se quita del equipo y se reemplaza por otro? El nuevo Pokémon
  agregado a ese slot inicia sin la marca de variocolor activa, sin
  Mega Evolución/Gigamax-Dinamax activados (Historia 11) y sin forma,
  género ni variante cosmética heredados del Pokémon anterior; el
  usuario debe configurar de nuevo cada atributo que desee para el
  Pokémon nuevo.
- ¿Qué ocurre si el usuario cambia, desde el modal de selección de forma
  del slot, a una forma de plantilla distinta de una especie que también
  tenía género, variante cosmética o Mega Evolución/Gigamax-Dinamax
  asignados? El género y la variante cosmética asignados se conservan si
  siguen siendo válidos para la nueva forma; si la nueva forma no admite
  esa variante cosmética o esa diferencia de género, el sistema DEBE
  reiniciar ese atributo a su valor por defecto. Si el Pokémon tenía
  Mega Evolución o Gigamax/Dinamax activados y la nueva forma de
  plantilla no admite esa mecánica, el sistema DEBE desactivarla.
- ¿Qué variante cosmética se asigna por defecto (FR-023c) cuando el
  usuario agrega una especie con variantes puramente estéticas? El
  sistema DEBE usar la variante que la fuente de datos trata como
  variante por defecto o principal de esa especie (por ejemplo el
  patrón/mancha base), nunca una selección aleatoria entre ejecuciones.
- ¿Qué ocurre si el usuario desactiva el único DLC que desbloqueaba una
  forma adicional de una especie que ya pertenecía al juego principal o
  a otro DLC? Esa forma deja de estar disponible en el modal/tarjeta de
  selección de forma de esa especie, pero la especie en sí sigue
  apareciendo con normalidad en la grilla a la que pertenece (FR-011),
  y un slot que ya tenía esa forma seleccionada vuelve a su forma base
  por defecto.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

**Flujo y catálogo de juegos**

- **FR-001**: El sistema DEBE llevar al armador de equipo, con su
  Pokédex correspondiente cargada, al seleccionar Pokémon Blanco,
  Pokémon Negro, Pokémon Blanco 2 o Pokémon Negro 2 desde el catálogo,
  igual que con cualquier otro juego soportado.
- **FR-001a**: Cuando un cambio de juego invalida el Pokémon de un slot
  de equipo ya ocupado, el sistema DEBE dejar ese slot completamente
  vacío y disponible para agregar otro Pokémon, sin ninguna marca de
  reserva ni rastro del Pokémon anterior.
- **FR-002**: El sistema DEBE mostrar el nombre del juego seleccionado
  en la parte superior de la pantalla de armado de equipo, para todos
  los juegos soportados.

**Pokédex: numeración y sprites por juego**

- **FR-003**: El sistema DEBE mostrar la Pokédex de Pokémon X y Pokémon
  Y sin números de Pokédex regional duplicados entre entradas distintas.
- **FR-004**: El sistema DEBE mostrar la Pokédex de Pokémon X y Pokémon
  Y ordenada de forma ascendente por número de Pokédex regional.
- **FR-005**: El sistema DEBE mostrar, para cada entrada de la Pokédex
  de Pokémon Oro, el sprite oficial correspondiente a esa versión
  específica.
- **FR-006**: El sistema DEBE mostrar, para cada entrada de la Pokédex
  de Pokémon Plata, el sprite oficial correspondiente a esa versión
  específica.
- **FR-007**: El sistema DEBE mostrar, para cada entrada de la Pokédex
  de Pokémon Rojo, el sprite oficial correspondiente a esa versión
  específica, distinto del de Pokémon Verde y del de Pokémon Azul.
- **FR-008**: El sistema DEBE mostrar, para cada entrada de la Pokédex
  de Pokémon Verde, el sprite oficial correspondiente a esa versión
  específica, distinto del de Pokémon Rojo y del de Pokémon Azul.
- **FR-009**: El sistema DEBE mostrar, para cada entrada de la Pokédex
  de Pokémon Azul, el sprite oficial correspondiente a esa versión
  específica.

**Pokédex: DLC y Pokédex Nacional**

- **FR-010**: Para un juego con uno o más DLC activos, el sistema DEBE
  mostrar una grilla de Pokédex separada por cada DLC activo, ubicada
  debajo de la grilla del juego principal.
- **FR-011**: Cada grilla de DLC DEBE contener únicamente Pokémon que
  aparecen en el juego principal o en algún DLC actualmente activado;
  NO DEBE incluir Pokémon exclusivos de un DLC que el usuario no ha
  activado.
- **FR-012**: Un mismo Pokémon obtenible en más de un DLC activo a la
  vez NO DEBE aparecer duplicado en más de una grilla de DLC; DEBE
  asignarse siempre al DLC que lo introdujo primero según el orden
  canónico de la fuente de datos del juego, sin importar el orden en que
  el usuario haya activado los DLC en la sesión actual.
- **FR-013**: El sistema DEBE ofrecer el flag de Pokédex Nacional en
  Pokémon Diamante Brillante y en Pokémon Perla Reluciente, aplicando el
  mismo comportamiento de alcance y actualización parcial ya definido en
  [[005-selector-pokedex-fixes]] FR-010/FR-011.

**Secciones colapsables**

- **FR-014**: Toda sección colapsable de filtros u opciones DEBE
  mostrarse colapsada por defecto al cargar la pantalla que la contiene.
- **FR-015**: Al elegir o modificar una opción dentro de una sección
  colapsable expandida, el sistema DEBE colapsarla automáticamente.
- **FR-016**: En la versión web, una sección colapsable expandida DEBE
  distribuir sus opciones en más de una por fila cuando el ancho de
  pantalla disponible lo permita.
- **FR-017**: En la versión mobile, una sección colapsable expandida
  DEBE distribuir sus opciones en una sola por fila.

**Íconos de tipo**

- **FR-018**: El sistema DEBE mostrar, para cada tipo, el ícono
  correspondiente al set propio de la generación o juego seleccionado
  cuando ese set exista y sea distinguible en la fuente de íconos del
  proyecto.
- **FR-019**: Cuando la generación o juego seleccionado no tenga un set
  de íconos de tipo propio y distinguible, el sistema DEBE usar el set
  de íconos disponible más cercano a esa generación, nunca un ícono roto
  o ausente.

**Selección de forma, género y variante cosmética en el slot**

- **FR-020**: Al agregar desde la Pokédex un Pokémon con más de una
  forma de plantilla propia (por ejemplo Rotom, Arceus, Deoxys,
  Genesect, Zygarde, Giratina, Shaymin) disponible en el juego
  seleccionado, el sistema DEBE presentar un modal para que el usuario
  elija la forma antes de completar el slot.
- **FR-021**: El modal de selección de forma DEBE mostrar cada opción de
  forma con el sprite correspondiente a esa forma en el juego
  seleccionado; el modal NO DEBE incluir Mega Evolución ni formas
  Gigamax/Dinamax como opciones (ver FR-024a a FR-024d).
- **FR-022**: Al agregar un Pokémon sin formas de plantilla propia
  disponibles en el juego seleccionado, el sistema DEBE agregarlo
  directamente al slot sin mostrar el modal de selección de forma, sin
  importar si ese Pokémon tiene Mega Evolución o forma Gigamax/Dinamax
  disponible.
- **FR-023**: El sistema DEBE ofrecer, para cada slot de equipo ya
  ocupado, una única tarjeta/modal de "Personalización de Pokémon" que
  agrupa todos los atributos editables de ese slot — forma (si aplica),
  botones de Mega Evolución/Gigamax-Dinamax (si aplican), género (si
  aplica), variante cosmética (si aplica) y variocolor —, en lugar de
  controles separados e independientes por atributo.
- **FR-023a**: Desde la tarjeta de Personalización de Pokémon, el
  sistema DEBE permitir cambiar la forma de un Pokémon ya agregado a un
  slot, reutilizando el mismo selector de forma que en FR-020/FR-021.
- **FR-023b**: El sistema NO DEBE pedir el género de una especie con
  diferencia de género en el modal de selección de forma ni bloquear su
  agregado por esa razón; en su lugar, la tarjeta de Personalización de
  Pokémon DEBE ofrecer un control para indicar el género, preseleccionado
  en macho por defecto, en hembra si la especie no tiene macho, o en la
  única opción disponible si la especie no tiene género, editable en
  cualquier momento sin afectar la forma, la variante cosmética ni la
  marca de variocolor ya asignadas.
- **FR-023c**: El sistema NO DEBE pedir la variante cosmética de una
  especie con variantes puramente estéticas (por ejemplo los patrones de
  Vivillon o las manchas de Spinda) al agregarla; DEBE agregarla
  directamente con una variante por defecto, y DEBE permitir cambiar esa
  variante después desde la tarjeta de Personalización de Pokémon.
- **FR-024**: El slot de equipo DEBE mostrar el sprite estilo Pokémon
  HOME del Pokémon, forma, género, variante cosmética y estado de Mega
  Evolución/Gigamax-Dinamax seleccionados, independientemente del sprite
  usado en el modal de selección de forma (ver
  [[005-selector-pokedex-fixes]] FR-019).

**Mega Evolución y Gigamax/Dinamax en la tarjeta de Personalización**

- **FR-024a**: La tarjeta de Personalización de Pokémon DEBE mostrar un
  botón dedicado (con el ícono de la mecánica) para activar la Mega
  Evolución de un Pokémon del slot, únicamente cuando ese Pokémon tenga
  Mega Evolución disponible en el juego seleccionado.
- **FR-024b**: La tarjeta de Personalización de Pokémon DEBE mostrar un
  botón dedicado (con el ícono de la mecánica) para activar la forma
  Gigamax/Dinamax de un Pokémon del slot, únicamente cuando ese Pokémon
  tenga esa forma disponible en el juego seleccionado.
- **FR-024c**: Cuando un Pokémon tiene Mega Evolución y forma
  Gigamax/Dinamax disponibles a la vez, activar uno de los dos botones
  DEBE desactivar automáticamente el otro, ya que ambas mecánicas son
  mutuamente excluyentes para un mismo slot.
- **FR-024d**: Al activar el botón de Mega Evolución o de
  Gigamax/Dinamax, el sistema DEBE mostrar en el slot el sprite estilo
  Pokémon HOME de esa Mega Evolución o forma Gigamax/Dinamax; al
  desactivarlo, DEBE volver a mostrar el sprite de la forma base
  seleccionada (FR-020/FR-023a, si aplica).

**Variocolor (shiny) en el slot**

- **FR-025**: El sistema DEBE permitir marcar como variocolor (shiny) un
  Pokémon ya agregado a un slot, desde la misma tarjeta de Personalización
  de Pokémon de ese slot.
- **FR-026**: Al marcar un slot como variocolor, el sistema DEBE mostrar
  en ese slot el sprite estilo Pokémon HOME shiny del Pokémon, forma,
  género, variante cosmética y estado de Mega Evolución/Gigamax-Dinamax
  seleccionados; al desmarcarlo, DEBE volver a mostrar el sprite
  estándar (no shiny).
- **FR-026a**: Cuando un Pokémon o forma no tenga sprite shiny disponible
  en la fuente de datos, la tarjeta de Personalización de Pokémon NO
  DEBE mostrar la opción de variocolor para ese slot, en lugar de
  mostrarla deshabilitada o con una imagen de reemplazo.
- **FR-027**: Un Pokémon agregado a un slot vacío o que reemplaza a otro
  DEBE iniciar sin la marca de variocolor activa, sin Mega
  Evolución/Gigamax-Dinamax activados, y sin forma, género ni variante
  cosmética heredados del Pokémon anterior.

**Formas nuevas desbloqueadas por DLC sobre especies ya listadas**

- **FR-028**: Cuando un DLC desbloquea una forma nueva de una especie
  que ya aparece en la Pokédex del juego principal o de otro DLC activo,
  el sistema DEBE agregar esa forma nueva como una opción más en el
  modal/tarjeta de selección de forma de esa especie (FR-020/FR-021),
  en lugar de crear una entrada de Pokédex adicional o duplicada para
  esa especie en alguna grilla.
- **FR-029**: Cuando dos o más DLC activos desbloquean formas distintas
  de una misma especie ya listada, el sistema DEBE ofrecer todas esas
  formas como opciones dentro del mismo modal/tarjeta de selección de
  forma de esa especie, y DEBE mostrar esa especie una única vez en la
  grilla de Pokédex a la que ya pertenecía, sin duplicarla por cada DLC
  que le agrega una forma.

### Entidades Clave

- **Grilla de Pokédex de DLC**: Componente de lista de Pokédex adicional
  y diferenciado por cada DLC activo, ubicado debajo de la grilla del
  juego principal; limitado a Pokémon obtenibles en el juego principal o
  en algún DLC activo, sin duplicados entre grillas de DLC. Extiende el
  "Componente de Pokédex de DLC" ya definido en
  [[005-selector-pokedex-fixes]].
- **Sección Colapsable**: Cualquier bloque de filtros u opciones con
  estado colapsado/expandido; colapsada por defecto, se colapsa
  automáticamente tras cada selección, y distribuye sus opciones en una
  o más columnas según el ancho de pantalla disponible (mobile vs web).
- **Set de Íconos de Tipo**: Conjunto de íconos de tipo propio de una
  generación o juego, usado para representar cada tipo en la Pokédex y
  en sus filtros; puede variar entre generaciones/juegos.
- **Forma de Pokémon Seleccionable**: Una de las variantes de forma de
  plantilla propia (por ejemplo Rotom, Arceus, Deoxys, Genesect,
  Zygarde) de una especie, disponible para agregar al equipo en el
  juego seleccionado; puede provenir del juego principal o de cualquier
  DLC activo que la desbloquee para una especie ya existente
  (FR-028/FR-029), sin que eso cree una entrada de Pokédex adicional
  para esa especie. Se elige mediante un modal con sprites propios del
  juego antes de completar el slot, y puede modificarse después desde
  la tarjeta de Personalización de Pokémon del slot ya ocupado. No
  incluye Mega Evolución, formas Gigamax/Dinamax, diferencias de género
  ni variantes puramente cosméticas, que se modelan como entidades
  aparte.
- **Mecánica de Mega Evolución / Gigamax-Dinamax**: Estado activable
  desde un botón dedicado (con el ícono de la mecánica) en la tarjeta de
  Personalización de Pokémon de un slot ocupado; el botón de cada
  mecánica solo aparece cuando el Pokémon del slot puede usarla en el
  juego seleccionado, y activar una desactiva automáticamente la otra si
  ambas estuvieran disponibles a la vez. No es una opción del modal de
  selección de forma.
- **Tarjeta de Personalización de Pokémon**: Sección modal única,
  accesible desde un slot de equipo ya ocupado, que agrupa todos los
  atributos editables de ese slot — forma (cuando la especie tiene más
  de una disponible), botones de Mega Evolución/Gigamax-Dinamax (cuando
  aplican), género (cuando la especie lo distingue), variante cosmética
  (cuando la especie tiene variantes estéticas) y variocolor (shiny) —,
  evitando controles separados por atributo.
- **Género del Slot**: Atributo del Pokémon de un slot ocupado, aplicable
  solo a especies con diferencia de género; se indica desde la tarjeta de
  Personalización de Pokémon (no en el modal de selección de forma), con
  macho como valor por defecto, hembra si la especie no tiene macho, o
  la única opción disponible si la especie no tiene género; editable en
  cualquier momento sin afectar la forma, la variante cosmética ni la
  marca de variocolor.
- **Variante Cosmética**: Una de las variantes puramente estéticas de
  una especie (por ejemplo los patrones de Vivillon o las manchas de
  Spinda) disponible en el juego seleccionado; se asigna un valor por
  defecto al agregar el Pokémon sin requerir elección previa, y puede
  cambiarse después desde la tarjeta de Personalización de Pokémon del
  slot ya ocupado.
- **Marca de Variocolor (Shiny)**: Indicador booleano asociado a un slot
  de equipo ocupado, editable desde la tarjeta de Personalización de
  Pokémon, que determina si se muestra el sprite estilo HOME estándar o
  el shiny del Pokémon, forma, género, variante cosmética y estado de
  Mega Evolución/Gigamax-Dinamax seleccionados; no se ofrece cuando no
  existe sprite shiny para esa combinación; se reinicia al reemplazar el
  Pokémon de ese slot.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: El 100% de las selecciones de Pokémon Blanco, Negro,
  Blanco 2 y Negro 2 desde el catálogo llegan a la pantalla de armado de
  equipo con su Pokédex cargada.
- **SC-002**: La Pokédex de Pokémon X y Pokémon Y no presenta ningún
  número de Pokédex regional duplicado ni fuera de orden ascendente, en
  el 100% de las revisiones.
- **SC-003**: El 100% de los sprites mostrados en las Pokédex de Oro,
  Plata, Rojo, Verde y Azul corresponden al sprite oficial de esa
  versión específica.
- **SC-004**: Para el 100% de los DLC activos revisados, sus Pokémon
  aparecen en una grilla separada, y esa grilla no contiene ningún
  Pokémon exclusivo de un DLC no activado.
- **SC-004a**: El 100% de las especies que ya pertenecían al juego
  principal u otro DLC y reciben una forma nueva de un DLC activo se
  siguen mostrando una única vez (sin duplicarse), con esa forma
  disponible como opción en su selector de forma.
- **SC-005**: Diamante Brillante y Perla Reluciente ofrecen el flag de
  Pokédex Nacional en el 100% de las revisiones, mostrando únicamente
  especies obtenibles en ese juego al activarlo.
- **SC-006**: El 100% de las secciones colapsables aparecen colapsadas
  al cargar la pantalla que las contiene, y se colapsan automáticamente
  tras la primera selección hecha dentro de ellas.
- **SC-007**: En la versión web, el 100% de las secciones colapsables
  expandidas en pantallas suficientemente anchas muestran más de una
  opción por fila; en mobile, el 100% las muestran en una sola fila por
  opción.
- **SC-008**: El 100% de los íconos de tipo mostrados corresponden al
  set de íconos propio de la generación/juego seleccionado cuando ese
  set existe en la fuente de datos.
- **SC-009**: El 100% de los Pokémon con formas de plantilla propia
  disponibles en el juego seleccionado muestran el modal de selección de
  forma al agregarse, y el 100% de los que no tienen ninguna se agregan
  sin mostrarlo (sin importar si tienen Mega Evolución o Gigamax/Dinamax
  disponibles).
- **SC-009a**: El 100% de las especies con variantes puramente
  cosméticas (por ejemplo Vivillon o Spinda) se agregan al slot sin
  mostrar el modal de selección, con una variante por defecto asignada.
- **SC-009b**: El 100% de los slots con un Pokémon que tiene Mega
  Evolución o forma Gigamax/Dinamax disponible en el juego seleccionado
  muestran el botón correspondiente en su tarjeta de Personalización; el
  100% de los slots sin ninguna de las dos mecánicas disponibles no
  muestran ninguno de los dos botones.
- **SC-010**: Un usuario puede cambiar la forma, el género, la variante
  cosmética o el estado de Mega Evolución/Gigamax-Dinamax de un Pokémon
  ya agregado a un slot en una sola interacción adicional desde ese
  slot, sin tener que quitarlo y volver a agregarlo.
- **SC-011**: El 100% de los slots marcados como variocolor muestran el
  sprite shiny correspondiente; el 100% de los desmarcados muestran el
  sprite estándar; el 100% de los slots sin sprite shiny disponible no
  muestran la opción de variocolor.
- **SC-012**: El 100% de los slots cuyo Pokémon deja de ser válido tras
  un cambio de juego quedan vacíos y disponibles para agregar otro
  Pokémon, sin quedar marcados como reservados.

## Supuestos

- Esta feature es una segunda ronda de correcciones y mejoras sobre
  funcionalidad ya especificada e implementada en
  [[001-select-game]], [[004-pokedex-team-builder]] y
  [[005-selector-pokedex-fixes]]; reutiliza las entidades y mecanismos
  ya definidos ahí (Juego, DLC de Juego, Sesión de Construcción de
  Equipo, Entrada de Pokédex, Espacio de Equipo, Criterios de Filtro de
  Pokédex, Componente de Pokédex de DLC, Sprite Pokémon HOME) salvo
  donde se indique una extensión explícita.
- La fuente de datos externa ya utilizada por el proyecto expone, para
  cada especie y forma: sprites específicos por versión de juego
  (incluyendo Oro, Plata, Rojo, Verde y Azul), sprites estilo Pokémon
  HOME estándar y shiny, el conjunto de formas disponibles por especie y
  juego, el alcance de especies obtenibles por juego y por DLC, y sets
  de íconos de tipo agrupados por generación/juego (incluyendo el
  repositorio de íconos de tipos de PokeAPI referenciado por el
  usuario); esta feature corrige cómo se consumen y presentan esos
  datos, no introduce una fuente de datos nueva.
- "Colapsarse automáticamente tras elegir una opción" (Historia 8) se
  aplica de la misma forma tanto a secciones de selección única como a
  secciones de selección múltiple: la sección se colapsa después de
  cada cambio de selección (agregar o quitar una opción), y el usuario
  puede volver a expandirla manualmente en cualquier momento sin perder
  la selección activa.
- "Más de una opción por fila" en la versión web (Historia 8) no exige
  una cantidad fija de columnas; se espera un layout responsivo que
  aproveche el ancho disponible mostrando dos o más opciones por fila en
  anchos típicos de escritorio/tablet, degradando a una columna en
  anchos angostos equivalentes a mobile.
- A qué grilla pertenece un Pokémon obtenible en más de un DLC (FR-012)
  se decide por el orden canónico de introducción por DLC que expone la
  fuente de datos del juego (por ejemplo el orden de lanzamiento de los
  DLC), no por el orden en que el usuario los activó en la sesión
  actual; este dato es fijo y no cambia entre sesiones.
- El modal de selección de forma (Historia 10) reutiliza, para cada
  forma, el mismo tipo de sprite específico de juego ya corregido en
  esta feature y en [[005-selector-pokedex-fixes]] (por ejemplo FR-005 a
  FR-009), no un sprite genérico independiente de la forma.
- La marca de variocolor (Historia 12) es un estado local de la sesión
  de construcción de equipo, no una propiedad persistente del Pokémon
  entre sesiones distintas, salvo que un mecanismo de guardado de
  equipos ya definido en otra feature indique lo contrario.
- Activar Mega Evolución o Gigamax/Dinamax desde sus botones dedicados
  en la tarjeta de Personalización de Pokémon (Historia 11) es, para
  efectos de este armador de equipo, una elección de identidad/plantel
  del Pokémon en ese slot (qué sprite y tipos se muestran), no una
  simulación de transformación de combate; no implica agregar mecánicas
  de batalla al producto.
- La disponibilidad de Mega Evolución o de forma Gigamax/Dinamax para un
  Pokémon es un dato por especie/forma y juego que ya expone la fuente
  de datos externa del proyecto (ver [[001-select-game]]); esta feature
  no introduce un catálogo nuevo de qué Pokémon puede usar cada mecánica,
  solo la superficie (botones en la tarjeta) para activarla.
- El género (Género del Slot) y la variante cosmética (Variante
  Cosmética) son atributos independientes de la Forma de Pokémon
  Seleccionable: una especie puede combinar cualquiera de estos tres
  ejes según lo que la fuente de datos exponga para ella (por ejemplo,
  una especie con formas de plantilla no necesariamente tiene además
  diferencia de género o variantes cosméticas, y viceversa).
