// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const boundaries = require("eslint-plugin-boundaries");

// BrewDex module-first architecture (specs/017-migracion-angular/plan.md,
// research.md Decisión 11 — Constitución Principio VI): cada módulo de
// negocio (`language`, `game`, `pokemon`, `pokedex`, `team`) tiene sus
// propias capas `domain/application/infrastructure/presentation`. Estas
// reglas de `eslint-plugin-boundaries` son la aplicación automática de esa
// arquitectura — un import que las viole DEBE fallar el lint antes de
// llegar a review.
const moduleCapture = "(language|game|pokemon|pokedex|team)";

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: { boundaries },
    settings: {
      // `eslint-plugin-boundaries` resuelve cada import vía
      // `eslint-module-utils`, que necesita un resolver para convertir un
      // specifier relativo (`'../game/infrastructure/...'`) en una ruta
      // real antes de poder clasificarlo — sin esto, todo import local
      // queda "de tipo desconocido" y las reglas de abajo nunca se
      // aplican (verificado con `ESLINT_PLUGIN_BOUNDARIES_DEBUG=1`).
      "import/resolver": { typescript: {} },
      "boundaries/include": ["src/**/*.ts"],
      // La raíz de composición (`app.config.ts`/`app.routes.ts`/`main.ts`)
      // queda fuera de las reglas de límites: es el único lugar que puede
      // ver infraestructura/presentación de cualquier módulo para cablearlas
      // (igual que `AppDependencies` en la versión Flutter). Los tests
      // (`*.spec.ts`) también quedan fuera: pueden necesitar referenciar la
      // clase concreta de un componente hijo de otro módulo solo para
      // stubearla en `provide:` — cableado de test, no acoplamiento real.
      "boundaries/ignore": ["src/app.config.ts", "src/app.routes.ts", "src/main.ts", "src/**/*.spec.ts"],
      "boundaries/elements": [
        { type: "domain", pattern: `src/${moduleCapture}/domain/**`, capture: ["module"] },
        { type: "application", pattern: `src/${moduleCapture}/application/**`, capture: ["module"] },
        { type: "infrastructure", pattern: `src/${moduleCapture}/infrastructure/**`, capture: ["module"] },
        { type: "presentation", pattern: `src/${moduleCapture}/presentation/**`, capture: ["module"] },
        { type: "shared", pattern: "src/shared/**" },
      ],
    },
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "app", style: "camelCase" },
      ],
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "app", style: "kebab-case" },
      ],
      // BrewDex distingue componentes de página ("Page", enrutados) de
      // componentes reutilizables ("Component") — mismo naming ya usado en
      // plan.md/tasks.md (`language-selector.page.ts` → `LanguageSelectorPage`).
      "@angular-eslint/component-class-suffix": ["error", { suffixes: ["Component", "Page"] }],
      "boundaries/no-unknown": "error",
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          message:
            "${file.type} (módulo ${file.capture.module}) no puede importar ${dependency.type} (módulo ${dependency.capture.module}) — ver plan.md Constitution Check Principio VI y research.md Decisión 11.",
          rules: [
            // El dominio es TypeScript puro: solo puede depender de dominio
            // (de su propio módulo o de otro, p. ej. `team` usando `Gender`
            // de `pokemon` — sigue siendo dato plano, no infraestructura).
            { from: "domain", allow: ["domain"] },
            // La aplicación orquesta dominio y expone/usa puertos — nunca
            // conoce un adaptador concreto de infraestructura.
            { from: "application", allow: ["domain", ["application", { module: "${from.module}" }]] },
            // La infraestructura implementa puertos: puede ver el dominio de
            // cualquier módulo (los puertos que implementa), la aplicación y
            // la infraestructura de su propio módulo, y `shared`. Nunca la
            // infraestructura de otro módulo directamente (eso violaría el
            // límite de módulo — debe pasar por un puerto documentado en
            // contracts/).
            {
              from: "infrastructure",
              allow: [
                "domain",
                ["application", { module: "${from.module}" }],
                ["infrastructure", { module: "${from.module}" }],
                "shared",
              ],
            },
            // La presentación es un adapter de entrada delgado: ve el
            // dominio (tipos), `shared`, la aplicación/infraestructura de
            // su propio módulo (casos de uso puros y su store), y puede
            // componer componentes de presentación de otros módulos
            // (reuso de UI) — pero nunca la aplicación/infraestructura
            // interna de otro módulo.
            {
              from: "presentation",
              allow: [
                "domain",
                "shared",
                ["application", { module: "${from.module}" }],
                ["infrastructure", { module: "${from.module}" }],
                "presentation",
              ],
            },
            // `shared` es la única carpeta que cualquier capa de cualquier
            // módulo puede importar libremente (contracts/responsive-layout.md)
            // — a cambio, `shared` mismo no depende de ningún módulo.
            // `shared` también aloja el cableado de inyección de los
            // pocos puertos cruzados entre módulos (p. ej.
            // `ACTIVE_LANGUAGE_READER` en shared/tokens/) — puede
            // referenciar el `domain` de cualquier módulo para eso, pero
            // nunca su `infrastructure`/`presentation` concretos.
            { from: "shared", allow: ["shared", "domain"] },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
);
