# Research: Tamaño de Tipos Legible, Tabla de Cobertura Visible y Estabilidad al Quitar Pokémon

## Decision 1 — Type badge size (`kStandardTypeIconSize`)

**Original decision (superseded during implementation, see below)**: Raise
`kStandardTypeIconSize` from `24.0` to `40.0` as a single flat constant
every consumer (`team_slot.dart`, `pokemon_customization_card.dart`,
`pokedex_type_filter.dart`) renders at directly — no per-widget override,
no per-context adjustment.

**What actually happened during implementation**: mid-implementation, the
user manually edited `kStandardTypeIconSize` twice more (to `60.0`, then to
`100.0`) while iterating on how large the badges should look. At `60.0`
the flat-constant approach already overflowed the fixed-size team-slot
`Column` on narrow (mobile) cells — the fundamental tension a single flat
value can never resolve: large enough to be legible on a wide desktop
pane, without being too large to fit two side by side on a narrow mobile
cell. Presented with that conflict, the user chose to **keep raising the
cap and adapt the layout instead of capping the value low enough to
always fit** (see `AskUserQuestion` record in the session transcript).

**Revised decision**: `kStandardTypeIconSize` becomes the shared **upper
bound**, not a flat value. A new function, `resolveTypeIconSize(availableWidth,
{required badgeCount, spacing})`, computes the actual per-call render size:
as large as the cap allows when the available row width comfortably fits
`badgeCount` badges, shrinking only as much as a narrower cell genuinely
requires to keep them on one row without overflowing — used by both
`team_slot.dart` and `pokemon_customization_card.dart` (the two places that
show a Pokémon's own type(s) side by side), each behind a `LayoutBuilder`
that measures the row's real available width. `pokedex_type_filter.dart`'s
`_TypeTile` keeps using `kStandardTypeIconSize` directly — it renders one
badge at a time inside an `IntrinsicWidth` tile, so it has no "two per row"
constraint to adapt to and can never overflow regardless of the cap's
value.

**FR-003 amendment**: the spec's original "must be the same value in the
team slot and the customization card" now means *the same formula/cap*,
not necessarily an identical rendered pixel value in every context — the
team slot (a fixed-size grid cell) and the customization card (inside a
free-scrolling sheet) can have different real available widths, so
`resolveTypeIconSize` can legitimately return different sizes for each.
Both still obey the one shared cap and the one shared "shrink only as much
as needed" rule.

**A width-only formula still wasn't sufficient**: implementing
`resolveTypeIconSize(availableWidth, badgeCount: 2)` alone reintroduced a
narrower version of the same overflow for a **single**-type Pokémon in the
team slot — with only one badge to place, the width-fit formula let it
grow to fill almost the entire cell width, and since the badge is square
and the team-slot cell is square (`AspectRatio(aspectRatio: 1)`), that
also grew the badge's *height* past what was left for the name label
below it, overflowing the same fixed-size `Column` vertically instead of
horizontally. Fixed by an additional clamp in `team_slot.dart` specific to
that context: since the cell is square, `constraints.maxWidth` from the
same `LayoutBuilder` also stands in for the cell's total content height,
so the resolved badge size is further capped at
`constraints.maxWidth - reservedForNameText` (a fixed 20px allowance for
the single-line name below). This clamp is deliberately local to
`team_slot.dart`, not baked into `resolveTypeIconSize` itself — the
customization card has no such fixed/square constraint (it scrolls), so
it never needed it.

**A zero-slack width formula was also flaky**: an initial version of
`resolveTypeIconSize` computed the exact width two badges need with no
margin (`(availableWidth - spacing) / badgeCount`), which intermittently
still overflowed by a few pixels — sub-pixel rounding in `Wrap`/`Image`
layout can tip an exact zero-slack fit into wrapping an extra row anyway.
Fixed by reserving a small, fixed `safetyMargin` (1px) inside
`resolveTypeIconSize` itself, so every caller gets real slack instead of
relying on floating-point layout arithmetic to land exactly on a knife's
edge.

**Alternatives considered**:
- **Leave a flat low value (e.g. `40.0`)**: this was the original plan; superseded because the user explicitly preferred a larger, adaptive size over a small, safe flat one once the two-in-a-row overflow was demonstrated.
- **Different, hand-picked sizes per consumer**: rejected — reintroduces the exact per-widget drift `kStandardTypeIconSize` was created to end (013 User Story 1); the shared formula/cap keeps a single source of truth instead.
- **Bound the cap itself to whatever the narrowest supported cell allows**: rejected by the user — deliberately chose to let the cap be large (legible on desktop) and let narrow cells shrink instead of letting the narrowest cell dictate a small cap everywhere.

## Decision 2 — Coverage Analysis table real visibility

**Decision**: Treat this as a test-coverage gap first, not a rewrite of `CoverageAnalysisPage`/`CoverageTable`'s current layout — reproduce the reported symptom at a *realistic* viewport before changing code, since a targeted repro at three representative sizes did not show the symptom in the current code.

**Investigation performed**: A throwaway widget-test probe (`CoverageAnalysisPage`, no `pokemonTypes`) was run at three viewport sizes — 1440×900 (desktop web), 390×844 (mobile portrait), and 800×600 (the suite's implicit default) — checking the actual rendered `Rect` of both `CoverageTable` and the underlying `DataTable`, not just presence in the widget tree:

| Viewport | CoverageTable rect | Notes |
|---|---|---|
| 1440×900 | `(639,56)–(801,976)` | Non-zero size, positioned just below the app bar, extends below the fold (976 > 900) — reachable by the existing vertical scroll. |
| 390×844 | `(0,56)–(162,976)` | Flush left (mobile branch has no horizontal margin) but still non-zero and positioned at the top. |
| 800×600 | `(24,56)–(186,976)` | Matches the medium-breakpoint's 24px horizontal margin. |

No exception was thrown in any case, and the table's own header/rows were present with real, non-zero geometry starting immediately below the app bar (y=56) in every case — i.e., the current code does not reproduce "the table doesn't appear" at any of these three viewports. The only pre-existing test that used a viewport at all (`coverage_analysis_page_test.dart`) used an artificially cropped 400×300 window solely to prove the scroll behavior works — never a realistic viewport, which is exactly the gap called out in spec.md's Assumptions.

**Conclusions carried into Phase 1 / implementation**:
1. The most likely remaining causes are **outside what a widget test alone can catch**: the entry point button (`Icons.query_stats` in `TeamBuilderPage`'s `AppBar.actions`) not being reachable/visible in some real browser/window chrome, a stale/outdated build being tested (explicitly anticipated by FR-008/spec.md Assumptions), or a rendering discrepancy specific to a real browser engine (widget tests run on the Flutter test binding's synthetic renderer, not an actual browser). None of these are things this plan can resolve by guessing further code changes — they need to be checked against the actual running app (`flutter run -d chrome`, or the target device) as part of implementation/validation (see quickstart.md), not fixed blindly.
2. Regardless of root cause, this feature adds the missing realistic-viewport regression coverage (FR-005, SC-003) so a genuine future regression at a normal window size is caught by CI, not only a synthetic 400×300 crop.
3. If manual verification against a current build reproduces nothing, FR-008 applies: document that finding explicitly (which build/environment was checked) instead of shipping a speculative code change with no failing test behind it (Constitution Principle II).

**Alternatives considered**:
- **Immediately add more scrolling/layout wrapping "just in case"**: rejected by Principle I (Simplicity/YAGNI) — no reproduction, no justified change; would be the same kind of speculative fix that led to the second report after `014`'s scroll-only change.
- **Rewrite `CoverageAnalysisPage` around a different layout primitive (e.g., `CustomScrollView`/`Sliver`)**: no evidence current constraints are the problem; deferred unless manual verification on a real target proves a genuine layout defect.

**Implementation-time outcome (tasks T007–T011)**: T007's realistic-viewport
widget tests were added to `coverage_analysis_page_test.dart` (1440×900 and
390×844) and pass against the current, unmodified code — `CoverageTable`
and its `DataTable` both resolve to non-zero `Rect`s at both sizes, and the
first type row is present in the tree. **T009's live-browser verification
(`flutter run -d chrome`) was not performed in this implementation
session** — this repo has no existing "launch and drive the app" project
skill, and standing one up (Flutter web build + serve + browser
automation) was judged out of proportion to this fix's scope within the
session's time budget. No code change was made for User Story 2
(Constitution Principle I: no reproduced failure to justify one). Per
FR-008, this is recorded as the honest outcome: **automated evidence only
(widget-test), not confirmed against a real browser render.** Before
closing this feature outward-facing, a human should run through
`quickstart.md`'s "Coverage Analysis table visibility" scenario against a
freshly built app (`flutter run -d chrome`) to close that last gap — if it
reproduces there, the cause is likely something a widget test's synthetic
renderer cannot see (an actual browser/CanvasKit rendering quirk, a stale
deployed build, or similar), and should be filed as a fresh, scoped
follow-up rather than guessed at here.

## Decision 3 — Double-pop navigation bug on "Quitar del equipo"

**Decision**: Fix a real, located race condition in `TeamBuilderPage._openCustomizationCard`'s `onRemove` callback (`lib/presentation/team_builder/pages/team_builder_page.dart:286-289`) that can pop two routes instead of one.

**Root cause found**:
```dart
onRemove: () {
  cubit.removePokemon(slotIndex);
  Navigator.of(context).pop();   // `context` here is the BlocBuilder
},                                 // builder's own parameter, shadowing
                                    // _openCustomizationCard's outer one
```
This `onRemove` closure is declared inside `BlocBuilder<TeamBuilderCubit, TeamBuilderState>(bloc: cubit, builder: (context, liveState) { ... })` — the `context` it captures is the **inner** builder parameter, not `_openCustomizationCard`'s own `context` argument (Dart resolves the closest enclosing name). Separately, the same `builder` already contains a reactive close path for "Contract Rule 3" (`liveEntry == null` after the slot empties): it schedules `Navigator.of(sheetContext).pop()` in a post-frame callback whenever the live-rebuilt state shows the slot as empty.

`cubit.removePokemon(slotIndex)` synchronously empties the slot and emits a new `TeamBuilderState`. Because the sheet's `BlocBuilder` is bound directly to `cubit` (`bloc: cubit`), that emission triggers this `BlocBuilder` to rebuild with `liveEntry == null` — which is exactly the "Contract Rule 3" branch, scheduling *its own* pop via `sheetContext` for the very next frame. If that scheduled rebuild/pop lands before (or races with) `onRemove`'s own explicit `Navigator.of(context).pop()` line right after `removePokemon`, **two pops fire for what should be one sheet**: the first pop closes the modal sheet's route as intended, and the second pop — having nothing sheet-specific left to close — pops the *next* route down the stack, which is `TeamBuilderPage` itself, dropping the user back on the game selection menu. This matches the reported symptom exactly (intermittent, "a veces"), because it depends on frame timing/whether the rebuild's post-frame callback has already fired by the time `onRemove`'s own `pop()` runs.

**Fix approach**: Remove the redundant explicit pop from `onRemove` and let the single, already-existing "Contract Rule 3" reactive-close path (`sheetContext`-based, `canPop()`-guarded) be the *only* code path that closes the sheet after a removal — it already exists specifically to close the sheet once the slot becomes empty, so `onRemove` closing it a second time was always redundant, not load-bearing. `onRemove` becomes exactly `() => cubit.removePokemon(slotIndex)`, and closing the sheet is left entirely to the reactive rebuild that already runs on every emission (including this one).

**Alternatives considered**:
- **Guard the explicit pop with `if (Navigator.of(context).canPop())` using the correct outer context**: rejected — still races with the reactive path and would need its own guard against double-firing; strictly more complex than removing the redundant call.
- **Remove the reactive "Contract Rule 3" close instead, keep the explicit pop**: rejected — that path also has to stay for the "occupant went away out from under the open sheet" case the comment describes for *other* callers of this same rebuild (not just the remove button), so it cannot be deleted without losing that safety net.
- **Add a `mounted`/dispose guard**: doesn't address the actual bug (two independent pop calls against the same Navigator, not a pop against a disposed widget).

**Implementation-time finding — the reactive close itself was not idempotent**:
Building the regression test for this (T012) surfaced a second, deeper
layer of the same bug. After removing the redundant explicit pop alone
(the fix above), the double-pop still reproduced. Root cause: "Contract
Rule 3"'s `WidgetsBinding.instance.addPostFrameCallback(...)` was
re-registered on **every** `BlocBuilder` rebuild for as long as the slot
stayed empty — not just once. `removePokemon`'s own emission triggers one
such rebuild (scheduling pop #1), but `_openCustomizationCard` also calls
`cubit.clearActiveSlot()` right after `showModalBottomSheet` resolves,
which emits again; if that second emission's rebuild still finds
`liveEntry == null` (it does, the slot is still empty) before the sheet's
route has actually finished being removed from the tree, it scheduled a
*second* `addPostFrameCallback` pop — which, landing after the sheet's own
route is gone, pops `TeamBuilderPage` instead. Fixed by guarding the
branch with a `hasScheduledClose` flag local to `_openCustomizationCard`
(captured once per sheet instance, not per rebuild), so at most one pop is
ever scheduled for a given sheet's whole lifetime, no matter how many
subsequent emissions still find the slot empty. Confirmed via a widget
test that mirrors production's real navigation stack (`TeamBuilderPage`
pushed on top of a previous route via `Navigator.push`, exactly like
`game_selection_page.dart` does) — a root-mounted `TeamBuilderPage` (no
route underneath) would have masked this entirely, since a second,
erroneous pop on the last remaining route is a harmless no-op there.

## Summary

| Area | Investigation | Outcome |
|---|---|---|
| Type size | Reviewed shared-constant contract and its one real dimensional constraint (100×100 fixture) | New value: `40.0` (from `24.0`) |
| Coverage table visibility | Reproduced at 3 realistic viewports via widget-test probe; no failure found in current code | No blind code change; add realistic-viewport regression test; verify manually against a current build per FR-008 |
| Remove-Pokémon navigation | Traced the exact double-`Navigator.pop()` race | Remove the redundant explicit pop in `onRemove`; rely solely on the existing reactive close |
