// Seed data for the no-account demo: an example library carrying each concept in several
// languages (en/es/fr/de/it/pt) so a visitor can practise any direction. The demo store copies
// this into localStorage on first visit, after which it behaves like any other (editable)
// library. This data is bundled into the frontend — it never touches the database.
import type { EntryDto } from '../../api/types';

/** A demo entry that can carry translated notes (a {lang: text} map), resolved to the UI language at
 *  read time in demoStore — the client-side mirror of the real app's Entry.NotesI18nJson. */
export type DemoEntry = EntryDto & { notesI18n?: Record<string, string> };

export const EXAMPLE_LIBRARY_NAME = 'Everyday Words';
export const EXAMPLE_LIBRARY_DESCRIPTION =
  'A sampler of common words in English, Spanish, French, German, Italian and Portuguese.';
// Translated title/description, mirroring the real featured libraries' nameI18n/descriptionI18n.
export const EXAMPLE_LIBRARY_NAME_I18N: Record<string, string> = {
  es: 'Palabras cotidianas', fr: 'Mots du quotidien', de: 'Alltagswörter',
  it: 'Parole di tutti i giorni', pt: 'Palavras do dia a dia', pl: 'Codzienne słowa',
};
export const EXAMPLE_LIBRARY_DESCRIPTION_I18N: Record<string, string> = {
  es: 'Una muestra de palabras comunes para empezar.',
  fr: 'Un échantillon de mots courants pour commencer.',
  de: 'Eine Auswahl gängiger Wörter für den Anfang.',
  it: 'Un assaggio di parole comuni per iniziare.',
  pt: 'Uma amostra de palavras comuns para começar.',
  pl: 'Próbka popularnych słów na początek.',
};

const CREATED_AT = '2024-01-01T00:00:00.000Z';

export type DemoEntrySeed = {
  translations: Record<string, string>;
  notes?: string;
  notesI18n?: Record<string, string>;
};

