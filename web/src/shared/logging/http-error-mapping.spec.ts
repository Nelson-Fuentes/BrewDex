import { logAndRethrow } from './http-error-mapping';
import { LoggingService } from './logging.service';

class TestFailure extends Error {}

describe('logAndRethrow', () => {
  it('registra el error original y lanza el failure de dominio', () => {
    const logging = jasmine.createSpyObj<LoggingService>('LoggingService', ['error']);
    const originalError = new Error('network down');

    expect(() =>
      logAndRethrow(logging, 'TestContext', originalError, () => new TestFailure('unavailable')),
    ).toThrowError(TestFailure);

    expect(logging.error).toHaveBeenCalledWith(
      'TestContext',
      jasmine.any(String),
      originalError,
    );
  });
});
