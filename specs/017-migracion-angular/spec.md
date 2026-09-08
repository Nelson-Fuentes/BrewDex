# Feature Specification: Migración de BrewDex a Angular

**Feature Branch**: `[017-migracion-angular]`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Migrar BrewDex de Flutter (Dart, arquitectura hexagonal con capas domain/application/infrastructure/presentation, flutter_bloc para estado, PokeAPI como fuente de datos, soporte multi-idioma vía flutter_localizations/l10n) a una aplicación web construida con Angular, preservando toda la funcionalidad actual: selección de idioma, selección de juego/generación (con DLCs), y el constructor de equipos (Pokedex filtrable, selección de Pokémon, formas/variantes cosméticas, movimientos y moveset por defecto, análisis de cobertura de tipos, validación de roster). La app Angular debe reproducir el diseño y layout responsive actual (breakpoints, adaptive scaffold, paneles de dos columnas), mantener la arquitectura por capas (dominio/aplicación/infraestructura/presentación) traducida a convenciones Angular idiomáticas (servicios, stores/NgRx o signals para estado, componentes standalone), consumir la misma PokeAPI, y conservar el soporte de los mismos idiomas ya localizados (en, es, fr, de, it, ja, ko, zh). Debe incluir persistencia local equivalente (idioma activo, juego seleccionado, roster del equipo) usando almacenamiento del navegador. El objetivo final es dejar de mantener la versión Flutter y que Angular sea la única plataforma soportada (aplicación web, sin apps nativas móviles por ahora)."

## Clarifications

### Session 2026-09-06

- Q: ¿Qué debe pasar con los datos ya guardados por una persona en la app Flutter (idioma, juego/DLC, equipo) cuando empiece a usar la nueva app web — deben poder recuperarlos de alguna forma, o es aceptable que empiecen de cero en la web? → A: Empezar de cero es aceptable: no se requiere ninguna forma de exportar/importar datos entre la app Flutter y la app web.
- Q: ¿Qué nivel mínimo de soporte de navegador/dispositivo debe garantizar la app web? → A: Navegadores modernos (últimas versiones de Chrome/Edge/Firefox/Safari, escritorio y móvil) + instalable como PWA (ícono propio, se abre como app), sin exigir funcionamiento offline.
- Q: ¿Qué nivel de accesibilidad debe cumplir la app web? → A: Cumplimiento formal de WCAG 2.1 nivel AA, con criterios de aceptación auditables (contraste mínimo, foco visible, compatibilidad con lectores de pantalla, etc.).
- **Corrección post-clarificación (2026-09-06)**: la persona indicó que nunca pidió persistencia de datos en ningún sentido — la app se construye "de cero" y no debe guardar idioma, juego/DLC ni equipo entre visitas o sesiones. Esto **reemplaza** todo lo anterior sobre persistencia local y sobre continuidad de datos Flutter→web (esa pregunta queda sin efecto: no hay nada que persistir en ninguna de las dos plataformas, así que tampoco hay nada que migrar). También confirmó que la versión Flutter queda descartada desde ahora — no solo "al completar" la migración — y por eso se migra a Angular.
- **Corrección de alcance (2026-09-06)**: se elimina de esta migración el análisis de cobertura de tipos del equipo (antes User Story 3, FR-015/FR-016 y las menciones correspondientes en Success Criteria); se reconstruirá desde cero como trabajo aparte más adelante, fuera del alcance de esta spec.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Elegir idioma y juego al entrar (Priority: P1)

Una persona abre BrewDex por primera vez (o vuelve a abrirla) en el navegador y necesita ver la interfaz en su idioma y elegir el juego de Pokémon para el que va a construir su equipo, incluyendo las expansiones/DLC del juego elegido cuando existan.

**Why this priority**: Es el punto de entrada obligatorio de toda la aplicación: sin idioma y juego seleccionados no hay forma de llegar al constructor de equipos. Es también el flujo más simple de verificar end-to-end en la nueva plataforma, por lo que sirve de "hola mundo" para validar que la migración funciona.

**Independent Test**: Puede probarse por completo abriendo la app, seleccionando un idioma de la lista de idiomas soportados, seleccionando un juego (filtrando/buscando por generación si se desea) y activando cualquier DLC disponible, sin necesidad de llegar al constructor de equipos.

**Acceptance Scenarios**:

1. **Given** una persona abre la app, **When** la app carga, **Then** se le presenta un selector de idioma con los idiomas soportados y una preselección razonable (idioma del dispositivo si está soportado, si no un idioma por defecto).
2. **Given** una persona está en el selector de juego, **When** filtra por generación o busca por nombre, **Then** solo ve los juegos que coinciden con el filtro/búsqueda.
3. **Given** una persona selecciona un juego que tiene DLCs, **When** activa uno o más DLCs, **Then** esa elección queda asociada a la sesión de construcción de equipo para ese juego mientras dura la sesión.
4. **Given** una persona ya seleccionó un idioma o un juego durante la sesión actual, **When** cambia de una pantalla a otra dentro de esa misma sesión, **Then** su elección se mantiene sin tener que repetirla, pudiendo cambiarla si lo desea.