const SEED: DemoEntrySeed[] = [
  { translations: { en: 'dog', es: 'perro', fr: 'chien', de: 'Hund', it: 'cane', pt: 'cão' } },
  { translations: { en: 'cat', es: 'gato', fr: 'chat', de: 'Katze', it: 'gatto', pt: 'gato' } },
  { translations: { en: 'house', es: 'casa', fr: 'maison', de: 'Haus', it: 'casa', pt: 'casa' } },
  { translations: { en: 'water', es: 'agua', fr: 'eau', de: 'Wasser', it: 'acqua', pt: 'água' } },
  {
    translations: { en: 'thank you', es: 'gracias', fr: 'merci', de: 'danke', it: 'grazie', pt: 'obrigado, obrigada' },
    notes: 'Portuguese changes with the speaker: obrigado (m) / obrigada (f).',
    notesI18n: {
      es: 'El portugués cambia según quien habla: obrigado (m) / obrigada (f).',
      fr: 'Le portugais change selon le locuteur : obrigado (m) / obrigada (f).',
      de: 'Portugiesisch ändert sich je nach sprechender Person: obrigado (m) / obrigada (f).',
      it: 'Il portoghese cambia a seconda di chi parla: obrigado (m) / obrigada (f).',
      pt: 'O português muda conforme quem fala: obrigado (m) / obrigada (f).',
      pl: 'Portugalski zmienia się zależnie od osoby mówiącej: obrigado (m) / obrigada (f).',
    },
  },
  {
    translations: { en: 'hello', es: 'hola', fr: 'bonjour', de: 'hallo', it: 'ciao', pt: 'olá' },
    notes: "Italian 'ciao' is informal; 'salve' is more polite.",
    notesI18n: {
      es: "En italiano 'ciao' es informal; 'salve' es más educado.",
      fr: "En italien, 'ciao' est informel ; 'salve' est plus poli.",
      de: "Im Italienischen ist 'ciao' informell; 'salve' ist höflicher.",
      it: "In italiano 'ciao' è informale; 'salve' è più formale.",
      pt: "Em italiano 'ciao' é informal; 'salve' é mais educado.",
      pl: "Po włosku 'ciao' jest nieformalne; 'salve' jest bardziej uprzejme.",
    },
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

export const EXAMPLE_ENTRIES: DemoEntry[] = SEED.map((seed, i) => ({
  id: i + 1,
  notes: seed.notes ?? null,
  notesI18n: seed.notesI18n,
  createdAt: CREATED_AT,
  translations: Object.entries(seed.translations).map(([languageCode, text]) => ({ languageCode, text })),
}));

// Curated "featured" libraries for the no-account demo — mirrors the backend's default libraries
// (Data/DbSeeder.cs). In the demo everything is unlocked, so the featured cards can be added
// straight into the local store as a showcase of the real premium feature.
export type DemoFeaturedSeed = {
  name: string;
  description: string;
  nameI18n?: Record<string, string>;
  descriptionI18n?: Record<string, string>;
  entries: DemoEntrySeed[];
};

export const DEMO_FEATURED: DemoFeaturedSeed[] = [
  {
    name: 'Travel Essentials',
    description: 'Key words for getting around when you travel.',
    nameI18n: { es: 'Lo esencial para viajar', fr: "L'essentiel du voyage", de: 'Reise-Grundwortschatz', it: "L'essenziale per viaggiare", pt: 'Essenciais de viagem', pl: 'Podstawy podróży' },
    descriptionI18n: { es: 'Palabras clave para moverte cuando viajas.', fr: 'Des mots clés pour se déplacer en voyage.', de: 'Wichtige Wörter, um dich auf Reisen zurechtzufinden.', it: 'Parole chiave per muoverti quando viaggi.', pt: 'Palavras-chave para te orientares quando viajas.', pl: 'Kluczowe słowa, które pomogą Ci się poruszać w podróży.' },
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
    nameI18n: { es: 'Restaurante y comida', fr: 'Restaurant et cuisine', de: 'Restaurant & Essen', it: 'Ristorante e cibo', pt: 'Restaurante e comida', pl: 'Restauracja i jedzenie' },
    descriptionI18n: { es: 'Pide con confianza: palabras de restaurante y comida.', fr: 'Commandez en toute confiance : le vocabulaire du restaurant et de la nourriture.', de: 'Bestelle mit Sicherheit — Wörter für Restaurant und Essen.', it: 'Ordina con sicurezza: parole di ristorante e cibo.', pt: 'Pede com confiança — palavras de restaurante e comida.', pl: 'Zamawiaj pewnie — słowa dotyczące restauracji i jedzenia.' },
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
    nameI18n: { es: 'Citas y ligar', fr: 'Rencontres et séduction', de: 'Daten & Flirten', it: 'Appuntamenti e flirt', pt: 'Encontros e paquera', pl: 'Randki i flirt' },
    descriptionI18n: { es: 'Cumplidos, romance y salidas.', fr: 'Compliments, romance et sorties.', de: 'Komplimente, Romantik und Ausgehen.', it: 'Complimenti, romanticismo e uscite.', pt: 'Elogios, romance e sair à noite.', pl: 'Komplementy, romantyzm i wyjścia.' },
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
    nameI18n: { es: 'Charla y saludos', fr: 'Conversation et salutations', de: 'Small Talk & Begrüßungen', it: 'Convenevoli e saluti', pt: 'Conversa e saudações', pl: 'Rozmowy towarzyskie i powitania' },
    descriptionI18n: { es: 'Saludos cotidianos y frases de cortesía para sonar natural rápido.', fr: 'Salutations du quotidien et formules de politesse pour paraître naturel rapidement.', de: 'Alltägliche Begrüßungen und höfliche Floskeln, um schnell natürlich zu klingen.', it: 'Saluti di tutti i giorni e frasi di cortesia per sembrare naturale in fretta.', pt: 'Saudações do dia a dia e frases de cortesia para soar natural depressa.', pl: 'Codzienne powitania i uprzejme zwroty, by szybko brzmieć naturalnie.' },
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
