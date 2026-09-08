# Feature Specification: Onboarding, Pokedex & Team Builder Polish

**Feature Branch**: `[018-onboarding-pokedex-team-polish]`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "General: usar estándar de Material UI outlined en toda la app. Selector de idioma: se ve mal — las opciones deben tener un largo más pequeño y mayor margen entre ellas. Botones 'Continuar'/'Seleccionar' al elegir idioma y juego: son innecesarios; al presionar una opción debe avanzar directo al siguiente paso. Selector de juegos: cada juego debe tener un color distinto y la tarjeta del juego debe tener un ícono de pokeball. Agregar opción para volver al paso anterior en cada paso del flujo. Pokedex: los sprites deben corresponder al juego seleccionado (ej. en Pokémon Rojo/Azul actualmente los sprites no son los correctos). DLC: deben ser un toggle dentro de la sección de pokedex (junto a la pokedex principal/regional del juego). Si el juego tiene DLC y se activa el toggle correspondiente, se habilita una nueva pokedex debajo de las ya visibles, con los pokémon de ese DLC. 'Mega Dimension' es un DLC (de Legends Z-A), no un juego independiente — corregir su clasificación. Sol/Luna y Ultra Sol/Ultra Luna son juegos independientes, no DLC — mantenerlos como juegos separados. Rendimiento de carga de pokedex: las pokedex demoran mucho en cargar. Implementar carga paginada: pedir páginas de 10-20 pokémon, mostrarlas, y al llegar al final solicitar la siguiente página de 10-20, repitiendo hasta completar la pokedex. Armado de equipo: debe mostrarse el nombre del juego seleccionado. Los filtros tienen muy poco margen con el borde de la pantalla — corregir. Los slots del equipo deben organizarse en una matriz de 3 columnas x 2 filas, y deben mantener tamaño uniforme sin importar si están vacíos o llenos con un pokémon. El botón para eliminar un pokémon del equipo es muy genérico — reemplazarlo por un ícono de eliminar/cerrar (X). Detalle de pokémon en el equipo: al hacer click en un pokémon del equipo debe abrirse una tarjeta modal con su información: nombre, tipos, imagen, y un botón/toggle para activar su forma shiny. Al activar el shiny, tanto la imagen en la tarjeta modal como en el slot del equipo deben cambiar a la forma shiny; al volver a presionar el toggle, debe regresar a la forma normal."

## Clarifications

### Session 2026-09-06

- Q: ¿Cómo debe activarse la carga del siguiente lote de Pokémon en la Pokedex? → A: Scroll infinito automático; además, dado que la lista completa nunca está cargada en memoria, los filtros deben consultar directamente a la API (no filtrar solo sobre los Pokémon ya cargados en pantalla).
- Q: ¿La forma shiny activada en el modal de un Pokémon del equipo debe persistir en el slot tras cerrar el modal, o revertir al cerrarlo? → A: Persistente — el shiny queda activo en el slot (y se refleja de nuevo si se reabre el modal) hasta que el usuario lo desactive explícitamente o quite al Pokémon del equipo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Frictionless language & game selection (Priority: P1)

A user opens the app to start building a team. They pick their language from a list of neatly spaced, compact options and are taken immediately to the game selection step — no extra confirmation click needed. On the game step, each game is shown as a distinctly colored card with a pokeball icon, and choosing a game immediately advances to the pokedex step. At every step of this flow the user can go back to the previous step to change their answer.

**Why this priority**: This is the entry point of the whole app; a confusing or unnecessarily click-heavy first impression (illegible language list, dead-end selections, no way back) blocks or frustrates every subsequent user journey.

**Independent Test**: Can be fully tested by opening the app, selecting a language, selecting a game, and confirming each selection navigates forward immediately and a "back" control is available and functional at each step, without touching any other part of the app.

**Acceptance Scenarios**:

1. **Given** the user is on the language selection step, **When** they view the list of languages, **Then** each option is shown at a compact, uniform width with clear spacing between options (no cramped or overlapping items).
2. **Given** the user is on the language selection step, **When** they tap/click a language option, **Then** the app immediately advances to the game selection step (no separate "Continue" action required).
3. **Given** the user is on the game selection step, **When** they view the list of games, **Then** each game card displays a pokeball icon and a color distinct from the other game cards.
4. **Given** the user is on the game selection step, **When** they tap/click a game card, **Then** the app immediately advances to the next step (no separate "Select" action required).
5. **Given** the user is on the game selection step (or any later step in this onboarding flow), **When** they use the "back" control, **Then** they are returned to the previous step with their earlier selection still visible/editable.

---

### User Story 2 - Accurate, correctly organized, fast-loading Pokedex (Priority: P1)

A user who selected a game (e.g., Pokémon Red/Blue) browses that game's Pokedex and sees sprite artwork that actually matches that game's generation/style, not a mismatched or generic sprite set. If the selected game has downloadable content (DLC) that adds its own set of Pokémon, the user sees a toggle next to the main/regional Pokedex; switching it on reveals an additional Pokedex section underneath, listing that DLC's Pokémon, without hiding or replacing the main list. The Pokedex loads quickly by fetching and displaying Pokémon in small batches instead of making the user wait for the entire list.

**Why this priority**: The Pokedex is the core browsing surface of the app; wrong sprites and slow loads directly undermine the app's basic value (looking up correct Pokémon for the chosen game), and incorrect DLC/game classification produces wrong data for the user's decisions.

**Independent Test**: Can be fully tested by selecting a game with known sprite generation and DLC (e.g., Pokémon Legends Z-A with the "Mega Dimension" DLC), confirming sprites match the game's expected style, confirming the DLC toggle reveals a separate Pokedex section for that DLC's Pokémon, and confirming Pokémon appear progressively in small batches as the list is browsed rather than all at once after a long wait.

**Acceptance Scenarios**:

1. **Given** a user has selected a specific game, **When** the Pokedex for that game is displayed, **Then** every Pokémon sprite shown matches the visual style/generation associated with that game (e.g., Red/Blue shows Generation I-style sprites, not sprites from another generation).
2. **Given** a user has selected a game that has one or more associated DLCs, **When** they view that game's Pokedex screen, **Then** a toggle is shown for each DLC, positioned alongside the main/regional Pokedex, and all toggles start in the "off" state.
3. **Given** a DLC toggle is switched on, **When** the toggle activates, **Then** a new Pokedex section for that DLC's Pokémon appears below the existing Pokedex section(s), without removing or replacing them.
4. **Given** a DLC toggle is switched off after being on, **When** the toggle deactivates, **Then** that DLC's Pokedex section is removed/hidden again.
5. **Given** "Mega Dimension" content, **When** it is presented anywhere in game/DLC selection, **Then** it is classified and labeled as a DLC of Pokémon Legends Z-A, never as a standalone selectable game.
6. **Given** Pokémon Sun, Moon, Ultra Sun, and Ultra Moon, **When** they are presented in game selection, **Then** each is offered as its own independent, standalone game (not as a DLC of another game).
7. **Given** a user opens a game's Pokedex, **When** the screen first loads, **Then** only an initial batch of 10-20 Pokémon is fetched and displayed rather than the full list.
8. **Given** a user scrolls near the end of the currently loaded Pokémon, **When** that point is reached, **Then** the next batch of 10-20 Pokémon is automatically requested and appended to the visible list (infinite scroll, no manual "load more" action required), and this repeats until the full Pokedex for that game (and any active DLC) has been loaded.
9. **Given** the Pokedex list is only partially loaded (more batches remain), **When** the user applies a filter (e.g., by type), **Then** the system queries the results directly from the data source rather than filtering only the Pokémon already loaded on screen, so matching Pokémon not yet paginated into view are still included in the filtered results.

---

### User Story 3 - Clear, consistent team builder with working shiny toggle (Priority: P2)

