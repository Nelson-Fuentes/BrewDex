# Contract: Coverage Analysis — first increment (types column only)

**Covers**: FR-015, FR-016, SC-007. User Story 7.

## Navigation

`TeamBuilderPage`'s `AdaptiveScaffold.actions` gains one new `IconButton` (e.g. `Icons.query_stats`, tooltip `l10n.coverageAnalysisNavTooltip`) that does:

```dart
Navigator.of(context).push(
  MaterialPageRoute(builder: (_) => const CoverageAnalysisPage()),
);
```

Placed alongside (not replacing) any existing app-bar actions on this page.

## `CoverageAnalysisPage`

```dart
class CoverageAnalysisPage extends StatelessWidget {
  const CoverageAnalysisPage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return AdaptiveScaffold(
      title: l10n.coverageAnalysisPageTitle,
      body: const CoverageTable(),
    );
  }
}
```

## `CoverageTable`

```dart
class CoverageTable extends StatelessWidget {
  const CoverageTable({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columns: [DataColumn(label: Text(l10n.coverageAnalysisTypeColumnHeader))],
        rows: [
          for (final type in kAllPokemonTypes)
            DataRow(cells: [DataCell(Text(type.label))]),
        ],
      ),
    );
  }
}
```

## New l10n keys (all 10 `.arb` locales)

| Key | Example (es) |
|---|---|
| `coverageAnalysisNavTooltip` | "Análisis de cobertura" |
| `coverageAnalysisPageTitle` | "Análisis de Cobertura" |
| `coverageAnalysisTypeColumnHeader` | "Tipo" |

## Explicitly out of scope for this increment

- Any column beyond the type-name column (offense/defense coverage per roster Pokémon, aggregate counts, color-coded effectiveness cells) — spec.md Assumptions defer these to a future feature/increment.
- Passing `game`/roster data into `CoverageAnalysisPage`/`CoverageTable` — not needed until a future increment adds per-Pokémon columns.

## Test Expectations

- `coverage_table_test.dart`: renders exactly `kAllPokemonTypes.length` rows; row `i`'s first cell shows `kAllPokemonTypes[i].label` as plain text (no `PokemonTypeIcon`/`Image` present anywhere in the table).
- `coverage_analysis_page_test.dart`: the page renders `CoverageTable`; tapping the new app-bar action from `TeamBuilderPage` navigates to a page showing the coverage table's title/header.