---

### User Story 2 - Construir un equipo de hasta 6 Pokémon (Priority: P1)

Una persona, ya con juego seleccionado, navega la Pokédex correspondiente a ese juego (y sus DLC activos), filtra/busca Pokémon, y va agregando hasta 6 al equipo, eligiendo para cada uno su forma/variante cosmética, tipo tera (si aplica) y sus movimientos (con un moveset por defecto sugerido que puede cambiar).

**Why this priority**: Es el valor central del producto — todo lo demás (idioma, selección de juego) existe para habilitar esta funcionalidad. Sin esto no hay producto.

**Independent Test**: Puede probarse de forma independiente (asumiendo que ya existe un juego seleccionado) agregando Pokémon al equipo desde la Pokédex, personalizando cada slot, y confirmando que el equipo refleja esos cambios.

**Acceptance Scenarios**:

1. **Given** una Pokédex cargada para el juego/DLC activos, **When** la persona busca por nombre o filtra por tipo/otros criterios, **Then** la lista muestra solo las entradas que cumplen esos criterios.
2. **Given** una entrada de la Pokédex, **When** la persona la selecciona para agregarla al equipo, **Then** ocupa el primer slot vacío disponible (hasta un máximo de 6).
3. **Given** un equipo con 6 Pokémon ya asignados, **When** la persona intenta agregar un séptimo, **Then** el sistema se lo impide y comunica que el equipo está completo.
4. **Given** un Pokémon con formas o variantes cosméticas seleccionables (p. ej. mega evolución, gigamax, variantes regionales/de género), **When** la persona abre las opciones del slot, **Then** puede elegir entre las formas/variantes válidas para ese Pokémon en ese juego.
5. **Given** un Pokémon agregado al equipo, **When** la persona abre la selección de movimientos, **Then** ve un moveset por defecto ya aplicado y puede reemplazar cada movimiento por otro válido para ese Pokémon en esa forma en ese juego.
6. **Given** un slot del equipo ocupado, **When** la persona lo quita del equipo, **Then** el slot vuelve a quedar vacío y disponible.

---

### Edge Cases

