// Seed data for the no-account demo: an example library carrying each concept in several
// languages (en/es/fr/de/it/pt) so a visitor can practise any direction. The demo store copies
// this into localStorage on first visit, after which it behaves like any other (editable)
// library. This data is bundled into the frontend — it never touches the database.
import type { EntryDto } from '../../api/types';

export const EXAMPLE_LIBRARY_NAME = 'Everyday Words';
export const EXAMPLE_LIBRARY_DESCRIPTION =
  'A sampler of common words in English, Spanish, French, German, Italian and Portuguese.';

const CREATED_AT = '2024-01-01T00:00:00.000Z';

type DemoEntrySeed = {
  translations: Record<string, string>;
  notes?: string;
};

const SEED: DemoEntrySeed[] = [
  { translations: { en: 'dog', es: 'perro', fr: 'chien', de: 'Hund', it: 'cane', pt: 'cão' } },
  { translations: { en: 'cat', es: 'gato', fr: 'chat', de: 'Katze', it: 'gatto', pt: 'gato' } },
  { translations: { en: 'house', es: 'casa', fr: 'maison', de: 'Haus', it: 'casa', pt: 'casa' } },
  { translations: { en: 'water', es: 'agua', fr: 'eau', de: 'Wasser', it: 'acqua', pt: 'água' } },
  {
    translations: { en: 'thank you', es: 'gracias', fr: 'merci', de: 'danke', it: 'grazie', pt: 'obrigado, obrigada' },
    notes: 'Portuguese changes with the speaker: obrigado (m) / obrigada (f).',
  },
  {
    translations: { en: 'hello', es: 'hola', fr: 'bonjour', de: 'hallo', it: 'ciao', pt: 'olá' },
    notes: "Italian 'ciao' is informal; 'salve' is more polite.",
  },
  { translations: { en: 'goodbye', es: 'adiós', fr: 'au revoir', de: 'tschüss', it: 'arrivederci', pt: 'adeus' } },
  { translations: { en: 'please', es: 'por favor', fr: "s'il vous plaît", de: 'bitte', it: 'per favore', pt: 'por favor' } },
  { translations: { en: 'yes', es: 'sí', fr: 'oui', de: 'ja', it: 'sì', pt: 'sim' } },
  { translations: { en: 'no', es: 'no', fr: 'non', de: 'nein', it: 'no', pt: 'não' } },
  { translations: { en: 'food', es: 'comida', fr: 'nourriture', de: 'Essen', it: 'cibo', pt: 'comida' } },
  { translations: { en: 'friend', es: 'amigo', fr: 'ami', de: 'Freund', it: 'amico', pt: 'amigo' } },
  { translations: { en: 'book', es: 'libro', fr: 'livre', de: 'Buch', it: 'libro', pt: 'livro' } },
  { translations: { en: 'love', es: 'amor', fr: 'amour', de: 'Liebe', it: 'amore', pt: 'amor' } },
  { translations: { en: 'apple', es: 'manzana', fr: 'pomme', de: 'Apfel', it: 'mela', pt: 'maçã' } },
  { translations: { en: 'good morning', es: 'buenos días', fr: 'bonjour', de: 'guten Morgen', it: 'buongiorno', pt: 'bom dia' } },
];

export const EXAMPLE_ENTRIES: EntryDto[] = SEED.map((seed, i) => ({
  id: i + 1,
  notes: seed.notes ?? null,
  createdAt: CREATED_AT,
  translations: Object.entries(seed.translations).map(([languageCode, text]) => ({ languageCode, text })),
}));
