import { registerLocale } from 'react-datepicker';
import { enUS, es } from 'date-fns/locale';
import { locale } from './locale';

registerLocale('es', es);
registerLocale('en', enUS);

export const datePickerLocale = locale;
