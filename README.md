# BrewDex

Una aplicación web para construir equipos Pokémon: elegí idioma, elegí juego (con sus DLC), navegá su Pokédex y armá un equipo de hasta 6 Pokémon.

Construida con [Angular](https://angular.dev) — ver [specs/017-migracion-angular/](specs/017-migracion-angular/) para la especificación, el plan y las tareas de esta migración desde la versión anterior en Flutter.

## Desarrollo

```bash
cd web
npm install
npm start        # http://localhost:4200
```

## Tests

```bash
cd web
npm test          # unitarios (Karma/Jasmine)
npm run test:e2e  # extremo a extremo (Playwright + auditoría de accesibilidad)
```

## Build

```bash
cd web
npm run build      # dist/web/ — SPA estática instalable (PWA)
```

Ninguna variable de entorno ni credencial es necesaria: la app consume [PokeAPI](https://pokeapi.co) públicamente desde el navegador. No hay backend propio.