- ¿Qué pasa si la fuente de datos de Pokémon (catálogo de juegos, Pokédex, movimientos) no responde o responde con error? El sistema debe mostrar un mensaje claro y permitir reintentar, sin dejar la interfaz en un estado ambiguo o roto.
- ¿Qué pasa si el idioma activo no tiene traducción disponible para un contenido específico (nombre de Pokémon, movimiento, etc.)? El sistema debe recurrir a un idioma de reserva (inglés) para ese contenido puntual sin romper el resto de la interfaz.
- ¿Qué pasa si la persona cambia de juego teniendo ya un equipo construido para el juego anterior, dentro de la misma sesión? El sistema debe advertir claramente qué ocurre con ese equipo (se pierde) antes de confirmar el cambio.
- ¿Qué pasa si la persona recarga la página o cierra y reabre la app? Toda selección en curso (idioma, juego, DLC, equipo) se pierde; la app vuelve a arrancar sin ninguna selección previa, igual que la primera vez que se abre.
- ¿Qué pasa en pantallas muy angostas (móvil) frente a pantallas anchas (escritorio)? El layout debe adaptarse (paneles apilados vs. paneles lado a lado) sin perder acceso a ninguna función.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer, como aplicación web (sin apps nativas de escritorio o móvil requeridas), la funcionalidad de esta migración: selección de idioma, selección de juego/generación con DLCs, y construcción de equipo (Pokédex filtrable, selección de Pokémon, formas/variantes cosméticas, movimientos con moveset por defecto). El análisis de cobertura de tipos de la versión Flutter queda fuera de esta migración; se reconstruirá desde cero en una iteración posterior.
- **FR-002**: El sistema DEBE presentar la interfaz en el idioma seleccionado por la persona, soportando como mínimo los mismos idiomas ya localizados en la versión actual: inglés, español, francés, alemán, italiano, japonés, coreano y chino.
- **FR-003**: El sistema DEBE preseleccionar un idioma razonable al cargar (el del dispositivo/navegador si está soportado; en caso contrario, un idioma por defecto), y DEBE permitir a la persona cambiarlo en cualquier momento durante la sesión.
- **FR-004**: El sistema DEBE presentar un catálogo de juegos de Pokémon seleccionables, permitiendo filtrar por generación y buscar por nombre.
- **FR-005**: El sistema DEBE representar cada lanzamiento conjunto (p. ej. una pareja de versiones vendida junta) como una única opción de juego, nunca como dos opciones separadas.
- **FR-006**: El sistema DEBE mostrar, para el juego seleccionado, las expansiones/DLC disponibles como opciones activables (no como juegos independientes), y DEBE mantener cuáles están activas mientras dure la sesión de construcción de equipo de ese juego.
- **FR-007**: El sistema DEBE permitir a la persona cambiar el juego seleccionado (y sus DLC activos) en cualquier momento durante la sesión.
- **FR-008**: El sistema DEBE mostrar una Pokédex específica del juego (y DLC activos) seleccionados, incluyendo para cada entrada al menos: nombre localizado, número de Pokédex correspondiente, tipo(s), sprite/artwork, y estadísticas base.
- **FR-009**: El sistema DEBE permitir filtrar y buscar dentro de la Pokédex (por nombre y por tipo, como mínimo).
- **FR-010**: El sistema DEBE permitir agregar una entrada de la Pokédex al equipo activo, ocupando un slot vacío, hasta un máximo de 6 Pokémon por equipo.
- **FR-011**: El sistema DEBE impedir agregar un séptimo Pokémon a un equipo que ya tiene 6, e informar claramente por qué no se puede.
- **FR-012**: El sistema DEBE permitir quitar un Pokémon de cualquier slot del equipo, dejándolo vacío y disponible de nuevo.
- **FR-013**: El sistema DEBE permitir, para un Pokémon en el equipo, elegir entre las formas o variantes cosméticas válidas para ese Pokémon en el juego seleccionado (incluyendo, cuando existan, variantes de género, mega evolución y gigamax).
- **FR-014**: El sistema DEBE sugerir un moveset por defecto al agregar un Pokémon al equipo, y DEBE permitir a la persona reemplazar cada movimiento por otro válido para ese Pokémon en ese juego.
- **FR-015**: El sistema NO DEBE persistir datos entre visitas o sesiones: idioma, juego/DLC y equipo existen solo mientras dura la sesión actual (pestaña/carga de página abierta), y cada nueva carga de la app DEBE arrancar sin ninguna selección previa, igual que la primera vez.
- **FR-016**: El sistema DEBE advertir a la persona sobre qué ocurrirá con el equipo actual antes de confirmar un cambio de juego que lo afecte, dentro de la misma sesión.
- **FR-017**: El sistema DEBE mostrar un mensaje claro y una opción de reintentar cuando la fuente de datos de Pokémon (catálogo de juegos, Pokédex, movimientos) no esté disponible o responda con error.
- **FR-018**: El sistema DEBE recurrir al idioma de reserva (inglés) para cualquier contenido puntual (nombre de Pokémon, movimiento, etc.) que no tenga traducción en el idioma activo, sin afectar el resto de la interfaz.
- **FR-019**: El sistema DEBE adaptar su layout a distintos tamaños de pantalla (desde móvil hasta escritorio), preservando el acceso a toda la funcionalidad en cualquiera de ellos, y reproduciendo el comportamiento responsive ya existente (paneles apilados en pantallas angostas, paneles lado a lado en pantallas anchas).
- **FR-020**: El sistema DEBE mantener visualmente la identidad de diseño actual de BrewDex (tema, paleta por generación, iconografía de tipos) de forma reconocible para quien ya usó la versión anterior.
- **FR-021**: La versión Flutter queda descartada desde ahora; la aplicación web construida en esta migración es, desde su primera versión utilizable, la única plataforma de referencia para nuevas funcionalidades y correcciones.
- **FR-022**: El sistema DEBE funcionar correctamente en las últimas versiones de los navegadores modernos más usados (Chrome, Edge, Firefox, Safari), tanto en escritorio como en móvil, sin requerir la instalación de una app nativa.
- **FR-023**: El sistema DEBE poder instalarse desde el navegador como aplicación (PWA) en escritorio y móvil, obteniendo su propio ícono y abriéndose como una app independiente, sin que esto exija que la app funcione sin conexión a internet ni que persista datos entre sesiones.
- **FR-024**: El sistema DEBE cumplir el estándar de accesibilidad WCAG 2.1 nivel AA (contraste mínimo de color, navegación e interacción completas por teclado, foco visible, compatibilidad con lectores de pantalla y textos alternativos en imágenes/iconos con significado) en todas sus pantallas.

### Key Entities

