# Especificación de Feature: Correcciones y Mejoras del Selector de Juego y de la Pokédex del Armador de Equipo

**Rama de Feature**: `005-selector-pokedex-fixes`

**Creado**: 2026-08-23

**Estado**: Borrador

**Entrada**: Descripción del usuario: "SELECTOR DE JUEGO: los slots con nombre largo reducen el tamaño de letra y esto los hace verse no uniformes con el resto; el buscador por generación debe ser más dinámico (botones más grandes y fijos, sin scroll, con color, y un toggle para no ocupar tanto espacio); el botón de continuar es innecesario, seleccionar el juego debe llevar directo a armar el equipo; Megadimension está saliendo como juego separado de Legends Z-A cuando en realidad es su DLC, solo debería salir Legends Z-A. ARMADOR DE EQUIPO - POKEDEX: algunas pokédex muestran los números como texto ('uno', 'dos', etc.); los sprites de Pokémon Amarillo no son los correctos; al habilitar la pokédex nacional se carga la pokédex nacional de todos los pokémon en vez de solo los que pueden salir en el juego; al habilitar ese flag se recarga toda la ventana en vez de solo ese componente; para los DLC se está mezclando la pokédex del juego base con la del DLC en vez de tener un componente adicional específico para la del DLC; las formas regionales deben tener prioridad sobre las formas base (por ejemplo Alola en Sol/Luna en vez de Kanto); los filtros de tipo y generación deben seguir el mismo criterio de diseño dinámico pedido para el selector de juego; el filtro de tipo debe tener fondo negro, letra blanca y el ícono del tipo al costado (el ícono puede variar por juego/generación); al seleccionar un pokémon y llenar el slot debe mostrarse el sprite estilo Pokémon HOME."

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Ver datos correctos en la Pokédex del armador de equipo (Prioridad: P1)

Un usuario que revisa la Pokédex de un juego ve siempre números de
Pokédex en formato numérico, sprites que corresponden realmente al juego
seleccionado (incluyendo Pokémon Amarillo), y — cuando la especie tiene
una forma regional propia de ese juego — la forma regional como forma
principal en lugar de la forma base.

**Por qué esta prioridad**: Son errores de datos que engañan directamente
al usuario sobre qué está disponible y cómo se ve cada Pokémon en el
juego elegido; socavan la confianza en toda la Pokédex (feature
004-pokedex-team-builder) y deben corregirse antes que cualquier mejora
de diseño o de flujo.

**Prueba Independiente**: Se puede probar completamente abriendo la
Pokédex de varios juegos — incluyendo uno con formas regionales (por
ejemplo Sol/Luna) y Pokémon Amarillo — y confirmando que todos los
números se muestran como dígitos, que los sprites de Amarillo son los
correctos, y que las especies con forma regional en ese juego se listan
con esa forma como principal.

**Escenarios de Aceptación**:

1. **Dado** cualquier Pokédex de cualquier juego, **Cuando** el usuario
   la visualiza, **Entonces** el número de cada entrada se muestra en
   formato numérico (por ejemplo "025"), nunca escrito en palabras.
2. **Dado** el juego Pokémon Amarillo, **Cuando** el usuario visualiza su
   Pokédex, **Entonces** cada entrada muestra el sprite oficial
   correspondiente a esa versión específica, no un sprite de otro juego.
3. **Dado** un juego con formas regionales para una especie (por ejemplo
   Sol/Luna y Rattata/Alola), **Cuando** el usuario visualiza la Pokédex
   de ese juego, **Entonces** la entrada de esa especie muestra la forma
   regional (nombre, sprite y tipos correspondientes) como forma
   principal, no la forma base.
4. **Dado** una especie sin ninguna forma regional aplicable al juego
   seleccionado, **Cuando** el usuario la visualiza, **Entonces** se
   muestra su forma base sin cambios.

---

### Historia de Usuario 2 - Ir directo al armador con un catálogo de juegos correcto (Prioridad: P2)

Un usuario elige un juego del selector y es llevado de inmediato a armar
su equipo, sin un paso de confirmación adicional; y al explorar el
catálogo solo encuentra juegos base seleccionables — un contenido
descargable como "Legends Z-A: Mega Dimension" no aparece como si fuera
un juego propio, ya que es un DLC del juego base "Legends Z-A".

**Por qué esta prioridad**: Es una corrección de flujo y de catálogo que
afecta a todos los usuarios en el primer paso de la aplicación
(001-select-game); simplifica la navegación y elimina una fuente de
confusión (un DLC listado como si fuera un juego independiente) antes de
invertir en mejoras de diseño visual.

