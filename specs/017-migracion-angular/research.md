# Research: Migración de BrewDex a Angular

Todas las incógnitas de la Technical Context del plan quedan resueltas abajo — no quedan marcadores `NEEDS CLARIFICATION`.

## Decisión 1 — Framework y estilo de componentes

**Decisión**: Angular 18+, exclusivamente componentes **standalone** (sin `NgModule`), con **signals** como primitiva de estado reactivo local y de aplicación.

**Rationale**: Es la forma idiomática recomendada por el propio equipo de Angular desde la v17-18 en adelante; evita el boilerplate de `NgModule` (Principio I) y da una primitiva de estado (`signal`/`computed`/`effect`) suficiente para reemplazar los `Cubit`/`BlocBuilder` de Flutter sin una librería adicional.

**Alternativas consideradas**: Angular con `NgModule` clásico — descartado por ser el patrón que el propio framework está dejando atrás, sin ningún beneficio para este proyecto.

## Decisión 2 — Gestión de estado: signals en servicios de aplicación, no NgRx

**Decisión**: Cada bounded context expone su estado a través de un servicio de aplicación `@Injectable({providedIn: 'root'})` con signals privados y `computed`/métodos públicos de solo lectura — el equivalente directo de un `Cubit` (`LanguageSelectionCubit`, `GameSelectionCubit`, `TeamBuilderCubit`). No se introduce NgRx (Store, Effects, SignalStore) ni ninguna otra librería de estado.

**Rationale** (Principio I, Simplicity & YAGNI): los tres `Cubit` actuales manejan estado moderado y **sin persistencia que reconciliar** (FR-015 elimina la complejidad que en Flutter justificaba `SharedPreferences` + reconciliación de roster al reiniciar). Un store centralizado con reducers/efectos añadiría boilerplate no justificado por ningún requisito de esta spec. Si una futura iteración reintroduce persistencia o estado compartido entre pestañas, esa complejidad se evaluará entonces (Principio I: la complejidad se justifica ante la necesidad concreta, no por adelantado).

**Alternativas consideradas**:
- **NgRx Store/Effects**: rechazado — boilerplate (actions/reducers/selectors/effects) desproporcionado para 3 contextos sin persistencia ni estado compartido entre pestañas.
- **NgRx SignalStore**: más liviano que el Store clásico, pero sigue siendo una dependencia y un patrón adicional no necesario cuando un servicio con signals ya resuelve el mismo problema con menos indirección.
- **Akita**: mismo argumento que NgRx Store, con menor adopción.

## Decisión 3 — Internacionalización en tiempo de ejecución

**Decisión**: `@jsverse/transloco`, con un archivo JSON por idioma (`en.json`, `es.json`, `fr.json`, `de.json`, `it.json`, `ja.json`, `ko.json`, `zh.json`) cargado de forma perezosa al cambiar de idioma.

**Rationale**: FR-003 exige poder cambiar de idioma **en cualquier momento durante la sesión**, sin recargar la página — un requisito de runtime que el mecanismo de i18n nativo de Angular (compilación estática, un bundle por locale) no cumple sin recompilar/recargar. Transloco resuelve esto de forma reactiva (expone el idioma activo como signal/observable) y con una estructura de archivos por idioma que traslada 1:1 los `app_{lang}.arb` actuales.

**Alternativas consideradas**:
- **Angular i18n nativo (`@angular/localize`)**: rechazado — requiere un build separado por idioma y no soporta cambiar de idioma sin recargar la app, violando FR-003.
- **ngx-translate**: opción válida y muy usada, pero sin soporte nativo de signals; Transloco es su sucesor espiritual (mismo autor) con mejor integración con Angular moderno.

## Decisión 4 — Adaptadores PokeAPI: puerto de negocio idéntico, cliente HTTP nuevo