A user assembling their team can always see which game's Pokedex they're drafting from, has filter controls that aren't cramped against the screen edge, and arranges Pokémon into a fixed 3-column by 2-row grid of team slots that stay the same size whether empty or occupied. Removing a Pokémon from a slot is a clearly recognizable action (a dedicated remove/close icon rather than a generic button). Clicking a Pokémon already placed in the team opens a detail card showing its name, types, and image, with a toggle to preview its shiny form; switching the toggle updates the artwork in both the detail card and the team slot, and switching it back restores the normal form.

**Why this priority**: This is the primary "build and review" surface of the app. Layout inconsistency (resizing slots, cramped filters) and an unclear delete action create everyday usability friction, while the shiny toggle and game name label are the acceptance-visible, user-facing payoff of the feature request.

**Independent Test**: Can be fully tested by selecting a game, adding and removing Pokémon from team slots, confirming slot size stays constant and the game name is visible, confirming filters have visible breathing room from the screen edge, confirming the remove control is an icon (not a generic labeled button), and confirming the shiny toggle in a Pokémon's detail card updates both the card and the corresponding team slot's artwork and reverts on a second press.

**Acceptance Scenarios**:

1. **Given** a user is on the team builder screen, **When** the screen is displayed, **Then** the name of the currently selected game is visible on screen.
2. **Given** a user is on the team builder screen, **When** they view the filter controls, **Then** there is visible spacing between the filters and the edges of the screen (no controls flush against or clipped by the viewport edge).
3. **Given** a user is on the team builder screen, **When** the team slots are displayed, **Then** they are arranged in a grid of 3 columns and 2 rows (6 slots total).
4. **Given** a team slot is empty, **When** a Pokémon is added to it, **Then** the slot's dimensions remain the same as when it was empty (no resizing/reflow of the slot or its neighbors).
5. **Given** a team slot contains a Pokémon, **When** the user looks for a way to remove it, **Then** a distinct remove/close icon (not a generic text button) is shown for that purpose, and activating it removes the Pokémon and returns the slot to its empty state.
6. **Given** a team slot contains a Pokémon, **When** the user clicks on that Pokémon, **Then** a modal detail card opens showing the Pokémon's name, type(s), and image.
7. **Given** the Pokémon detail modal is open, **When** the user activates the shiny toggle, **Then** the image in the modal changes to the Pokémon's shiny form AND the corresponding team slot's image also changes to the shiny form.
8. **Given** the shiny form is currently active for a Pokémon in the team, **When** the user activates the toggle again, **Then** both the modal image and the team slot image revert to the normal (non-shiny) form.
9. **Given** a team slot's Pokémon has its shiny form active, **When** the user closes the detail modal (without deactivating the toggle) and reopens it later, **Then** the team slot keeps showing the shiny form the whole time, and the modal reopens with the shiny toggle already on and the shiny image shown.

---

### User Story 4 - Consistent outlined visual style (Priority: P3)

A user navigating any screen of the app (language selection, game selection, Pokedex, team builder, modals) experiences one consistent visual language: Material Design's "outlined" style for inputs, buttons, cards, and toggles, rather than a mix of styles.

**Why this priority**: This is a cross-cutting visual consistency requirement. It improves polish and coherence but does not block any individual user task the way P1/P2 issues do, so it is lower priority even though it touches every screen.

**Independent Test**: Can be fully tested by visually inspecting each screen (language, game, Pokedex, team builder, detail modal) and confirming interactive components (buttons, toggles, cards, inputs) consistently use the outlined visual treatment.

**Acceptance Scenarios**:

1. **Given** any screen in the app that contains buttons, toggles, cards, or input-like controls, **When** the screen is rendered, **Then** those controls consistently use the Material Design outlined visual style.

---

### Edge Cases