**Prueba Independiente**: Se puede probar completamente seleccionando
cualquier juego del catálogo y confirmando que la aplicación muestra de
inmediato el armador de equipo de ese juego sin pedir ninguna
confirmación adicional; y revisando el catálogo completo para confirmar
que "Legends Z-A: Mega Dimension" no aparece como opción propia, sino
únicamente como el flag de DLC dentro de "Legends Z-A".

**Escenarios de Aceptación**:

1. **Dado** el catálogo de juegos, **Cuando** el usuario selecciona un
   juego, **Entonces** la aplicación navega de inmediato a la pantalla de
   armado de equipo de ese juego, sin requerir una acción de
   confirmación adicional.
2. **Dado** el catálogo completo de juegos, **Cuando** el usuario lo
   revisa, **Entonces** "Legends Z-A: Mega Dimension" no figura como una
   opción de juego seleccionable independiente.
3. **Dado** el juego "Legends Z-A" seleccionado, **Cuando** el usuario
   abre el armador de equipo, **Entonces** encuentra el flag de DLC
   correspondiente a "Mega Dimension" disponible ahí (según el mecanismo
   ya definido en 004-pokedex-team-builder), en lugar de tener que
   elegirlo como un juego separado.

---

### Historia de Usuario 3 - Ver el selector de juego con slots uniformes (Prioridad: P3)

Un usuario que explora el catálogo de juegos ve todos los slots de juego
con el mismo tamaño de letra, sin importar cuán largo sea el nombre de
cada juego.

**Por qué esta prioridad**: Es una corrección visual acotada a
001-select-game; mejora la percepción de calidad y consistencia del
selector, pero no bloquea ninguna funcionalidad, por lo que va después de
las correcciones de datos y de flujo.

**Prueba Independiente**: Se puede probar completamente comparando el
tamaño de letra de un slot con el nombre más largo del catálogo contra el
de un slot con un nombre corto, y confirmando que ambos usan el mismo
tamaño de fuente.

**Escenarios de Aceptación**:

1. **Dado** el catálogo de juegos con nombres de longitud variable,
   **Cuando** el usuario visualiza el selector, **Entonces** todos los
   slots muestran el nombre del juego con el mismo tamaño de letra.
2. **Dado** un slot cuyo nombre de juego no cabe completo en el espacio
   disponible al tamaño de letra uniforme, **Cuando** se renderiza,
   **Entonces** el nombre se trunca o se ajusta en el layout (por
   ejemplo con puntos suspensivos o en más de una línea) en lugar de
   reducir su tamaño de letra.

---

### Historia de Usuario 4 - Usar filtros dinámicos, grandes y con color (Prioridad: P4)

Un usuario que filtra el catálogo de juegos por generación, o la Pokédex
por tipo o por generación, interactúa con botones grandes y fijos (sin
necesidad de scroll para verlos todos), diferenciados por color, y puede
colapsar la sección de filtro cuando no la necesita para liberar espacio
en pantalla. Para el filtro de tipo, además, cada opción se ve con fondo
negro, letra blanca y el ícono del tipo correspondiente al costado.

**Por qué esta prioridad**: Es una mejora de usabilidad y diseño sobre
filtros que ya existen y funcionan (001-select-game Historia 2,
004-pokedex-team-builder Historia 3); mejora la experiencia pero no
corrige datos incorrectos ni bloquea flujos, por lo que se prioriza
después de las correcciones más críticas.

**Prueba Independiente**: Se puede probar completamente abriendo el
selector de juego y la Pokédex del armador, confirmando que los filtros
de generación y de tipo se ven como botones grandes sin scroll interno,
con color distintivo, que la sección puede colapsarse y expandirse sin
perder la selección activa, y que cada botón de tipo muestra fondo negro,
letra blanca y su ícono correspondiente.

**Escenarios de Aceptación**:

1. **Dado** el filtro de generación en el selector de juego, **Cuando**
   el usuario lo visualiza, **Entonces** todas las generaciones
   disponibles se muestran como botones grandes visibles sin necesidad de
   desplazamiento (scroll) dentro del propio filtro.
2. **Dado** ese mismo filtro, **Cuando** el usuario lo visualiza,
   **Entonces** cada botón de generación tiene un color distintivo que lo
   diferencia de los demás.