**Decisión**: Cada adaptador de infraestructura (`PokeApiGameCatalogRepository`, `PokeApiPokedexRepository`, `PokeApiMovepoolRepository`, `PokeApiSupportedLanguageCatalog`) se reimplementa en TypeScript usando `HttpClient`, trasladando **sin cambios de negocio** las reglas hand-maintained ya validadas contra PokeAPI:
- `_regionalFormSuffixByGameId` (forma regional principal por juego),
- el mapa de DLC → version-group padre (`_dlcParentVersionGroup`, mismo patrón),
- `isNationalDexEligible`/`_generationOrder`/`generationOrdinal` (elegibilidad y orden de generación para el Pokédex nacional),
- `kMegaEvolutionEnabledGameIds`/`kGigamaxEnabledGameIds` (juegos con Mega Evolución/Gigamax habilitados).

**Rationale**: Estas tablas codifican hechos del propio PokeAPI (que no expone un campo para "qué región es esta forma" o "en qué juegos existe Mega Evolución") verificados en vivo durante features previas — son reglas de dominio, no detalles de Flutter, así que se preservan literalmente en la migración (Assumptions: "la migración no introduce ni retira reglas de juego").

**Alternativas consideradas**: Un backend propio (BFF) que reexponga PokeAPI — rechazado por Principio I: PokeAPI ya soporta CORS para consumo directo desde el navegador (el propio proyecto Flutter la consume así), y no hay ningún requisito (auth, agregación, caching de servidor) que justifique un backend intermedio.

## Decisión 5 — Sin persistencia: los puertos de almacenamiento desaparecen

**Decisión**: `SelectedGameStore`, `LanguagePreferenceStore` y `TeamRosterStore` (los tres puertos que en Flutter envuelven `shared_preferences`) **no tienen equivalente** en esta migración. El idioma activo, el juego/DLC seleccionados y el roster del equipo viven exclusivamente como signals de los servicios de aplicación de Decisión 2, inicializados siempre a su estado "vacío" (FR-015).

**Rationale**: Consecuencia directa de FR-015 (corrección de alcance del usuario, spec.md Clarifications) — no hay dato que leer ni escribir entre sesiones, así que el puerto de persistencia deja de existir en vez de implementarse como no-op, evitando una abstracción sin propósito (Principio I).

**Alternativas consideradas**: Implementar los puertos como adaptadores no-op "por si acaso" se reintroduce persistencia — rechazado explícitamente por el Principio I (YAGNI): se añadiría cuando (si) el requisito exista.

## Decisión 6 — Instalabilidad (PWA) sin caché de datos ni offline

**Decisión**: `@angular/pwa` (Angular service worker) configurado en `ngsw-config.json` con **solo** `assetGroups` para el app shell (HTML/CSS/JS/íconos) y un `manifest.webmanifest` para el ícono/nombre instalable (FR-023, SC-006). **Sin** `dataGroups` — ninguna respuesta de PokeAPI ni ningún estado de la app se cachea.

**Rationale**: FR-023 pide instalabilidad, no funcionamiento offline (Assumptions lo excluye explícitamente); cachear respuestas de PokeAPI o estado de sesión con el service worker equivaldría a reintroducir persistencia por la puerta de atrás, contradiciendo la Decisión 5 y FR-015.

**Alternativas consideradas**: Service worker con `dataGroups` cacheando la Pokédex para uso offline — rechazado, fuera de alcance (Assumptions) y en tensión directa con "sin persistencia en ningún sentido".

## Decisión 7 — Layout responsive: función pura + Angular CDK

**Decisión**: El mapeo ancho-de-viewport → `ScreenSize` (`compact` <600px, `medium` <840px, `expanded` ≥840px) se traslada como una función TypeScript pura sin imports de Angular (`resolveScreenSize(width: number): ScreenSize`), igual que `Breakpoints.resolve` en Dart — unit-testable sin levantar ningún componente. Un servicio delgado de infraestructura envuelve `@angular/cdk/layout` (`BreakpointObserver`) para alimentar esa función con el ancho real del viewport como signal.

**Rationale**: Mantiene los mismos umbrales ya validados por el diseño actual (FR-019) y preserva la separación que la Constitución exige — la regla en sí (dónde cae cada breakpoint) es dominio/diseño puro; solo la fuente del ancho de viewport es un detalle de infraestructura (el navegador).

