import { genderCapability, resolveDisplayGender } from './gender';

describe('genderCapability', () => {
  it('es genderless cuando genderRate es -1', () => {
    expect(genderCapability(-1)).toBe('genderless');
  });

  it('es male-only cuando genderRate es 0', () => {
    expect(genderCapability(0)).toBe('male-only');
  });

  it('es female-only cuando genderRate es 8', () => {
    expect(genderCapability(8)).toBe('female-only');
  });

  it('es dual cuando genderRate está entre 1 y 7', () => {
    expect(genderCapability(1)).toBe('dual');
    expect(genderCapability(4)).toBe('dual');
    expect(genderCapability(7)).toBe('dual');
  });
});

describe('resolveDisplayGender', () => {
  it('devuelve el género guardado sin importar la capacidad, si no es null', () => {
    expect(resolveDisplayGender(4, 'female')).toBe('female');
    expect(resolveDisplayGender(0, 'male')).toBe('male');
    expect(resolveDisplayGender(-1, 'genderless')).toBe('genderless');
  });

  it('por defecto es macho para especies de género dual sin género guardado', () => {
    expect(resolveDisplayGender(4, null)).toBe('male');
  });

  it('por defecto es macho para especies exclusivamente macho sin género guardado', () => {
    expect(resolveDisplayGender(0, null)).toBe('male');
  });

  it('por defecto es hembra para especies exclusivamente hembra sin género guardado', () => {
    expect(resolveDisplayGender(8, null)).toBe('female');
  });

  it('por defecto es sin género para especies sin género sin género guardado', () => {
    expect(resolveDisplayGender(-1, null)).toBe('genderless');
  });
});
