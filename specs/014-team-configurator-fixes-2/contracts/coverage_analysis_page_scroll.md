# Contract: Coverage Analysis page scrolls vertically

**Covers**: FR-003. User Story 2 (P1 — currently invisible feature).

## Behavior

`CoverageAnalysisPage` (`presentation/team_builder/pages/
coverage_analysis_page.dart`):

```dart
// Before:
body: const CoverageTable(),

// After:
body: SingleChildScrollView(
  child: CoverageTable(pokemonTypes: pokemonTypes),
),
```

`CoverageTable` keeps its own *horizontal* `SingleChildScrollView` around
the `DataTable` (unchanged from `013`) — the page now adds the missing
*vertical* one around the whole table, so the section is reachable by
scrolling on any viewport height instead of being clipped/pushed off
`Scaffold.body`.

## Not amended

- `AdaptiveScaffold` itself — unaffected; it already gives `body` the full
  remaining viewport, which is exactly why an unscrollable tall child was
  the problem.
- `CoverageTable`'s own horizontal scroll wrapper — kept as-is.

## Test Expectations

- `coverage_analysis_page_test.dart`: at a constrained/short test viewport
  (shorter than the full 18-row table), the table's last row is reachable
  by scrolling (`tester.drag`/`scrollUntilVisible` finds it) instead of
  overflowing — regression test for "no aparece ... no es visible".
- The page still renders correctly (no overflow exceptions) at a tall
  desktop viewport where scrolling isn't needed.