3. **Dado** el filtro de generación expandido con una generación
   seleccionada, **Cuando** el usuario lo colapsa mediante el control de
   toggle, **Entonces** la sección ocupa menos espacio en pantalla y la
   generación seleccionada permanece activa.
4. **Dado** el filtro de generación colapsado con una selección activa,
   **Cuando** el usuario lo expande de nuevo, **Entonces** ve la misma
   selección de generación reflejada en el botón correspondiente.
5. **Dado** los filtros de tipo y de generación en la Pokédex del
   armador de equipo, **Cuando** el usuario los visualiza, **Entonces**
   siguen el mismo patrón de botones grandes, fijos, con color y
   colapsables descrito en los escenarios 1 a 4.
6. **Dado** el filtro de tipo en la Pokédex, **Cuando** el usuario lo
   visualiza, **Entonces** cada opción de tipo se muestra con fondo
   negro, letra blanca, y el ícono del tipo correspondiente al costado
   del nombre.

---

### Historia de Usuario 5 - Ver el alcance correcto de la Pokédex Nacional y del DLC (Prioridad: P5)

Un usuario que activa el flag de Pokédex Nacional en un juego ve
únicamente los Pokémon que realmente pueden obtenerse en ese juego,
y la lista se actualiza sin recargar el resto de la pantalla (los slots
de equipo y los filtros activos permanecen intactos). Un usuario que
activa un flag de DLC ve los Pokémon agregados por ese DLC en un
componente de Pokédex adicional y diferenciado, sin que se mezcle ni
sobrescriba la Pokédex del juego base.

**Por qué esta prioridad**: Corrige el alcance de datos y el
comportamiento de recarga de una funcionalidad que ya existe
(004-pokedex-team-builder Historia 4); es una corrección importante de
exactitud y de rendimiento percibido, pero depende de que la Pokédex base
ya muestre datos correctos (Historia 1), por lo que se ubica después.

**Prueba Independiente**: Se puede probar completamente activando el
flag de Pokédex Nacional en un juego que lo admite y confirmando que solo
aparecen Pokémon obtenibles en ese juego (no toda la Pokédex Nacional
existente) y que los slots de equipo y los filtros activos no se
reinician; y activando el flag de un DLC y confirmando que sus Pokémon
aparecen en un componente de Pokédex separado y rotulado como tal,
adicional al de la Pokédex base.

**Escenarios de Aceptación**:

1. **Dado** un juego con Pokédex Nacional disponible, **Cuando** el
   usuario activa ese flag, **Entonces** la lista mostrada incluye
   únicamente Pokémon que pueden obtenerse en ese juego específico, no la
   totalidad de especies existentes en la franquicia.
2. **Dado** el armador de equipo con slots ya ocupados y filtros activos,
   **Cuando** el usuario activa o desactiva el flag de Pokédex Nacional,
   **Entonces** solo el componente de la lista de Pokédex se actualiza;
   los slots de equipo, los filtros activos y el resto de la pantalla no
   se reinician ni se recargan.
3. **Dado** un juego con uno o más DLC, **Cuando** el usuario activa el
   flag de un DLC específico, **Entonces** los Pokémon agregados por ese
   DLC se muestran en un componente de Pokédex adicional, claramente
   diferenciado del componente de la Pokédex del juego base, en lugar de
   mezclarse o reemplazar su contenido.
4. **Dado** ese mismo DLC activo, **Cuando** el usuario lo desactiva,
   **Entonces** el componente de Pokédex del DLC desaparece y el
   componente de la Pokédex base permanece sin alteraciones.

---

### Historia de Usuario 6 - Ver el sprite estilo Pokémon HOME al llenar un slot (Prioridad: P6)

Un usuario que agrega un Pokémon a un slot del equipo ve en ese slot el
sprite/artwork estilo Pokémon HOME de esa especie (y forma, cuando
aplica), en lugar del sprite específico del juego usado en la lista de
la Pokédex.

**Por qué esta prioridad**: Es una mejora visual acotada al slot ya
ocupado; no afecta la selección ni los datos de la Pokédex, por lo que es
la de menor prioridad dentro de este conjunto de correcciones.

**Prueba Independiente**: Se puede probar completamente agregando
cualquier Pokémon a un slot vacío y confirmando que la imagen mostrada en
ese slot corresponde al sprite estilo Pokémon HOME de esa especie/forma,
no al sprite de la entrada de Pokédex de la que se seleccionó.

**Escenarios de Aceptación**:

1. **Dado** un slot vacío, **Cuando** el usuario agrega un Pokémon desde
   la Pokédex, **Entonces** el slot muestra el sprite estilo Pokémon HOME
   de ese Pokémon.
2. **Dado** un Pokémon con una forma regional como forma principal para
   el juego seleccionado (ver Historia 1), **Cuando** se agrega a un
   slot, **Entonces** el sprite estilo Pokémon HOME mostrado corresponde
   a esa forma regional, no a la forma base.
3. **Dado** un Pokémon o forma sin sprite estilo Pokémon HOME disponible
   en la fuente de datos, **Cuando** se agrega a un slot, **Entonces** se
   muestra una imagen de reemplazo clara en lugar de un espacio roto o
   vacío.

### Casos Límite

- ¿Qué ocurre con el tamaño de letra uniforme (Historia 3) si el nombre
  de un juego es tan largo que ni truncándolo cabe en una sola línea
  junto al resto de los elementos del slot? El sistema DEBE truncar con
  puntos suspensivos y ofrecer el nombre completo mediante un mecanismo
  accesible (por ejemplo un tooltip o texto alternativo), nunca reducir
  el tamaño de letra por debajo del uniforme.
- ¿Qué ocurre si un DLC no agrega ningún Pokémon nuevo respecto a la
  Pokédex base? El componente de Pokédex del DLC no se muestra o se
  muestra vacío con un aviso claro, sin bloquear la visualización de la
  Pokédex base.
- ¿Qué ocurre si una especie tiene más de una forma regional posible
  para el mismo juego (por ejemplo variantes dentro de una misma
  región)? El sistema DEBE mostrar como forma principal la que ese juego
  específico trata como la forma por defecto de esa especie en su
  Pokédex regional, según la fuente de datos ya utilizada por el
  proyecto.
- ¿Qué ocurre si el usuario colapsa el filtro de generación o de tipo
  mientras hay una búsqueda por texto activa? La búsqueda por texto no se
  ve afectada por el estado colapsado/expandido del filtro de botones.
- ¿Qué ocurre si la fuente de datos no distingue un sprite propio para
  Pokémon Amarillo para una especie determinada? El sistema DEBE usar el
  sprite correcto y oficial más cercano disponible para esa versión,
  nunca un sprite de un juego no relacionado, y documentar el criterio de
  selección de sprite como parte de la corrección.
- ¿Qué ocurre si el usuario cambia de juego (001-select-game) mientras el
  componente de Pokédex de un DLC está visible? El componente de Pokédex
  del DLC se descarta junto con el resto del estado del armador ya
  reconciliado según 001-select-game FR-010/FR-011.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

**Selector de juego**

- **FR-001**: El sistema DEBE mostrar el nombre de cada juego en todos
  los slots del selector con el mismo tamaño de letra, sin reducirlo en
  función de la longitud del nombre.
- **FR-002**: Cuando el nombre de un juego no cabe completo en el
  espacio del slot al tamaño de letra uniforme, el sistema DEBE truncarlo
  (por ejemplo con puntos suspensivos) o ajustar el layout del slot en
  lugar de reducir el tamaño de letra.
- **FR-003**: El sistema DEBE presentar el filtro de generación del
  selector de juego como un conjunto de botones lo bastante grandes para
  ser legibles y presionables cómodamente, visibles todos a la vez sin
  necesidad de scroll interno del propio filtro.
- **FR-004**: El sistema DEBE diferenciar visualmente cada botón de
  generación del filtro mediante color.
- **FR-005**: El sistema DEBE ofrecer un control de tipo toggle para
  colapsar y expandir la sección del filtro de generación, conservando la
  generación seleccionada al colapsar y al volver a expandir.
- **FR-006**: Al seleccionar un juego del catálogo, el sistema DEBE
  navegar de inmediato a la pantalla de armado de equipo de ese juego,
  sin requerir una acción de confirmación adicional (por ejemplo un botón
  "continuar").
- **FR-007**: El catálogo de juegos NO DEBE listar un contenido
  descargable (por ejemplo "Legends Z-A: Mega Dimension") como una opción
  de juego seleccionable independiente; ese contenido DEBE exponerse
  únicamente como un flag de DLC de su juego base correspondiente, según
  el mecanismo ya definido en 004-pokedex-team-builder (FR-018/FR-019).

**Pokédex del armador de equipo**

- **FR-008**: El sistema DEBE mostrar el número de Pokédex de cada
  entrada en formato numérico en todos los casos, nunca como una palabra
  escrita.
