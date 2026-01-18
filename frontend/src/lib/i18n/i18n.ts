import { addMessages, init, locale, register, getLocaleFromNavigator } from 'svelte-i18n';

register('en', () => import('./en.json'));
register('de', () => import('./de.json'));
register('fr', () => import('./fr.json'));
register('it', () => import('./it.json'));
register('pt', () => import('./pt.json'));
register('ru', () => import('./ru.json'));
register('sr', () => import('./sr.json'));

const initialLocale = getLocaleFromNavigator() || 'de';

init({
    fallbackLocale: 'de',
    initialLocale: initialLocale
});

// Explicitly set locale to ensure it's initialized
locale.set(initialLocale);