**Alternativas consideradas**: CSS-only con media queries (sin lógica TypeScript) — insuficiente porque varios componentes (p. ej. el layout de dos paneles del constructor de equipo) necesitan la decisión en TypeScript, no solo en CSS, para elegir qué sub-árbol de componentes renderizar.

## Decisión 8 — Sistema de diseño: Angular Material 3 sobre el mismo seed color

**Decisión**: Angular Material con temas M3 (`mat.theme`), generando el `ColorScheme` a partir del mismo color semilla (`deepPurple`, mismo valor hex que `BrewDexTheme._seedColor`) para variantes claro/oscuro, más los tokens compartidos ya existentes (radio de esquina 16px, paleta por generación, iconografía de tipos) portados a variables CSS/Sass.

**Rationale**: Replica visualmente la identidad actual (FR-020: "reconocible para quien ya usó la versión anterior") reutilizando exactamente el mismo mecanismo de generación de paleta (`ColorScheme.fromSeed` ≈ M3 `mat.theme` desde una semilla) que ya usa la versión Flutter, y da accesibilidad de contraste razonable por defecto (soporta FR-024/WCAG AA) sin construir un design system desde cero.

**Alternativas consideradas**: Tailwind CSS puro sin librería de componentes — rechazado: exigiría reconstruir manualmente el nivel de accesibilidad (foco, roles ARIA, navegación por teclado) que Angular Material ya resuelve, con más riesgo de no cumplir WCAG 2.1 AA (FR-024) a tiempo.

## Decisión 9 — Estrategia de testing

**Decisión**: Karma + Jasmine (`ng test`, generado por Angular CLI) para pruebas unitarias de dominio/aplicación/infraestructura/presentación, siguiendo TDD (Principio II: test antes que implementación). Playwright + `@axe-core/playwright` para los flujos extremo a extremo de las User Stories 1 y 2 (Independent Tests de la spec) y para la auditoría automatizada de accesibilidad que SC-007 exige.

**Rationale**: Karma/Jasmine es el default de Angular CLI — cero configuración adicional, consistente con Principio I. Playwright cubre multi-navegador (Chromium/Firefox/WebKit) lo que valida FR-022 (soporte de navegadores) al mismo tiempo que los flujos de usuario; `@axe-core/playwright` da un resultado pasa/no-pasa objetivo para "una auditoría automatizada de accesibilidad no reporta incumplimientos de WCAG 2.1 AA" (SC-007).

**Alternativas consideradas**: Cypress en vez de Playwright — descartado solo por preferencia de soporte multi-navegador nativo de Playwright (incluye WebKit, relevante para validar Safari sin un Mac dedicado en CI).

## Decisión 10 — Build, lint y despliegue

**Decisión**: Angular CLI con el builder basado en esbuild (`ng build`) generando una SPA estática; `npm` como gestor de paquetes; ESLint + `angular-eslint` + Prettier para lint automatizado (Principio IV); despliegue como archivos estáticos (sin servidor Node propio) detrás de cualquier hosting de estáticos/CDN.

**Rationale**: No hay requisito de SSR/SEO (es una herramienta de uso personal/directo, no un sitio indexable con necesidades de posicionamiento), así que una SPA estática es la opción más simple que cumple todos los FR (Principio I).

**Alternativas consideradas**: Angular Universal (SSR) — rechazado, ningún requisito de la spec lo pide y añadiría complejidad de build/despliegue no justificada.

## Decisión 11 — Organización del código: por módulo (slice vertical) primero, por capa después

**Decisión**: `web/src/` se organiza en cinco módulos de negocio — `language`, `game`, `pokemon`, `pokedex`, `team` — más `shared/`; cada módulo contiene sus propias `domain/`, `application/`, `infrastructure/` y (si aplica) `presentation/`. Esto reemplaza la organización "cuatro carpetas de capa a nivel raíz, bounded contexts anidados dentro" que tenía el plan inicial (y que Flutter usa en `lib/`).

