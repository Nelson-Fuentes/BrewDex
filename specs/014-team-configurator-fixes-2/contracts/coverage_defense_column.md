# Contract: Coverage table's defense-efficacy column

**Covers**: FR-012, FR-013, FR-014. User Story 8.

## Widget change

```dart
class CoverageTable extends StatelessWidget {
  const CoverageTable({super.key, this.pokemonTypes});

  final List<PokemonType>? pokemonTypes;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final showDefense = pokemonTypes != null && pokemonTypes!.isNotEmpty;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columns: [
          DataColumn(label: Text(l10n.coverageAnalysisTypeColumnHeader)),
          if (showDefense)
            DataColumn(label: Text(l10n.coverageAnalysisDefenseColumnHeader)),
        ],
        rows: [
          for (final type in kAllPokemonTypes)
            DataRow(cells: [
              DataCell(Text(type.label)),
              if (showDefense)
                DataCell(Text(_formatMultiplier(
                  _defenseEfficacy(attacking: type, defending: pokemonTypes!),
                ))),
            ]),
        ],
      ),
    );
  }
}
```

`_defenseEfficacy` multiplies, for each type in `pokemonTypes`, that
attacking type's existing per-type multiplier from `type_effectiveness_
chart.dart` (the same table `013`'s now-removed card weaknesses section
used) — i.e. `defending.length == 1 ? factor(attacking, defending[0]) :
factor(attacking, defending[0]) * factor(attacking, defending[1])`.
`_formatMultiplier` renders a clean `0`, `0.5`, `1`, `2`, or `4` (never a
raw float artifact like `2.0000000001`).

## Column header string

New `.arb` key `coverageAnalysisDefenseColumnHeader` ("Eficacia de
defensa" in `app_es.arb`; an equivalent phrase — e.g. "Defense Efficacy" —
added to every other locale file per the project's existing full-locale-
coverage convention, `tool/check_arb_completeness.dart`).

## Not amended

- The type-name column and row order — unchanged from `013`.
- `type_effectiveness_chart.dart` itself — read-only reuse, no changes to
  its data or public shape.

## Test Expectations

- `coverage_table_test.dart`: a single-type `pokemonTypes` (e.g. `[Water]`)
  renders the correct `0.5`/`1`/`2` per attacking-type row, cross-checked
  against a few known matchups (Water resists Fire/Water/Ice/Steel at
  `0.5`, is weak to Grass/Electric at `2`).
- A two-type `pokemonTypes` combination with a known double-weakness (e.g.
  `[Ice, Flying]` is 4× weak to Rock) renders `4` for that attacking row,
  and a combination with a cancelling `0.5`×`2` renders `1`.
- A `pokemonTypes` combination including a type immunity (e.g. `[Ghost,
  ...]` vs. Normal/Fighting attacks) renders `0`.
- `pokemonTypes: null`/empty omits the defense column entirely (only the
  type-name column renders, same as `013`'s behavior) — no regression to
  the parameter-free call sites, if any remain after `/speckit-tasks`
  wiring.
- Changing `pokemonTypes` (simulating switching the displayed card's
  Pokémon) re-renders the column with the new values (FR-014).
