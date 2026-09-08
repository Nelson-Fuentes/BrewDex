# Especificación de Feature: Selección de Idioma de la Aplicación

**Rama de Feature**: `003-select-language`

**Creado**: 2026-08-22

**Estado**: Borrador

**Entrada**: Descripción del usuario: "El usuario va a poder elegir el idioma, los idiomas serían los mismos que maneja la PokeAPI."

## Escenarios de Usuario y Pruebas *(obligatorio)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
-->

### Historia de Usuario 1 - Elegir el idioma de toda la aplicación (Prioridad: P1)

Un usuario abre la configuración de la aplicación y elige, de una lista de
idiomas, aquel en el que quiere usar BrewDex. Al confirmar la elección, se
actualizan tanto los nombres y datos de Pokémon, movimientos, habilidades y
demás contenido que proviene de la PokeAPI, como los textos propios de la
interfaz de BrewDex (botones, menús, mensajes del sistema).

**Por qué esta prioridad**: Es el punto de entrada de todo el feature — sin
la posibilidad de elegir un idioma no hay nada que probar ni que persistir;
es el mínimo indispensable para que el feature exista.

**Prueba Independiente**: Se puede probar completamente abriendo el
selector de idioma, eligiendo una opción distinta a la actual y
confirmando que tanto los nombres de Pokémon como los textos propios de la
interfaz (botones, menús) se muestran en el idioma elegido.

**Escenarios de Aceptación**:

1. **Dado** que el usuario abre el selector de idioma, **Cuando** se
   despliega la lista, **Entonces** ve únicamente los idiomas que la
   PokeAPI expone para el contenido de Pokémon.
2. **Dado** que el usuario tiene un idioma activo, **Cuando** selecciona
   uno distinto de la lista, **Entonces** tanto el contenido Pokémon
   visible en pantalla (nombres, descripciones, etc.) como los textos
   propios de la interfaz de BrewDex se actualizan al nuevo idioma.
3. **Dado** que el usuario selecciona un idioma, **Cuando** la confirmación
   se completa, **Entonces** el sistema indica claramente cuál es el
   idioma actualmente activo (por ejemplo, resaltado en la lista).

---

### Historia de Usuario 2 - Conservar el idioma elegido entre sesiones (Prioridad: P2)

Un usuario que ya eligió un idioma en una sesión anterior vuelve a abrir la
aplicación y encuentra el mismo idioma activo, sin tener que
seleccionarlo de nuevo.

**Por qué esta prioridad**: Sin persistencia, la Historia de Usuario 1 es
usable pero obliga a repetir la selección en cada sesión, lo cual degrada
la experiencia y es una expectativa básica de cualquier preferencia de
usuario.

**Prueba Independiente**: Se puede probar completamente seleccionando un
idioma distinto al predeterminado, cerrando la aplicación por completo y
volviendo a abrirla, confirmando que el idioma elegido sigue activo.

**Escenarios de Aceptación**:

1. **Dado** que el usuario seleccionó un idioma en una sesión anterior,
   **Cuando** vuelve a abrir la aplicación, **Entonces** el contenido se
   muestra en ese idioma sin acción adicional de su parte.
2. **Dado** que el usuario nunca ha seleccionado un idioma, **Cuando** abre
   la aplicación por primera vez, **Entonces** el sistema aplica un idioma
   predeterminado razonable (el del dispositivo si está entre los
   soportados, o inglés en caso contrario).

---

### Historia de Usuario 3 - Ver contenido de forma consistente cuando falta traducción (Prioridad: P3)

Un usuario con un idioma no inglés seleccionado navega por Pokémon, formas
o movimientos cuyo nombre o descripción no está traducido a ese idioma en
la PokeAPI, o encuentra un texto propio de la interfaz de BrewDex que aún
no ha sido traducido a ese idioma, y aun así ve contenido legible en lugar
de espacios vacíos o claves de traducción sin resolver.

