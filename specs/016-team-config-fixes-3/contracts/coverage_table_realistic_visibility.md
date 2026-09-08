# Contract: Coverage Analysis table visibility at realistic viewports

**Covers**: FR-004, FR-005, FR-008. User Story 2.

**Supersedes**: `014-team-configurator-fixes-2`'s
`coverage_analysis_page_scroll.md` contract, which only required a vertical
`Scrollable` with real scroll extent at an artificially cropped 400×300
viewport. This contract keeps that requirement (still correct, still
tested) and adds the missing realistic-viewport coverage that a second
"sigue sin ser visible" report showed was never actually verified.

## Requirement

At every supported, realistic viewport size (not an artificially cropped
one), navigating to `CoverageAnalysisPage`:

1. Renders `CoverageTable`/`DataTable` with non-zero, on-screen geometry
   (`tester.getRect(...)` width and height both `> 0`) positioned at or
   below the app bar — not clipped to zero size or pushed fully off-tree.
2. Requires no unsignaled action beyond scrolling (already covered) to see
   the header and first rows.
3. If, after implementation-time manual verification against a current
   build (`flutter run -d chrome`, or the actual target device/browser),
   the reported symptom does **not** reproduce, that finding MUST be
   recorded (which build/environment/URL was checked, and when) rather
   than shipping a speculative layout change with no failing test behind
   it (Constitution Principle II; spec.md FR-008/Assumptions).

## Test Expectations (new)

- A widget test parameterized over at least two realistic viewport sizes —
  a representative desktop web size (e.g. 1440×900) and a representative
  mobile portrait size (e.g. 390×844) — asserting `CoverageTable`'s and
  `DataTable`'s rendered `Rect` have positive width and height, in addition
  to the existing `findsOneWidget` presence checks. This closes the gap
  where the only sized-viewport test used a 400×300 crop that exists solely
  to prove scroll behavior, not to prove visibility at a size a real user
  would actually use.
- The existing `coverage_analysis_page_test.dart` and
  `coverage_table_test.dart` suites are otherwise unchanged — the scroll
  and defense-column contracts they already assert remain in force.
- `quickstart.md` documents the manual verification step for real
  browser/device confirmation (point 3 above), since a widget test alone
  cannot rule out a build-freshness or real-renderer-specific cause.
