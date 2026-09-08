<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (MINOR: new principle added)
- Modified principles: n/a
- Added sections:
  - Core Principle VI. Hexagonal Architecture, Clean Architecture & DDD
    (NON-NEGOTIABLE) — domain isolation, Ports & Adapters, dependency
    rule, bounded contexts, thin entry-point adapters
- Amended sections:
  - Technology & Architecture Constraints — added a line confining
    frameworks/ORMs/infra libraries to the adapters layer per Principle VI
- Removed sections: none
- Templates requiring follow-up: none checked in this run — this command
  only touches the constitution itself; dependent templates
  (plan/spec/tasks templates and command prompts) read this file at
  runtime and were intentionally left untouched per scope guard. Future
  `/speckit-plan` runs for BrewDex should reflect the hexagonal/DDD
  layering (domain/application/infrastructure) when structuring the
  project.
- Deferred / TODO placeholders: none.
-->

# BrewDex Constitution

## Core Principles

### I. Simplicity & YAGNI
Every feature MUST start with the simplest design that satisfies the current,
stated requirement. Speculative abstractions, unused configuration options,
and "just in case" extensibility MUST NOT be added ahead of an actual need.
Any added architectural complexity (a new layer, service, dependency, or
abstraction) MUST be justified in the relevant plan with the concrete
requirement it serves; if that justification cannot be stated, the
complexity MUST be removed.
**Rationale**: Unjustified complexity is the most common source of long-term
maintenance cost and defect surface area. Requiring an explicit justification
keeps that cost visible at design time, when it is cheapest to reject.

### II. Test-First Development
For business logic and public interfaces, tests MUST be written before the
implementation, MUST be reviewed, and MUST fail for the right reason before
implementation begins (Red-Green-Refactor). Bug fixes MUST include a
regression test that fails without the fix and passes with it. Purely
exploratory spikes are exempt, but code from a spike MUST NOT ship without
tests written retroactively before merge.
**Rationale**: Writing the test first forces the requirement to be stated
unambiguously before code exists to satisfy it, and guarantees every shipped
behavior has a verifiable, automated check.

### III. Clear Contracts & Interfaces
Every module, service, or library MUST expose a documented, minimal public
interface; internal details it does not commit to MUST NOT be exposed.
Breaking changes to a public contract (API shape, CLI flags, data schema)
MUST be called out explicitly in the plan and MUST follow the versioning
rule in Governance. Interfaces MUST be independently testable without
standing up unrelated parts of the system.
**Rationale**: Explicit contracts let features, services, and consumers
change independently and let tests target behavior instead of
implementation detail.

### IV. Code Quality & Review
All code merged to the main line MUST pass automated linting/static
analysis and MUST be reviewed by at least one person other than the
author before merge. Review MUST verify: adherence to these principles,
test coverage of new behavior, and absence of dead or duplicated code.
No direct commits to the main branch; all changes MUST land through a
reviewable change set (pull/merge request).
**Rationale**: Independent review catches defects and constitution
violations earlier and cheaper than any later stage, and keeps the main
line always in a releasable state.

### V. Observability & Versioning
Services and libraries MUST emit structured, actionable logs/errors
sufficient to diagnose a failure without attaching a debugger. Every
released component MUST follow semantic versioning (MAJOR.MINOR.PATCH):
MAJOR for breaking contract changes, MINOR for backward-compatible
functionality, PATCH for backward-compatible fixes. Breaking changes
MUST include a migration note.
**Rationale**: Debuggability and predictable versioning are what let
BrewDex evolve quickly without surprising the people and systems that
depend on it.

### VI. Hexagonal Architecture, Clean Architecture & DDD (NON-NEGOTIABLE)
Every service/application MUST be structured as a Domain-Driven Design
domain, isolated from the outside world via Hexagonal (Ports & Adapters)
architecture, following Clean Architecture's dependency rule (dependencies
MUST point inward, never outward):
- **Domain layer** (entities, value objects, aggregates, domain services,
  domain events) MUST have zero dependencies on frameworks, databases,
  HTTP, UI, ORMs, or any external library. It MUST be plain, framework-free
  code expressing business rules and the ubiquitous language of its
  bounded context.
- **Application layer** (use cases / application services) orchestrates
  domain objects to fulfill a use case. It MUST depend only on the domain
  layer and on the ports (interfaces) it defines itself; it MUST NOT
  depend on any concrete infrastructure implementation.
- **Infrastructure/adapters** (persistence/repositories, REST/GraphQL
  controllers, CLI, message consumers, external API clients) MUST
  implement the ports declared by the domain/application layers.
  Infrastructure code MAY depend on the domain and application layers;
  the domain and application layers MUST NOT depend on infrastructure —
  this direction MUST NOT be inverted.
- Bounded contexts MUST be identified explicitly, modeled around a
  ubiquitous language shared with the plan/spec, and MUST NOT leak one
  context's internal model into another; cross-context communication
  MUST go through an explicit, documented contract.
- Entry-point adapters (controllers, CLI commands, event handlers) MUST
  stay thin: they translate transport concerns to/from application-layer
  calls and MUST NOT contain business rules.
- A dependency, import, or call that violates the inward-pointing rule
  above MUST be rejected in review; if it appears unavoidable, the
  architecture MUST be revisited before the exception is accepted (see
  Principle I).
**Rationale**: Keeping the domain free of infrastructure makes business
rules independently testable (Principle II), keeps contracts explicit at
the port boundary (Principle III), and lets BrewDex swap frameworks,
databases, or delivery mechanisms without rewriting business logic.

## Technology & Architecture Constraints

Technology choices (languages, frameworks, storage, infrastructure) MUST be
made deliberately and recorded, with the reasoning, in the plan for the
feature that introduces them — not assumed by convention. New external
dependencies MUST be justified by a concrete need they satisfy that
existing dependencies cannot; prefer the standard library or an
already-adopted dependency over adding a new one for marginal convenience.
Cross-cutting architectural decisions (e.g., introducing a new service,
data store, or messaging system) MUST be documented as such in the plan
so future contributors can find the reasoning without spelunking history.
Any chosen framework, ORM, or infrastructure library MUST be confined to
the infrastructure/adapters layer per Principle VI; it MUST NOT be
imported by domain or application code.

## Development Workflow

Every feature MUST go through: specification → plan → tasks → implementation,
using the project's Spec Kit workflow, before code is written for anything
beyond a throwaway spike. Pull/merge requests MUST link the spec or task
they implement. CI MUST pass (build, lint, tests) before merge is permitted.
Reviewers MUST check the change against this constitution's principles, not
only against the immediate ticket.

## Governance

This constitution supersedes any conflicting practice, template default, or
prior convention. Amendments are made by editing this file through the
`/speckit-constitution` workflow (or an equivalent reviewed change), and
MUST update the version per the policy below and record the change in a
Sync Impact Report at the top of the file. Any pull/merge request MUST be
checked for compliance with the current constitution during review;
non-trivial complexity introduced by a change MUST be justified against
Principle I or the change MUST be simplified before merge.

Versioning policy (semantic versioning applied to this document):
- MAJOR: Backward-incompatible governance changes — removing or
  redefining a principle in a way that changes what was previously
  required.
- MINOR: Adding a new principle or section, or materially expanding
  existing guidance.
- PATCH: Wording clarifications, typo fixes, and other non-semantic
  refinements that do not change what is required.

**Version**: 1.1.0 | **Ratified**: 2026-08-22 | **Last Amended**: 2026-08-22