**Por qué esta prioridad**: Mejora la robustez percibida del feature una
vez que la selección y persistencia ya funcionan; no bloquea el valor
central de poder elegir idioma, pero evita una experiencia rota en casos
reales de cobertura incompleta de la PokeAPI o de la localización propia
de BrewDex.

**Prueba Independiente**: Se puede probar completamente seleccionando un
idioma con cobertura parcial conocida y navegando a un recurso o pantalla
sin traducción en ese idioma, confirmando que se muestra un valor de
respaldo en lugar de un campo vacío o una clave sin traducir.

**Escenarios de Aceptación**:

1. **Dado** que el idioma activo no tiene traducción disponible para un
   recurso específico de la PokeAPI, **Cuando** el usuario visualiza ese
   recurso, **Entonces** el sistema muestra el nombre/descripción en el
   idioma de respaldo (inglés) en lugar de dejarlo vacío.
2. **Dado** que el idioma activo no tiene traducción disponible para un
   texto propio de la interfaz de BrewDex, **Cuando** el usuario visualiza
   esa pantalla, **Entonces** el sistema muestra ese texto en el idioma de
   respaldo (inglés) en lugar de mostrar una clave de traducción sin
   resolver o un espacio vacío.

---

### Edge Cases

- ¿Qué ocurre si el usuario cambia de idioma mientras hay contenido
  cargando desde la PokeAPI? El contenido en curso debe reflejar el nuevo
  idioma al finalizar la carga, sin mezclar idiomas en una misma pantalla.
- ¿Qué ocurre si el dispositivo no tiene conexión al cambiar de idioma y
  el contenido para ese idioma no está en caché? El sistema debe informar
  que no puede completar el cambio de contenido y mantener el último
  contenido disponible.
- ¿Qué ocurre si la PokeAPI agrega o quita un idioma de su catálogo en el
  futuro? La lista de idiomas ofrecida debe reflejar el catálogo vigente
  sin requerir una nueva versión de la aplicación para idiomas ya
  soportados por la API.
- ¿Qué ocurre si el idioma del dispositivo no es ninguno de los que
  soporta la PokeAPI? El sistema debe usar el idioma de respaldo (inglés)
  como predeterminado.
- ¿Qué ocurre si la interfaz propia de BrewDex aún no ha sido traducida a
  un idioma que sí está disponible para el contenido de la PokeAPI? El
  sistema debe mostrar el texto de interfaz en el idioma de respaldo
  (inglés) para las cadenas faltantes, sin bloquear el cambio de idioma ni
  romper la pantalla.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE permitir al usuario elegir un idioma de una
  lista compuesta únicamente por los idiomas oficiales que expone la
  PokeAPI para el contenido de Pokémon (japonés, inglés, francés, alemán,
  español, italiano, coreano, chino simplificado y chino tradicional).
- **FR-002**: El sistema DEBE mostrar cada idioma de la lista con un
  nombre reconocible para el usuario (nombre nativo o nombre común del
  idioma), no con el código técnico interno de la PokeAPI.
- **FR-003**: Al confirmar la selección de un idioma, el sistema DEBE
  actualizar tanto el contenido Pokémon visible (nombres, descripciones y
  demás texto proveniente de la PokeAPI) como los textos propios de la
  interfaz de BrewDex (botones, menús, mensajes del sistema) al idioma
  elegido.
- **FR-004**: El sistema DEBE indicar visualmente cuál es el idioma
  actualmente activo dentro del selector.
- **FR-005**: El sistema DEBE recordar el idioma elegido por el usuario y
  aplicarlo automáticamente en sesiones futuras sin requerir una nueva
  selección.
- **FR-006**: En el primer uso, sin idioma elegido previamente, el sistema
  DEBE aplicar como predeterminado el idioma del dispositivo si está entre
  los soportados por la PokeAPI, o inglés en caso contrario.
- **FR-007**: Cuando un recurso de la PokeAPI o un texto propio de la
  interfaz de BrewDex no tenga traducción disponible en el idioma activo,
  el sistema DEBE mostrar el contenido en inglés como idioma de respaldo,
  sin dejar campos vacíos ni mostrar claves de traducción sin resolver.