Al mismo tiempo, lo que en Flutter era un único puerto `PokedexRepository` (con dos métodos, `fetchPokedexIndex` y `fetchPokedexDetails`) se segrega en dos interfaces más pequeñas, una por módulo, siguiendo el Principio de Segregación de Interfaces:
- `PokedexIndexRepository.fetchPokedexIndex` → módulo `pokedex` (la proyección barata de solo-orden es un concern de navegación/filtrado).
- `PokemonRepository.fetchPokedexDetails` (renombrado por claridad) → módulo `pokemon` (el detalle completo de una especie/forma es un dato a nivel de Pokémon, reutilizable fuera del contexto de "estoy navegando un Pokédex").

Un mismo adaptador de infraestructura (p. ej. una clase interna que envuelve el cliente HTTP a `pokemon-species`/`pokemon`/`pokedex` de PokeAPI) puede implementar ambas interfaces sin duplicar lógica HTTP — la segregación es a nivel de puerto/contrato, no de cuántas llamadas de red se hacen.

**Rationale**: el usuario del producto pidió explícitamente esta organización (slice por módulo: `game`, `pokemon`, `pokedex`, `team`, etc.) porque hace que cada módulo sea una unidad autocontenida y fácil de ubicar — para trabajar "todo lo de equipo" o "todo lo de Pokédex" no hay que saltar entre cuatro carpetas de capa distintas. La regla de dependencia de Clean Architecture (Principio VI) se conserva intacta: solo cambia el eje por el que se agrupa primero (módulo, luego capa), no las reglas de qué puede importar a qué.

**Alternativas consideradas**:
- **Capa primero, bounded context anidado** (el diseño inicial de este plan, y el de `lib/` en Flutter): más fácil de mapear 1:1 desde el código Dart existente, pero dispersa un mismo módulo de negocio en cuatro carpetas de nivel superior — descartado tras la corrección explícita del usuario.
- **Un único módulo `team-builder` combinando pokémon+pokedex+equipo** (como en Flutter): más simple de trasladar, pero mezcla tres concerns con ciclos de cambio distintos (datos de especie, navegación/filtrado, construcción de equipo) en una sola carpeta — descartado por pedido explícito del usuario de separarlos.

## Decisión 12 — Retiro explícito del código Flutter, como primera tarea

**Decisión**: Borrar `lib/`, `test/`, `integration_test/`, `android/`, `ios/`, `pubspec.yaml`, `pubspec.lock`, `analysis_options.yaml`, `l10n.yaml`, `devtools_options.yaml`, `.metadata`, `.flutter-plugins-dependencies`, `brewdex.iml` y cualquier `build/` del repo como la **primera tarea de `tasks.md`** (T001), antes de crear el proyecto Angular — no al final de la migración.

**Rationale**: FR-021 (spec.md) exige que Flutter quede descartado desde ahora, no en un futuro indefinido. El plan inicial proponía borrar recién al final (tras validar `web/` contra las User Stories 1 y 2) para no dejar el repo sin una app funcional durante la migración; el usuario corrigió explícitamente esa decisión, priorizando empezar de cero de inmediato por sobre mantener una app funcional en todo momento. Se acepta el trade-off: el repositorio queda sin ninguna app operativa hasta que Setup + Foundational + User Story 1 + User Story 2 estén implementadas.

**Alternativas consideradas**:
- **Borrar al final, tras validar Angular** (decisión original de este documento): minimiza el tiempo sin una app funcional, pero fue rechazada explícitamente por el usuario a favor de un corte limpio inmediato.
- **Mantener `lib/` como referencia histórica indefinidamente**: rechazado; el propio historial de git ya cumple ese rol sin necesidad de dejar código muerto en el árbol de trabajo.

## Decisión 13 — `Move.damageClass` y su regla histórica para Generación I-III