- What happens when a user tries to go back from the very first step of the onboarding flow (language selection)? The back control MUST be hidden or disabled on the first step since there is no earlier step to return to.
- What happens when a game has no DLC at all? No DLC toggle is shown for that game; only the main/regional Pokedex is displayed.
- What happens when a user toggles a DLC on, then navigates away and back? The DLC toggle states are not required to persist across navigation; reasonable default is that toggles reset to "off" when the Pokedex screen is re-entered fresh (see Assumptions).
- What happens when the next batch of Pokémon fails to load (e.g., network error) while paginating? The user MUST see an inline error/retry affordance for that batch without losing the Pokémon already loaded.
- What happens when a Pokémon has no distinct shiny artwork available? The shiny toggle MUST still function, falling back to the best available artwork rather than breaking the modal or slot.
- What happens when all 6 team slots are full and the user selects another Pokémon from the Pokedex to add? The system MUST clearly indicate the team is full and MUST NOT silently overwrite an existing slot (see Assumptions for exact behavior).
- What happens if a user picks a game whose Pokedex sprite set is missing/unavailable for the correct generation? The system MUST show a clear placeholder rather than falling back to a mismatched-generation sprite.
- What happens when a user applies a filter before the full Pokedex has finished paginating in? The filter MUST be resolved against the full data source (not just the batches already loaded), so results are complete regardless of how much of the list has visually loaded.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The language selection screen MUST display each language option at a compact, uniform width with clearly visible spacing (margin) between adjacent options.
- **FR-002**: Selecting a language option MUST immediately navigate the user to the game selection step; no separate "Continue" action MUST be required.
- **FR-003**: The game selection screen MUST render each game as a card that includes a pokeball icon and a background/accent color distinct from every other game card shown on that screen.
- **FR-004**: Selecting a game card MUST immediately navigate the user to the next step (Pokedex); no separate "Select" action MUST be required.
- **FR-005**: Every step of the onboarding flow (language, game, and any subsequent step that is part of this guided flow) MUST provide a control to return to the previous step, except the first step, which MUST NOT show a non-functional back control.
- **FR-006**: The Pokedex screen MUST display sprite artwork corresponding to the generation/visual style of the currently selected game (e.g., Generation I games show Generation I-style sprites).
- **FR-007**: The system MUST classify "Mega Dimension" as a DLC belonging to Pokémon Legends Z-A, not as a selectable standalone game.
- **FR-008**: The system MUST classify Pokémon Sun, Pokémon Moon, Pokémon Ultra Sun, and Pokémon Ultra Moon as independent, standalone games, not as DLC of any other game.
- **FR-009**: For a game that has one or more associated DLCs, the Pokedex screen MUST display one toggle per DLC, positioned alongside the game's main/regional Pokedex section, defaulting to "off."
- **FR-010**: Activating a DLC toggle MUST reveal an additional Pokedex section, listing that DLC's Pokémon, displayed below the already-visible Pokedex section(s), without removing them.
- **FR-011**: Deactivating a DLC toggle MUST remove/hide that DLC's Pokedex section again.
- **FR-012**: The Pokedex screen MUST load Pokémon progressively in batches of 10-20 rather than fetching the entire list at once.
- **FR-013**: When the user scrolls near the end of the currently loaded batch, the system MUST automatically fetch and append the next batch of 10-20 Pokémon (infinite scroll, no manual "load more" control), repeating until the full applicable Pokedex (main and any active DLC) is loaded.
- **FR-013a**: Pokedex filters MUST query the underlying data source directly rather than filtering only the Pokémon batches already loaded on screen, so a filter's results are complete even while pagination is still in progress.
- **FR-014**: The team builder screen MUST display the name of the currently selected game.
- **FR-015**: The team builder screen's filter controls MUST have visible spacing from the edges of the screen/viewport.
- **FR-016**: The team builder screen MUST arrange team slots in a fixed grid of 3 columns by 2 rows (6 total slots).
- **FR-017**: Each team slot MUST maintain the same visual dimensions regardless of whether it is empty or occupied by a Pokémon.
- **FR-018**: Each occupied team slot MUST display a dedicated remove/close icon (distinct from a generic labeled button) that removes the Pokémon from the slot when activated.
- **FR-019**: Clicking a Pokémon occupying a team slot MUST open a modal detail card displaying that Pokémon's name, type(s), and image.
- **FR-020**: The Pokémon detail modal MUST include a shiny toggle control.
- **FR-021**: Activating the shiny toggle MUST update the image shown in the detail modal to the Pokémon's shiny form AND update the image shown in the corresponding team slot to the shiny form.
- **FR-022**: Deactivating the shiny toggle (pressing it again) MUST revert both the detail modal image and the team slot image to the Pokémon's normal (non-shiny) form.
- **FR-022a**: The shiny state MUST persist as part of that Team Slot's state: closing the detail modal MUST NOT reset an active shiny form back to normal, and reopening the modal for that slot MUST reflect the shiny state currently active for it.
- **FR-023**: Interactive components across the app (buttons, toggles, cards, input-like controls) MUST consistently use the Material Design outlined visual style.

