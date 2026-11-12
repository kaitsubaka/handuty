import carpentry from '../assets/ilCarpinteria.svg';
import locksmith from '../assets/ilCerrajeria.svg';
import electrician from '../assets/ilElectricista.svg';
import fumigation from '../assets/ilFumigacion.svg';
import gardening from '../assets/ilJardineria.svg';
import cleaning from '../assets/ilLimpieza.svg';
import pets from '../assets/ilMascotas.svg';
import maintenance from '../assets/ilMantenimiento.svg';
import painting from '../assets/ilPintura.svg';
import plumbing from '../assets/ilPlomeria.svg';
import security from '../assets/ilSeguridad.svg';

/** `key` is the backend `Category` enum value; `messageId` its name in `src/locales`. */
export const CATEGORIES = [
  { key: 'CARPENTRY', messageId: 'Carpintería', image: carpentry },
  { key: 'LOCKSMITH', messageId: 'Cerrajería', image: locksmith },
  { key: 'ELECTRICIAN', messageId: 'Electricista', image: electrician },
  { key: 'FUMIGATION', messageId: 'Fumigación', image: fumigation },
  { key: 'GARDENING', messageId: 'Jardinería', image: gardening },
  { key: 'CLEANING', messageId: 'Limpieza', image: cleaning },
  { key: 'PETS', messageId: 'Mascotas', image: pets },
  { key: 'MAINTENANCE', messageId: 'Mantenimiento', image: maintenance },
  { key: 'PAINTING', messageId: 'Pintura', image: painting },
  { key: 'PLUMBING', messageId: 'Plomería', image: plumbing },
  { key: 'SECURITY', messageId: 'Seguridad', image: security },
];

const BY_KEY = Object.fromEntries(CATEGORIES.map((category) => [category.key, category]));

export function categoryMessageId(key) {
  return BY_KEY[key]?.messageId ?? key;
}
