# Contract: Larger card sprite + sticky Mega/Dinamax/Shiny row

**Covers**: FR-010, FR-011. User Stories 7, 9.

## Sprite size (FR-010)

`pokemon_customization_card.dart`'s sprite `SizedBox` grows from its
current `168×168` (already `013`'s +75%-over-96 increase) to a further
notoriously-larger size — concretely **224×224** (a further ~+33%, kept a
round, easy-to-reason-about number rather than another compounding
percentage) — verified against the rest of the card's content (name,
types, moves, actions) still fitting without clipping/overlap at both the
web and mobile card layouts (spec.md Acceptance Scenario 2 of User Story
7). Exact value confirmed/adjusted during `/speckit-implement` against a
real device/viewport if 224 turns out to crowd the mobile layout.

## Sticky action row (FR-011)

`013` already moved "Quitar del equipo" out of the scrollable `Column`
into a fixed footer (`pokemon_customization_card.dart`'s `Column` split
between a scrollable body and a non-scrolling footer). This feature moves
the Mega/Dinamax/Shiny toggle row (currently inside the scrollable body,
above the moves list) into that **same fixed footer**, stacked above
"Quitar del equipo" — so both groups of actions stay visible together
while the card's body (types, stats, moves) scrolls independently.

```text
Card
├── Expanded(scrollable body: sprite, name, types, stats, moves list)
└── Fixed footer (non-scrolling):
    ├── Mega / Dinamax / Shiny toggle row   # NEW position
    └── "Quitar del equipo" button           # unchanged (013)
```

## Not amended

- The toggle row's own widgets/behavior (which toggles are shown for which
  game, mutual exclusivity of Mega/Gigamax) — unchanged, only its position
  in the layout moves.
- Type-badge sizing in the card — covered by `standard_type_badge_dimensions.md`.

## Test Expectations

- `pokemon_customization_card_test.dart`: the sprite's rendered size is
  larger than `013`'s `168×168`, and the rest of the card's key content
  (name text, type badges, "Quitar del equipo") remains present/unclipped
  in the widget tree.
- `pokemon_customization_card_test.dart`: after scrolling the card's body,
  the Mega/Dinamax/Shiny toggle row and "Quitar del equipo" are both still
  hit-testable (visible, not scrolled out) — same assertion style `013`
  already used for the sticky remove button alone.
