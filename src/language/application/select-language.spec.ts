import { selectLanguage } from './select-language';

describe('selectLanguage', () => {
  it('notifica el nuevo código de idioma elegido', () => {
    const onLanguageSelected = jasmine.createSpy('onLanguageSelected');

    selectLanguage('fr', onLanguageSelected);

    expect(onLanguageSelected).toHaveBeenCalledWith('fr');
  });
});
