# Reglas e Instrucciones del Repositorio

## 0. Repaso de Información Antes de una Modificación
1. cd vault && git pull && cd ..
2. Revisar vault/specs/, vault/02_Architecture/ y graphify-out/GRAPH_REPORT.md de ESTE repo
antes de cualquier modificación o planificación de implementación.

## 1. Actualización Automática de Graphify (local a este repo)
Regla inviolable: después de cualquier cambio estructural o funcional en el código, mantener actualizado graphify-out/ (graph.json, GRAPH_REPORT.md, graph.html) con el paquete oficial graphifyy (con dos 'y'), sin consumo de tokens en la parte AST ($0.00 USD).

## 2. Actualización Automática de Obsidian (LLM Wiki)
Regla inviolable: después de cualquier cambio en reglas de negocio, lógica de dominio o arquitectura, actualizar la nota correspondiente en vault/03_Modules/ o vault/04_Business_Rules/, con front-matter repo: y enlace spec: cuando aplique.

## 3. Sincronización del Vault (submódulo) — REGLA CRÍTICA MULTI-REPO
Después de actualizar cualquier nota en ./vault:
    cd vault
    git add -A && git commit -m "wiki: <resumen del cambio>"
    git push
    cd ..
    git add vault
    git commit -m "bump vault submodule: <resumen>"
Sin este paso, los otros repos (backend/web/mobile) NUNCA ven la actualización.

## 4. Registro en el Log
Cada entrada en vault/06_Logs/log.md debe incluir repo: (de dónde vino el cambio) y feature: (a qué spec corresponde), para trazabilidad entre los repos.