- **FR-008**: El usuario DEBE poder cambiar el idioma seleccionado en
  cualquier momento desde dentro de la aplicación, no solo en el primer
  uso.
- **FR-009**: El alcance de la selección de idioma DEBE cubrir tanto el
  contenido Pokémon proveniente de la PokeAPI (nombres, descripciones,
  tipos, habilidades, movimientos) como los textos propios de la interfaz
  de BrewDex (botones, menús, mensajes del sistema): ambos DEBEN
  traducirse al idioma elegido por el usuario.
- **FR-010**: El sistema DEBE mantener y exponer las traducciones de los
  textos propios de la interfaz de BrewDex para el mismo conjunto de
  idiomas que ofrece el selector (los idiomas oficiales de la PokeAPI),
  de modo que ningún idioma listado carezca de una interfaz utilizable.

### Entidades Clave

- **Idioma**: Representa una opción de idioma disponible para mostrar
  contenido Pokémon y la interfaz de BrewDex. Atributos clave:
  código/identificador (tal como lo expone la PokeAPI), nombre para
  mostrar al usuario, indicador de si es el idioma actualmente activo.
- **Preferencia de Idioma del Usuario**: Representa la elección de idioma
  guardada para un usuario/dispositivo. Atributos clave: idioma
  seleccionado, momento en que se estableció, si fue elegido explícitamente
  por el usuario o asignado por defecto.
- **Paquete de Traducción de Interfaz**: Representa el conjunto de textos
  propios de BrewDex (botones, menús, mensajes) traducidos para un idioma
  específico. Atributos clave: idioma al que corresponde, conjunto de
  textos traducidos, cobertura respecto al idioma de respaldo (inglés).

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Un usuario puede cambiar el idioma de toda la aplicación
  (contenido Pokémon e interfaz de BrewDex) en menos de 10 segundos desde
  que abre el selector.
- **SC-002**: El 100% de los idiomas ofrecidos en el selector corresponden
  exactamente a los idiomas oficiales que la PokeAPI expone para contenido
  de Pokémon, sin opciones inválidas ni faltantes.
- **SC-003**: El idioma elegido por el usuario se mantiene activo en el
  100% de los reinicios de la aplicación, sin requerir una nueva
  selección.
- **SC-004**: Ante contenido o textos de interfaz sin traducción en el
  idioma activo, el 100% de los casos muestran un valor de respaldo
  legible en lugar de un campo vacío o una clave de traducción sin
  resolver.
- **SC-005**: El 100% de las pantallas principales de BrewDex (navegación,
  selección de juego, construcción de equipo) muestran sus textos propios
  completamente traducidos en cada uno de los idiomas ofrecidos por el
  selector.

## Supuestos

- Se consideran "los idiomas que maneja la PokeAPI" los idiomas marcados
  como oficiales en su catálogo (actualmente: japonés en kana/kanji,
  inglés, francés, alemán, español, italiano, coreano, chino simplificado
  y chino tradicional). Se excluyen variantes no oficiales del catálogo
  (por ejemplo, "roomaji" o checo) por tener cobertura de contenido muy
  limitada.
- Inglés se usa como idioma de respaldo para contenido sin traducción,
  por ser el idioma con mayor cobertura de datos en la PokeAPI.
- La aplicación tiene acceso a una lista de idiomas soportados obtenida de
  la PokeAPI (directamente o mediante datos ya sincronizados); no se
  requiere que el usuario configure idiomas manualmente.
- La preferencia de idioma se guarda localmente en el dispositivo del
  usuario; no se requiere sincronización entre dispositivos para esta
  versión del feature.
- El alcance de este feature incluye traducir tanto el contenido Pokémon
  de la PokeAPI como los textos propios de la interfaz de BrewDex, para el
  mismo conjunto de idiomas oficiales de la PokeAPI (decisión confirmada
  por el usuario). La autoría/mantenimiento del contenido traducido de la
  interfaz de BrewDex se considera parte del trabajo de este feature, no
  un insumo externo ya disponible.