- **FR-009**: El sistema DEBE mostrar, para el juego Pokémon Amarillo, el
  sprite oficial correspondiente a esa versión específica para cada
  entrada de su Pokédex.
- **FR-010**: Cuando el flag de Pokédex Nacional está activo, el sistema
  DEBE limitar la lista mostrada a los Pokémon que pueden obtenerse en el
  juego seleccionado, sin incluir especies que no están disponibles en
  ese juego.
- **FR-011**: Activar o desactivar el flag de Pokédex Nacional DEBE
  actualizar únicamente el componente de la lista de Pokédex, sin
  reiniciar ni recargar los slots de equipo, los filtros activos, ni
  ningún otro elemento de la pantalla del armador.
- **FR-012**: Para un juego con uno o más DLC activos, el sistema DEBE
  mostrar los Pokémon agregados por cada DLC en un componente de Pokédex
  adicional y diferenciado del componente de la Pokédex del juego base,
  en lugar de fusionarlos o sobrescribir su contenido.
- **FR-013**: Desactivar el flag de un DLC DEBE retirar su componente de
  Pokédex adicional sin alterar el componente de la Pokédex base.
- **FR-014**: Cuando una especie tiene una forma regional específica del
  juego seleccionado, el sistema DEBE mostrar esa forma regional (nombre,
  sprite y tipos) como la forma principal de esa entrada de Pokédex, en
  lugar de su forma base.
- **FR-015**: Para una especie sin forma regional aplicable al juego
  seleccionado, el sistema DEBE mostrar su forma base sin cambios.
- **FR-016**: El sistema DEBE presentar los filtros de tipo y de
  generación de la Pokédex siguiendo el mismo patrón de diseño exigido en
  FR-003 a FR-005 (botones grandes y fijos sin scroll interno,
  diferenciados por color, y colapsables mediante un toggle que conserva
  la selección activa).
- **FR-017**: Cada opción del filtro de tipo DEBE mostrarse con fondo
  negro, letra blanca, y el ícono correspondiente a ese tipo junto al
  nombre.
- **FR-018**: El ícono mostrado para cada tipo en el filtro DEBE
  corresponder al conjunto de íconos propio del juego o generación
  actualmente seleccionado cuando la fuente de datos distinga íconos por
  juego/generación.
- **FR-019**: Al agregar un Pokémon a un slot de equipo, el sistema DEBE
  mostrar en ese slot el sprite estilo Pokémon HOME de ese Pokémon (y de
  su forma regional cuando esta sea la forma principal según FR-014), en
  lugar del sprite usado en la lista de la Pokédex.
- **FR-020**: El sistema DEBE mostrar una imagen de reemplazo clara en
  lugar de un espacio roto o vacío cuando no exista un sprite estilo
  Pokémon HOME disponible para el Pokémon o la forma agregada a un slot.

### Entidades Clave

- **Slot de Juego**: La opción visual seleccionable de un juego dentro
  del catálogo (001-select-game); ahora con una restricción de tamaño de
  letra uniforme y de truncado en lugar de reescalado de fuente.
- **Filtro de Botones Fijos**: El control de filtrado (por generación en
  el selector de juego; por tipo o por generación en la Pokédex)
  presentado como botones grandes, con color propio por opción, visibles
  sin scroll interno, y con un toggle de colapsar/expandir que conserva
  la selección activa.
- **Juego Base y DLC**: Relación ya definida en 004-pokedex-team-builder
  entre un Juego seleccionable y su(s) DLC; se corrige para que un
  contenido descargable (por ejemplo "Legends Z-A: Mega Dimension") nunca
  se represente como un Juego propio, sino siempre como un DLC de su
  Juego base.
- **Forma Regional**: Una variante de una especie propia de una región o
  juego específico (por ejemplo forma de Alola, de Galar, de Hisui o de
  Paldea). Cuando existe una forma regional aplicable al juego
  seleccionado, se convierte en la forma principal mostrada para esa
  especie en la Pokédex de ese juego.
- **Componente de Pokédex de DLC**: Un componente de lista adicional y
  diferenciado del componente de la Pokédex base, que muestra únicamente
  los Pokémon agregados por un DLC activo; puede coexistir con el
  componente base sin alterarlo.
- **Sprite Pokémon HOME**: La ilustración/artwork estilo Pokémon HOME de
  una especie y forma, usada específicamente para representar un Pokémon
  ya agregado a un slot de equipo, distinta del sprite de esa entrada en
  la lista de la Pokédex.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: El 100% de los slots del selector de juego muestran el
  nombre del juego con el mismo tamaño de letra, sin importar su
  longitud.
