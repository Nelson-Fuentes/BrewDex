# CLAUDE.md

Instrucciones para Claude Code al trabajar en este repositorio (BrewDex).

## 0. Repaso de información antes de una modificación

Antes de cualquier modificación o planificación de implementación:

0. export SPECIFY_INIT_DIR="$(git rev-parse --show-toplevel)/vault"
1. `cd vault && git pull && cd ..`
2. Revisar `vault/specs/`, `vault/02_Architecture/` y el `graphify-out/GRAPH_REPORT.md` de ESTE repo.

## 0.1. Ubicación de los specs de Speckit — regla crítica

Regla inviolable: toda skill de Speckit (`speckit-specify`, `speckit-clarify`, `speckit-plan`, `speckit-tasks`, `speckit-analyze`, `speckit-checklist`, `speckit-implement`, `speckit-converge`, `speckit-taskstoissues`, etc.) DEBE trabajar sobre `vault/specs/`, nunca sobre `./specs/` en la raíz de este repo. `./specs/` quedó en desuso y no debe recibir más contenido.

- Antes de invocar cualquier skill de Speckit, fijá `SPECIFY_FEATURE_DIRECTORY` apuntando dentro de `vault/specs/` (por ejemplo `vault/specs/<NNN>-<short-name>`), en vez de dejar que la skill use su default `specs/`.
- Al crear una feature nueva con `speckit-specify`, el directorio de la feature (spec.md, checklists/, y luego plan.md/research.md/data-model.md/tasks.md/quickstart.md/contracts/ que agreguen las demás skills) se crea directamente en `vault/specs/<NNN>-<short-name>`, no en `specs/`.
- Escribí `.specify/feature.json` con `"feature_directory": "vault/specs/<NNN>-<short-name>"`.
- Como `vault/specs/` vive dentro del submódulo `./vault`, aplicá siempre la regla 3 (sincronización del vault) después de crear o modificar contenido ahí.
- No copies ni dupliques el contenido en `./specs/`; ese directorio se conserva solo como historial de features previas a este cambio.

## 1. Actualización automática de Graphify (local a este repo)

Regla inviolable: después de cualquier cambio estructural o funcional en el código, mantené actualizado `graphify-out/` (`graph.json`, `GRAPH_REPORT.md`, `graph.html`) con el paquete oficial `graphifyy` (con dos "y"), sin consumo de tokens en la parte AST ($0.00 USD).

## 2. Actualización automática de Obsidian (LLM Wiki)

Regla inviolable: después de cualquier cambio en reglas de negocio, lógica de dominio o arquitectura, actualizá la nota correspondiente en `vault/03_Modules/` o `vault/04_Business_Rules/`, con front-matter `repo:` y enlace `spec:` cuando aplique.

## 3. Sincronización del vault (submódulo) — regla crítica multi-repo

Después de actualizar cualquier nota en `./vault`:

```bash
cd vault
git add -A && git commit -m "wiki: <resumen del cambio>"
git push
cd ..
git add vault
git commit -m "bump vault submodule: <resumen>"
```

Sin este paso, los otros repos (backend/web/mobile) NUNCA ven la actualización.

## 4. Registro en el log

Cada entrada en `vault/06_Logs/log.md` debe incluir `repo:` (de dónde vino el cambio) y `feature:` (a qué spec corresponde), para trazabilidad entre los repos.