**Decisión**: `Move` (módulo `pokemon`) gana un campo `damageClass: 'physical' | 'special' | 'status'`. Para juegos de Generación IV en adelante se lee directo de `move.damage_class` en PokeAPI. Para Generación I-III, `PokeApiMovepoolRepositoryService` lo resuelve con una tabla tipo→clase hand-maintained (Normal/Lucha/Volador/Veneno/Tierra/Roca/Bicho/Fantasma/Acero → `'physical'`; Fuego/Agua/Planta/Eléctrico/Psíquico/Hielo/Dragón/Siniestro → `'special'`) en vez de confiar en el campo de PokeAPI, que ya refleja la clasificación moderna y no la que esos juegos mostraban en su momento.

**Rationale**: en Gen. I-III la clase de un movimiento no era un dato propio del juego — se derivaba del tipo — y los movimientos que hoy son de clase `'status'` no pertenecían a ninguna clase en esas generaciones. Es la misma clase de regla ya presente en el proyecto (dato que PokeAPI no modela tal cual, verificado y trasladado a mano — ver Decisión 4), así que se resuelve del mismo modo: una constante de infraestructura, no un endpoint.

**Atribución**: la explicación de esta regla histórica proviene de [WikiDex](https://www.wikidex.net) y se reproduce con atribución a sus autores conforme a su licencia (CC BY-SA) — ver la nota completa en [[data-model.md]]. No debe copiarse a ningún sitio que no dé esa misma atribución.

**Alternativas consideradas**: Usar `move.damage_class` de PokeAPI tal cual para todas las generaciones — rechazado porque produciría una clase incorrecta (la moderna) para movimientos consultados en el contexto de un juego de Gen. I-III, contradiciendo el propio dato histórico que el juego mostraba.

## Decisión 16 — Alcance reducido: Mega Evolución/Gigamax no se acota por juego todavía

**Decisión**: `PokeApiPokemonRepositoryService` clasifica una variedad como Mega (`pokemon-form.is_mega`) o Gigamax (`pokemon-form.form_name` contiene `"gmax"`) usando campos que PokeAPI sí expone directamente — pero, a diferencia del `kMegaEvolutionEnabledGameIds`/`kGigamaxEnabledGameIds` mencionado en la Decisión 4, **no** restringe todavía si esa forma es jugable en el `Game` activo. Toda especie con una variedad Mega/Gigamax la expone como `megaForm`/`gigamaxForm` sin importar el juego seleccionado.

**Rationale**: la versión Flutter mantenía esas listas a mano tras verificarlas en vivo contra PokeAPI durante su propia planificación (011-forms-icons-moves) — ese trabajo de verificación no sobrevivió al borrado de `lib/` (T001) y reconstruirlo con la misma exactitud está fuera del presupuesto de esta sesión de implementación. `pokemon-form.version_group` únicamente identifica el version-group en que PokeAPI *introdujo* la forma (p. ej. `charizard-mega-x` → `"x-y"`), no todos los juegos donde el mecanismo es jugable (Mega Evolución también es jugable en Omega Rubí/Alfa Zafiro, Sol/Luna, etc., y de nuevo en Legends Z-A) — usarlo tal cual produciría falsos negativos.

**Impacto**: por ahora, un botón de Mega/Gigamax puede aparecer para un juego donde esa mecánica no es realmente jugable (falso positivo) — más seguro que ocultarlo donde sí aplica (falso negativo). Marcado explícitamente como deuda técnica a resolver con una tabla hand-maintained (mismo patrón que Decisión 4/14), verificada en vivo contra PokeAPI como se hizo aquí para las demás.

**Alternativas consideradas**: Reconstruir la tabla de memoria sin verificarla en vivo — rechazado; una tabla adivinada sin verificación es peor que una limitación documentada explícitamente.

## Decisión 17 — La familia completa de puertos cruzados entre módulos

**Decisión**: Durante la implementación surgieron 3 puertos cruzados más además de `ActiveLanguageReader` (el único previsto en el plan inicial), todos en `shared/tokens/` con el mismo patrón (interfaz mínima en el `domain` del módulo dueño, `InjectionToken` en `shared/tokens/`, cableado en `app.config.ts`):

| Puerto | Dueño | Consumido por | Para qué |
|---|---|---|---|
| `ActiveLanguageReader` | `language` | `game`, `pokemon`, `pokedex` | idioma activo para resolver contenido localizado |
| `GameSelectionReader` | `game` | `pokedex`, `team` | juego/DLC activos, para saber cuándo recargar/reconciliar |
| `RosterReader` | `team` | `game` | si hay que advertir antes de confirmar un cambio de juego (FR-016) |
| `PokedexDetailsReader` | `pokedex` | `team` | detalle (formas, tipos) de un Pokémon ya agregado al equipo |
| `PokemonRepository` | `pokemon` | `pokedex`, `team` | resolver detalle de especie (`fetchPokedexDetails`) sin la infraestructura concreta |
| `MovepoolRepository` | `pokemon` | `team` | resolver movepool/moveset por defecto sin la infraestructura concreta |

Los dos últimos (`PokemonRepository`, `MovepoolRepository`) no se anticiparon en el diseño inicial de `pokedex`/`team` — aparecieron recién al arreglar el hallazgo de la Decisión 18 (abajo), que expuso que `pokedex`/`team` ya estaban importando la infraestructura concreta de `pokemon` directamente. Antes de esa corrección, esas dos capas también llamaban a los envoltorios de `application` de `pokemon` (`getPokemonDetails`, `getMovepool`, `getDefaultMoveset`) desde afuera del módulo — eso también se corrigió: ahora llaman al método del puerto directamente (`pokemonRepository.fetchPokedexDetails(...)`), porque la capa de `application` de un módulo es para uso *interno* de ese módulo, no para que otros módulos la importen (ver la regla `presentation`→`application` propia agregada en la Decisión 18).

**Rationale**: cada uno resolvió una violación real de la regla de import-boundaries de `eslint.config.js` detectada por el propio lint al escribir el consumidor (no una anticipación especulativa) — Principio I: la abstracción se agregó exactamente cuando la necesidad concreta apareció, no antes. Además del `PokedexBrowserComponent` (composición `presentation→presentation`, mismo motivo) para el caso de UI compuesta en la misma pantalla en vez de una lectura de estado puntual.

**Alternativas consideradas**: Relajar la regla de `eslint.config.js` para permitir que la infraestructura de un módulo importe la de otro directamente — rechazado; eso es exactamente lo que Constitución Principio VI prohíbe, y el costo de un puerto + token adicional es bajo comparado con perder la garantía mecánica de aislamiento entre módulos.

## Decisión 18 — `eslint-plugin-boundaries` necesitaba un resolver; sin él, nunca se aplicó

**Decisión**: Agregar `"import/resolver": { typescript: {} }` (paquete `eslint-import-resolver-typescript`) a los `settings` de `eslint.config.js`, y agregar `["application", { module: "${from.module}" }]` al `allow` de `presentation` en la regla `boundaries/element-types`.

**Rationale — hallazgo crítico durante T094**: `eslint-plugin-boundaries` resuelve cada `import` vía `eslint-module-utils`, que a su vez necesita un resolver para convertir un specifier relativo (`'../game/infrastructure/...'`) en una ruta real antes de poder clasificarlo contra los patrones de `boundaries/elements`. Sin ese resolver configurado, **todo import local quedaba "de tipo desconocido" y la regla se saltaba en silencio** — confirmado corriendo `ESLINT_PLUGIN_BOUNDARIES_DEBUG=1`, que mostró `"isIgnored": true` para cualquier import relativo. Esto significa que la regla de import-boundaries — la aplicación mecánica central del Principio VI en esta migración — **nunca se aplicó de verdad durante toda la implementación de Setup, Foundational, User Story 1 y la mayor parte de User Story 2**, pese a que cada corrida de `ng lint` reportaba "All files pass linting".

Al arreglar el resolver, el lint sí empezó a fallar — y reveló **violaciones reales ya coladas en el código**: `pokedex/infrastructure/in-memory-pokedex.service.ts` y `team/infrastructure/in-memory-team.service.ts`/`pokedex-roster-validity-checker.service.ts` importaban la infraestructura concreta de `pokemon` (`PokeApiPokemonRepositoryService`, `PokeApiMovepoolRepositoryService`) y sus envoltorios de `application` (`getPokemonDetails`, `getMovepool`, `getDefaultMoveset`) directamente, en vez de pasar por un puerto. Se corrigió agregando los puertos `PokemonRepository`/`MovepoolRepository` cruzados (ver tabla arriba) y reemplazando las llamadas a los envoltorios de `application` por llamadas directas al método del puerto inyectado. También se detectó que `presentation` nunca podía llamar a la `application` de su **propio** módulo (un olvido de diseño, no un hallazgo de bug) — corregido en la misma pasada.

**Verificación**: se repitió la prueba con una violación deliberada (un import cruzado de infraestructura) tanto antes como después del fix — antes, `ng lint` no la detectaba; después, sí, con el mismo mensaje de error ya diseñado. Los 140 tests unitarios y los 6 tests Playwright siguieron en verde tras las correcciones.

**Impacto sobre trabajo previo**: ninguna de las violaciones encontradas afectaba el comportamiento funcional de la app (los 140 tests + 6 e2e ya pasaban antes del fix) — eran violaciones puramente arquitectónicas (acoplamiento entre módulos), exactamente el tipo de problema que esta regla existe para prevenir mecánicamente en el futuro, no una regresión de producto.

**Alternativas consideradas**: Descubrir esto recién en una revisión de código posterior — rechazado; verificar la regla con una violación deliberada (T094) es precisamente lo que la expuso a tiempo, dentro de la misma sesión de implementación.

## Decisión 14 — Curación del catálogo de idiomas: `official: true` no alcanza

**Decisión**: `PokeApiSupportedLanguageCatalogService` filtra el catálogo de PokeAPI contra una tabla hand-maintained de 8 códigos exactos (`en`, `es`, `fr`, `de`, `it`, `ja`, `ko`, `zh-hans` — mostrado como "zh"), en vez de confiar en el campo `official` del recurso `language`.

**Rationale**: se verificó en vivo contra `GET /api/v2/language` (14 idiomas totales) que PokeAPI marca `official: true` en más idiomas de los que FR-002 pide — incluye `ja-hrkt`, `ja-roma`, `zh-hant`, `pt-br` y `es-419` como oficiales también (solo `cs` es `official: false`). Filtrar solo por `official` daría un catálogo de ~13 idiomas, no los 8 que la spec exige como mínimo. Esta tabla sigue el mismo patrón ya establecido para otras brechas de modelado de PokeAPI (sufijo de forma regional, DLC→version-group, Mega/Gigamax por juego — Decisión 4): un hecho de negocio que PokeAPI no expone limpiamente como un único campo consultable.

**Alternativas consideradas**:
- **Filtrar solo por `official: true`**: rechazado — sobregenera el catálogo (13 idiomas en vez de 8) y expondría variantes no pedidas (`ja-roma`, `pt-br`, `es-419`) como opciones separadas.
- **Incluir tanto `zh-hans` como `zh-hant` como entradas separadas**: se optó por mostrar solo `zh-hans` (chino simplificado) bajo la etiqueta "zh" para igualar exactamente el conteo de 8 idiomas de FR-002; puede revisarse si en el futuro se pide distinguir variantes de escritura del chino explícitamente.

**Hallazgo relacionado — sin autónimos en PokeAPI**: el recurso `language/{code}` solo trae el nombre de ese idioma traducido a un puñado de idiomas (`en`, `es`, `it`, `pt-br`, `es-419` en la práctica — verificado en vivo), nunca el autónimo (p. ej. no hay una entrada "日本語" para `ja`, ni una traducción a `fr`/`de`/`ko`/`ja`/`zh` de ningún nombre de idioma). Mostrar cada idioma en **su propio autónimo** (el patrón estándar de cualquier selector de idioma) requiere entonces otra tabla hand-maintained de 8 entradas (`{code: autónimo}`), en vez de `resolveLocalizedName` contra `names` de PokeAPI — ese helper sigue usándose para nombres de Pokémon/movimientos/juegos, que sí están bien cubiertos por PokeAPI.
