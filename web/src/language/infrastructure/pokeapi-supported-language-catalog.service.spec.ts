import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PokeApiSupportedLanguageCatalogService } from './pokeapi-supported-language-catalog.service';
import { LanguageCatalogUnavailable } from '../domain/ports/supported-language-catalog';

const EXPECTED_CODES = ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh-hans'];

describe('PokeApiSupportedLanguageCatalogService', () => {
  let service: PokeApiSupportedLanguageCatalogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PokeApiSupportedLanguageCatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('devuelve exactamente los 8 idiomas de FR-002, con "zh" para zh-hans', async () => {
    const promise = service.fetchSupportedLanguages();

    for (const code of EXPECTED_CODES) {
      const req = httpMock.expectOne(`https://pokeapi.co/api/v2/language/${code}/`);
      req.flush({ name: code });
    }

    const result = await promise;
    expect(result.map((l) => l.code)).toEqual(['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh']);
    expect(result.every((l) => l.displayName.length > 0)).toBeTrue();
  });

  it('lanza LanguageCatalogUnavailable si una petición falla', async () => {
    const promise = service.fetchSupportedLanguages();
    const resultPromise = expectAsync(promise).toBeRejectedWith(
      jasmine.any(LanguageCatalogUnavailable),
    );

    const requests = EXPECTED_CODES.map((code) =>
      httpMock.expectOne(`https://pokeapi.co/api/v2/language/${code}/`),
    );
    requests[0].error(new ProgressEvent('network error'));
    requests.slice(1).forEach((req, i) => req.flush({ name: EXPECTED_CODES[i + 1] }));

    await resultPromise;
  });
});