- **Idioma soportado**: Un idioma en el que la persona puede usar la app; tiene un código de referencia (usado para pedir contenido localizado a la fuente de datos) y un nombre visible para la persona.
- **Juego**: Una opción seleccionable de juego de Pokémon (pudiendo representar un lanzamiento conjunto de dos versiones como una sola opción); tiene un identificador estable, un nombre visible, una generación, y una lista de expansiones/DLC disponibles.
- **DLC / Expansión**: Una ampliación de contenido asociada a un juego concreto, activable u desactivable dentro de la sesión de construcción de equipo de ese juego.
- **Sesión de construcción de equipo**: El estado de trabajo de una persona para un juego (y DLC activos) concretos: qué Pokédex está viendo, qué filtros tiene aplicados, y el equipo en construcción. Vive solo en memoria mientras la app está abierta; no se guarda entre visitas.
- **Entrada de Pokédex**: Un Pokémon tal como aplica a un juego (y vista de Pokédex) concretos; incluye nombre localizado, número de Pokédex, tipo(s), estadísticas base, sprites/artwork, formas/variantes seleccionables, y variantes cosméticas.
- **Slot de equipo**: Una de las hasta 6 posiciones de un equipo; puede estar vacía o contener un Pokémon con su forma/variante elegida y su moveset.
- **Movimiento**: Una habilidad/ataque que puede asignarse a un Pokémon en un slot, válido según el Pokémon y el juego seleccionados.
- **Roster del equipo**: El conjunto de slots (vacíos u ocupados) que representa el equipo de la persona para el juego/DLC activos, vigente solo durante la sesión actual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona nueva puede seleccionar idioma, seleccionar juego (con DLC si aplica) y agregar su primer Pokémon al equipo en menos de 2 minutos, sin instrucciones externas.
- **SC-002**: El 100% de las funcionalidades incluidas en esta migración (selección de idioma, selección de juego/generación/DLC, Pokédex filtrable, construcción de equipo de hasta 6 Pokémon con formas/variantes y movimientos) están disponibles y funcionan de forma equivalente en la nueva versión web dentro de una misma sesión.
- **SC-003**: La app se usa correctamente (sin pérdida de funcionalidad) tanto en una pantalla de móvil como en una de escritorio, sin necesidad de instrucciones distintas para cada una.
- **SC-004**: Ante una falla temporal de la fuente de datos de Pokémon, el 100% de las pantallas que dependen de ella muestran un mensaje comprensible y una forma de reintentar, en vez de quedar en blanco o congeladas.
- **SC-005**: Desde el momento en que la nueva versión web está disponible, no quedan cambios de producto pendientes que solo puedan aplicarse en la versión Flutter — toda nueva solicitud puede resolverse íntegramente sobre la versión web.
- **SC-006**: Una persona que antes usaba la app nativa en su móvil puede instalar la app web desde su navegador y acceder a ella con su propio ícono, igual que hacía con la app nativa.
- **SC-007**: Una persona que navega la app solo con teclado o con un lector de pantalla puede completar el flujo completo (idioma → juego/DLC → construir equipo) sin quedar bloqueada en ningún paso, y una auditoría automatizada de accesibilidad no reporta incumplimientos de WCAG 2.1 AA.

## Assumptions

- El público objetivo sigue siendo el mismo: personas que arman equipos Pokémon para un juego concreto, usando un navegador de escritorio o móvil moderno con conectividad a internet estable.
- La app no persiste ningún dato entre visitas ni sesiones: idioma, juego/DLC y equipo son estado transitorio de la sesión actual y se pierden al recargar o cerrar la app; esto es una decisión explícita del negocio, no una limitación técnica a resolver (corrección post-clarificación, 2026-09-06).
- Por no haber persistencia en ninguna de las dos plataformas, no aplica ninguna migración ni exportación/importación de datos entre la app Flutter y la app web; cada apertura de cualquiera de las dos ya empieza de cero.
- El funcionamiento sin conexión (offline) queda fuera de alcance de esta migración: basta con que la app sea instalable (PWA); esto es independiente de que no persista datos entre sesiones.
- La fuente de datos de Pokémon (catálogo de juegos, Pokédex, movimientos, traducciones) sigue siendo la misma ya usada por la versión Flutter (PokeAPI); esta migración no cambia esa fuente, solo la plataforma que la consume.
- Las apps nativas de escritorio/móvil (Android, iOS y equivalentes) quedan fuera de alcance de esta migración; "aplicación web" cubre el objetivo de plataforma única.
- El diseño visual (colores, iconografía, layout responsive) debe percibirse como una continuación de la marca BrewDex actual, no como un rediseño; ajustes visuales menores derivados de la nueva plataforma son aceptables mientras no cambien la identidad reconocible.
- El tamaño de equipo máximo (6 Pokémon) y las reglas de validación de roster ya existentes se mantienen sin cambios de negocio; la migración no introduce ni retira reglas de juego.
- La versión Flutter queda descartada desde ahora (no se sigue desarrollando en paralelo); la app web es la única plataforma de referencia desde su primera versión utilizable, sin período de coexistencia prolongada.
- El análisis de cobertura de tipos queda explícitamente fuera de alcance de esta migración; se construirá desde cero como una iniciativa posterior e independiente (corrección de alcance, 2026-09-06).
