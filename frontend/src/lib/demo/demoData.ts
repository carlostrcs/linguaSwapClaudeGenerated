// Seed data for the no-account demo: an example library carrying each concept in several
// languages (en/es/fr/de/it/pt) so a visitor can practise any direction. The demo store copies
// this into localStorage on first visit, after which it behaves like any other (editable)
// library. This data is bundled into the frontend — it never touches the database.
import type { EntryDto } from '../../api/types';

export const EXAMPLE_LIBRARY_NAME = 'Everyday Words';
export const EXAMPLE_LIBRARY_DESCRIPTION =
  'A sampler of common words in English, Spanish, French, German, Italian and Portuguese.';

const CREATED_AT = '2024-01-01T00:00:00.000Z';

export type DemoEntrySeed = {
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

// Curated "featured" libraries for the no-account demo — mirrors the backend's default libraries
// (Data/DbSeeder.cs). In the demo everything is unlocked, so the featured cards can be added
// straight into the local store as a showcase of the real premium feature.
export type DemoFeaturedSeed = {
  name: string;
  description: string;
  entries: DemoEntrySeed[];
};

export const DEMO_FEATURED: DemoFeaturedSeed[] = [
  {
    name: 'Travel Essentials',
    description: 'Key words for getting around when you travel.',
    entries: [
      { translations: { en: 'airport', es: 'aeropuerto', fr: 'aéroport', de: 'Flughafen', it: 'aeroporto', pt: 'aeroporto' } },
      { translations: { en: 'hotel', es: 'hotel', fr: 'hôtel', de: 'Hotel', it: 'hotel', pt: 'hotel' } },
      { translations: { en: 'ticket', es: 'billete', fr: 'billet', de: 'Fahrkarte', it: 'biglietto', pt: 'bilhete' } },
      { translations: { en: 'luggage', es: 'equipaje', fr: 'bagage', de: 'Gepäck', it: 'bagaglio', pt: 'bagagem' } },
      { translations: { en: 'passport', es: 'pasaporte', fr: 'passeport', de: 'Reisepass', it: 'passaporto', pt: 'passaporte' } },
      { translations: { en: 'train', es: 'tren', fr: 'train', de: 'Zug', it: 'treno', pt: 'comboio' } },
      { translations: { en: 'map', es: 'mapa', fr: 'carte', de: 'Karte', it: 'mappa', pt: 'mapa' } },
      { translations: { en: 'help', es: 'ayuda', fr: 'aide', de: 'Hilfe', it: 'aiuto', pt: 'ajuda' } },
    ],
  },
  {
    name: 'Restaurant & Food',
    description: 'Order with confidence — restaurant and food words.',
    entries: [
      { translations: { en: 'water', es: 'agua', fr: 'eau', de: 'Wasser', it: 'acqua', pt: 'água' } },
      { translations: { en: 'menu', es: 'menú', fr: 'menu', de: 'Speisekarte', it: 'menù', pt: 'cardápio' } },
      { translations: { en: 'bill', es: 'cuenta', fr: 'addition', de: 'Rechnung', it: 'conto', pt: 'conta' } },
      { translations: { en: 'bread', es: 'pan', fr: 'pain', de: 'Brot', it: 'pane', pt: 'pão' } },
      { translations: { en: 'wine', es: 'vino', fr: 'vin', de: 'Wein', it: 'vino', pt: 'vinho' } },
      { translations: { en: 'coffee', es: 'café', fr: 'café', de: 'Kaffee', it: 'caffè', pt: 'café' } },
      { translations: { en: 'table', es: 'mesa', fr: 'table', de: 'Tisch', it: 'tavolo', pt: 'mesa' } },
      { translations: { en: 'delicious', es: 'delicioso', fr: 'délicieux', de: 'lecker', it: 'delizioso', pt: 'delicioso' } },
    ],
  },
  {
    name: 'Dating & Flirting',
    description: 'Compliments, romance and going out.',
    entries: [
      { translations: { en: 'love', es: 'amor', fr: 'amour', de: 'Liebe', it: 'amore', pt: 'amor' } },
      { translations: { en: 'kiss', es: 'beso', fr: 'baiser', de: 'Kuss', it: 'bacio', pt: 'beijo' } },
      { translations: { en: 'beautiful', es: 'hermoso', fr: 'beau', de: 'schön', it: 'bello', pt: 'bonito' } },
      { translations: { en: 'smile', es: 'sonrisa', fr: 'sourire', de: 'Lächeln', it: 'sorriso', pt: 'sorriso' } },
      { translations: { en: 'date', es: 'cita', fr: 'rendez-vous', de: 'Verabredung', it: 'appuntamento', pt: 'encontro' } },
      { translations: { en: 'I like you', es: 'me gustas', fr: 'tu me plais', de: 'ich mag dich', it: 'mi piaci', pt: 'gosto de ti' } },
      { translations: { en: 'charming', es: 'encantador', fr: 'charmant', de: 'charmant', it: 'affascinante', pt: 'encantador' } },
      { translations: { en: 'sweetheart', es: 'cariño', fr: 'chéri', de: 'Schatz', it: 'tesoro', pt: 'querido' } },
    ],
  },
  {
    name: 'Small Talk & Greetings',
    description: 'Everyday greetings and polite phrases to sound natural fast.',
    entries: [
      { translations: { en: 'hello', es: 'hola', fr: 'bonjour', de: 'hallo', it: 'ciao', pt: 'olá' } },
      { translations: { en: 'please', es: 'por favor', fr: "s'il vous plaît", de: 'bitte', it: 'per favore', pt: 'por favor' } },
      { translations: { en: 'thank you', es: 'gracias', fr: 'merci', de: 'danke', it: 'grazie', pt: 'obrigado' } },
      { translations: { en: 'good morning', es: 'buenos días', fr: 'bonjour', de: 'guten Morgen', it: 'buongiorno', pt: 'bom dia' } },
      { translations: { en: 'How are you?', es: '¿Cómo estás?', fr: 'Comment ça va ?', de: 'Wie geht es dir?', it: 'Come stai?', pt: 'Como estás?' } },
      { translations: { en: 'see you later', es: 'hasta luego', fr: 'à plus tard', de: 'bis später', it: 'a dopo', pt: 'até logo' } },
      { translations: { en: 'sorry', es: 'lo siento', fr: 'désolé', de: 'es tut mir leid', it: 'mi dispiace', pt: 'desculpe' } },
      { translations: { en: 'good luck', es: 'buena suerte', fr: 'bonne chance', de: 'viel Glück', it: 'buona fortuna', pt: 'boa sorte' } },
    ],
  },
];
