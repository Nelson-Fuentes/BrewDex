# Contract: módulo `language`

Puertos de dominio (`web/src/language/domain/ports/`) — interfaces TypeScript sin implementación. Implementados por adaptadores en `web/src/language/infrastructure/`.

## `SupportedLanguageCatalog`

```ts
export interface SupportedLanguageCatalog {
  /** Catálogo completo de idiomas oficiales, en orden estable y presentable.
   *  Lanza LanguageCatalogUnavailable si no se puede obtener — nunca
   *  devuelve una lista parcial en silencio. */
  fetchSupportedLanguages(): Promise<SupportedLanguage[]>;
}
```

Implementación: `PokeApiSupportedLanguageCatalogService` (HTTP GET a `language` de PokeAPI, colapsando `ja`/`ja-Hrkt` en una sola entrada `ja`, igual que la versión Flutter).

## `DeviceLocaleProvider`

```ts
export interface DeviceLocaleProvider {
  /** Idioma actual del navegador como código con forma PokeAPI (p. ej.
   *  "es", "zh-Hans"). No garantiza que esté en el catálogo soportado —
   *  eso lo valida quien llama. */
  currentDeviceLanguageCode(): string;
}
```

Implementación: `BrowserDeviceLocaleProviderService` (lee `navigator.language`, resolviendo el caso especial de chino a `zh-Hans`/`zh-Hant` igual que `PlatformDeviceLocaleProvider`).

## `ActiveLanguageReader` (único tipo cruzable entre bounded contexts)

```ts
export interface ActiveLanguageReader {
  /** Código de idioma vigente. Siempre válido y no vacío — resuelto antes
   *  de que cualquier consumidor pueda observar un valor (FR-003). */
  currentLanguageCode(): string;

  /** Emite un nuevo código cada vez que cambia (tras una selección
   *  explícita). No emite el valor actual al suscribirse. */
  onLanguageChanged(): Observable<string>;
}
```

Implementación: `InMemoryActiveLanguageService` — signal interno, sin ningún almacenamiento (FR-015). Es el único tipo del módulo `language` que `game`/`pokemon`/`pokedex`/`team` pueden importar (Constitución Principio VI).

## `LanguageStore` (servicio de aplicación, no un puerto de dominio)

```ts
export interface LanguageStore {
  readonly supportedLanguages: Signal<ReadonlyArray<SupportedLanguage>>;
  readonly activeLanguageCode: Signal<string>;

  /** FR-003: efectivo de inmediato, para el resto de la sesión —
   *  ningún almacenamiento involucrado. */
  selectLanguage(languageCode: string): void;
}
```

## Sin puerto de persistencia

No existe un equivalente a `LanguagePreferenceStore` (Flutter) en esta migración — ver [[../research.md]] Decisión 5. El idioma activo se resuelve una vez al iniciar la sesión (dispositivo si está soportado, si no un valor por defecto) y solo cambia por selección explícita durante esa misma sesión.
