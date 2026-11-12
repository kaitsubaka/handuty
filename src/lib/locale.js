import { register } from 'timeago.js';
import timeagoEs from 'timeago.js/lib/lang/es';
import es from '../locales/es.json';
import en from '../locales/en.json';

const browserLanguage = navigator.language || 'es';

export const locale = browserLanguage.startsWith('en') ? 'en' : 'es';

export const messages = locale === 'en' ? en : es;

register('es', timeagoEs);