### Key Entities

- **Game**: A selectable Pokémon title (e.g., Red/Blue, Sun/Moon, Ultra Sun/Ultra Moon, Legends Z-A). Has a generation/visual style used to pick correct sprite artwork, a distinct display color, and zero or more associated DLCs.
- **DLC**: Downloadable content tied to exactly one parent Game (e.g., "Mega Dimension" belongs to Legends Z-A). Has its own set of Pokémon and its own toggle state (on/off) within that game's Pokedex screen.
- **Pokedex Entry / Pokémon**: A single Pokémon as shown in a Pokedex listing, with name, type(s), normal sprite/artwork, and shiny sprite/artwork, scoped to a specific game's (or DLC's) generation/style.
- **Team Slot**: One of the 6 fixed positions (3x2 grid) in the team builder, either empty or holding one selected Pokémon, and tracking whether that Pokémon's shiny form is currently active. This shiny flag persists as part of the slot's state (independent of the detail modal being open or closed) until toggled off or the Pokémon is removed from the slot.
- **Team**: The collection of up to 6 Team Slots being assembled for the currently selected game.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can move from language selection through game selection to the Pokedex step using only direct selection taps/clicks, with zero additional confirmation button presses.
- **SC-002**: 100% of games and DLCs presented in selection screens are correctly classified (no DLC listed as a standalone game, no standalone game listed as a DLC), verified against the current title/DLC catalog.
- **SC-003**: The Pokedex screen shows its first visible batch of Pokémon (10-20 entries) within 2 seconds of navigating to it under normal network conditions, instead of waiting for the entire list.
- **SC-004**: 100% of sprites displayed in a game's Pokedex visually match that game's expected generation/style, with zero mismatched-generation sprites reported for supported games.
- **SC-005**: Users can add and remove Pokémon from any of the 6 team slots without the slot grid changing size or position at any point.
- **SC-006**: Users can toggle a team Pokémon's shiny form on and off repeatedly, with the modal and the team slot always showing matching (normal or shiny) artwork, verified across 100% of toggle interactions in testing.
- **SC-007**: Users can navigate backward from any onboarding step (other than the first) and land on the previous step with their prior selection intact, in a single action.
- **SC-008**: Applying a Pokedex filter returns 100% of matching Pokémon for the selected game/DLC, regardless of how much of the paginated list has loaded on screen at that moment.

## Assumptions

- "Material UI outlined" refers to Material Design's outlined component style (as already partially used elsewhere in the app per prior specs), applied consistently to buttons, toggles, cards, and inputs — not a switch to a different design system.
- DLC toggle state is scoped to the current Pokedex screen session and is not required to persist once the user navigates away and returns; it resets to "off" on re-entry.
- The onboarding "back" flow only needs to cover the steps explicitly described (language → game → Pokedex/team-builder entry); it does not need to define back-navigation for every deep sub-screen of the app.
- Batch size for paginated Pokedex loading is a value between 10 and 20 chosen by the implementation; the exact number is an implementation detail as long as it stays in that range.
- When the team is full (6/6 slots occupied) and the user attempts to add another Pokémon, the system informs the user the team is full and requires them to remove an existing Pokémon first, rather than auto-replacing a slot.
- Shiny form artwork is expected to be available from the same data source already used for normal sprites; where it is genuinely unavailable for a given Pokémon, the toggle still works but falls back to the normal artwork.
- The set of DLCs and their parent games (e.g., Mega Dimension → Legends Z-A) follows official Pokémon game/DLC release information as the source of truth for classification.
