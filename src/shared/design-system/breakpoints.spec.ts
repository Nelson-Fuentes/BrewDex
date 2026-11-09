import { Breakpoints } from './breakpoints';

describe('Breakpoints.resolve', () => {
  it('devuelve "compact" por debajo de 600px', () => {
    expect(Breakpoints.resolve(0)).toBe('compact');
    expect(Breakpoints.resolve(599)).toBe('compact');
  });

  it('devuelve "medium" desde 600px y hasta antes de 840px', () => {
    expect(Breakpoints.resolve(600)).toBe('medium');
    expect(Breakpoints.resolve(839)).toBe('medium');
  });

  it('devuelve "expanded" desde 840px en adelante', () => {
    expect(Breakpoints.resolve(840)).toBe('expanded');
    expect(Breakpoints.resolve(10_000)).toBe('expanded');
  });
});