- **SC-002**: Un usuario puede ver todas las opciones de generación del
  filtro (del selector de juego o de la Pokédex) sin necesidad de hacer
  scroll dentro del propio filtro, en el 100% de los casos.
- **SC-003**: Seleccionar un juego lleva al usuario a la pantalla de
  armado de equipo en una sola interacción, sin pasos de confirmación
  adicionales, en el 100% de las selecciones.
- **SC-004**: El catálogo de juegos contiene 0 entradas de contenido
  descargable listadas como juegos independientes seleccionables.
- **SC-005**: El 100% de los números de Pokédex mostrados en cualquier
  vista se presentan en formato numérico.
- **SC-006**: El 100% de los sprites mostrados para Pokémon Amarillo
  corresponden al sprite oficial de esa versión.
- **SC-007**: Al activar la Pokédex Nacional, el 100% de los Pokémon
  mostrados adicionalmente son obtenibles en el juego seleccionado.
- **SC-008**: Activar o desactivar la Pokédex Nacional actualiza la lista
  visible sin que los slots de equipo ni los filtros activos pierdan su
  estado, en el 100% de los casos observados.
- **SC-009**: Para un juego con DLC activo, un usuario puede distinguir a
  simple vista qué Pokémon provienen del DLC y cuáles del juego base,
  gracias a que aparecen en componentes de Pokédex separados.
- **SC-010**: El 100% de las especies con forma regional aplicable al
  juego seleccionado se muestran con esa forma regional como forma
  principal en la Pokédex de ese juego.
- **SC-011**: Un usuario puede identificar el tipo representado por una
  opción del filtro de tipo a simple vista (por color de fondo, letra e
  ícono) sin necesidad de leer detenidamente el nombre.
- **SC-012**: El 100% de los slots de equipo ocupados muestran el sprite
  estilo Pokémon HOME del Pokémon agregado.

## Supuestos

- Esta feature es un conjunto de correcciones y mejoras sobre
  funcionalidad ya especificada e implementada en
  [[001-select-game]] y [[004-pokedex-team-builder]]; no introduce
  pantallas ni flujos nuevos, y reutiliza las entidades ya definidas
  ahí (Juego, DLC de Juego, Sesión de Construcción de Equipo, Entrada
  de Pokédex, Espacio de Equipo, Criterios de Filtro de Pokédex).
- "Legends Z-A: Mega Dimension" es el contenido descargable del juego
  "Legends Z-A" y actualmente está mal clasificado en el catálogo como
  si fuera un juego base independiente; corregirlo significa
  reclasificarlo como DLC de "Legends Z-A" usando el mecanismo de DLC ya
  definido en 004-pokedex-team-builder, no eliminar ese contenido del
  producto.
- La fuente de datos externa ya utilizada por el proyecto (ver
  001-select-game) expone, para cada especie: variantes/formas
  regionales, sprites específicos por versión de juego (incluyendo
  Amarillo), sprites estilo Pokémon HOME, y el alcance de especies
  obtenibles por juego; esta feature corrige cómo se consumen y
  presentan esos datos, no introduce una fuente de datos nueva.
- "Forma principal" para un juego con formas regionales significa la
  forma que la Pokédex regional de ese juego trata como su entrada por
  defecto para esa especie (por ejemplo Alola en Sol/Luna, Galar en
  Espada/Escudo, Hisui en Leyendas Arceus, Paldea en Escarlata/Púrpura);
  los juegos sin formas regionales propias no se ven afectados por este
  cambio.
- El estado por defecto (colapsado o expandido) de los filtros de
  botones fijos al abrir cada pantalla queda a criterio del diseño
  visual; el requisito funcional cubierto es que el toggle exista, sea
  reversible, y nunca pierda la selección activa al cambiar de estado.
- Los íconos de tipo por juego/generación (FR-018) reutilizan el
  conjunto de íconos ya disponible en la fuente de datos o en el sistema
  de diseño del proyecto ([[002-material-design-ui]]); esta feature no
  requiere diseñar un set de íconos nuevo desde cero.
- El componente de Pokédex de DLC (FR-012/FR-013) es un agregado visual y
  de datos adicional al de la Pokédex base; un Pokémon de un DLC sigue
  pudiendo agregarse a cualquier slot de equipo disponible de la misma
  forma que uno de la Pokédex base o nacional.
