import type { LearnStrings } from './types';

// Polish page copy for the generated vocabulary pages. Templates deliberately join the language
// name with a dash, parenthesis or arrow rather than a preposition, because Polish would decline
// the name after a preposition ("po hiszpańsku", "w polskim") and our `languageNames` only carry
// the nominative adjective ("hiszpański", "polski"). Same trick Spanish uses with "en {language}".
const strings: LearnStrings = {
  languageNames: {
    en: 'angielski',
    es: 'hiszpański',
    fr: 'francuski',
    de: 'niemiecki',
    it: 'włoski',
    pt: 'portugalski',
    pl: 'polski',
  },
  languageNamesCap: {
    en: 'Angielski',
    es: 'Hiszpański',
    fr: 'Francuski',
    de: 'Niemiecki',
    it: 'Włoski',
    pt: 'Portugalski',
    pl: 'Polski',
  },
  topicNouns: {
    travel: 'podróże',
    food: 'restauracja i jedzenie',
    dating: 'randki',
    work: 'praca i biznes',
    smalltalk: 'rozmowy towarzyskie',
    shopping: 'zakupy',
    health: 'zdrowie i nagłe wypadki',
    slang: 'slang i idiomy',
    home: 'dom i przedmioty codzienne',
    nature: 'przyroda i zwierzęta',
    verbs: 'podstawowe czasowniki',
    adjectives: 'podstawowe przymiotniki',
    'common-300': '300 najczęstszych słów',
    'common-1000': '1000 najczęstszych słów',
  },

  crumbHome: 'Strona główna',
  crumbVocabulary: 'Słownictwo',

  indexTitle: 'Listy słówek według języka i tematu | LinguaSwap',
  indexDescription:
    'Starannie dobrane listy słówek w {topics} tematach i {languages} językach — podróże, jedzenie, praca, zdrowie, slang i najczęstsze słowa — z powtórkami rozłożonymi w czasie, aby zostały w głowie.',
  indexHeading: 'Listy słówek',
  indexLede:
    '{words} starannie dobranych słów w {topics} tematach, każde dopasowane w {languages} językach — z powtórkami rozłożonymi w czasie, aby zostały w głowie.',
  byLanguage: 'Według języka',
  byTopic: 'Według tematu',
  cardTopicsWords: '{topics} tematów · {words} słów',

  hubTitle: 'Ucz się słówek — {language}: {topics} starannie dobranych list | LinguaSwap',
  hubDescription:
    '{words} starannie dobranych słów ({language}) w {topics} tematach, każde z tłumaczeniem i zaplanowane do powtórki przez system Leitnera z powtórkami rozłożonymi w czasie.',
  hubHeading: 'Ucz się słówek — {language}',
  hubLede:
    '{words} starannie dobranych słów ({language}) w {topics} tematach, każde z tłumaczeniem i zaplanowane do powtórki przez system Leitnera z powtórkami rozłożonymi w czasie.',
  hubTopics: 'Słownictwo ({language}) według tematu',
  hubOthers: 'Inne języki',
  cardMeta: '{words} słów · {percent}% niemal identycznych',
  hubCtaHeading: 'Zacznij ćwiczyć — {language}',
  hubCtaBody:
    'Wybierz temat, wybierz kierunek i ćwicz. Plan darmowy obejmuje pięć bibliotek i 500 słów każda.',
  otherLanguageLink: 'Słownictwo — {language}',

  topicTitle: 'Słownictwo — {topic} ({language}): {count} słów | LinguaSwap',
  topicDescription:
    '{shown} słów — {topic} ({language}) wraz z tłumaczeniami, z dobranej biblioteki {count}. Ćwicz je w obu kierunkach z powtórkami rozłożonymi w czasie.',
  topicHeading: 'Słownictwo — {topic} ({language}): {count} słów',
  topicLede:
    '{description} Ta strona pokazuje {shown} z nich wraz z tłumaczeniem na {language}, a następnie pozwala ćwiczyć cały zestaw w obu kierunkach z powtórkami rozłożonymi w czasie.',
  tableHeading: '{source} → {target}: pierwsze {shown} słów',
  colNotes: 'Uwagi',
  moreWords:
    '<strong>{count} słów więcej</strong> w pełnej bibliotece „{deck}”, każde dopasowane w siedmiu językach i zaplanowane dla Ciebie przez powtórki rozłożone w czasie. Dodaj ją do swojego konta i zacznij ćwiczyć {source} → {target} jednym kliknięciem.',
  watchOut: 'Na co uważać — {language}',
  factCognates:
    '<strong>{count} z tych {total} słów</strong> wygląda niemal identycznie w obu językach ({percent}%){examples}. Te masz za darmo; wartość ćwiczenia tkwi w reszcie.',
  factAccents:
    '<strong>Znaki diakrytyczne się liczą.</strong> Odpowiedzi są oceniane z uwzględnieniem znaków diakrytycznych, więc potrzebujesz {chars} — LinguaSwap pokazuje jednodotykową klawiaturę z tymi znakami podczas pisania.',
  factCase:
    '<strong>Wielkość liter się liczy.</strong> Niemieckie rzeczowniki pisze się wielką literą i tak też oceniane są odpowiedzi po niemiecku — <code>haus</code> to nie <code>Haus</code>.',
  factNotes:
    '<strong>{count} słów ma notatkę o użyciu</strong> w pełnej bibliotece, na wypadek gdy bezpośrednie tłumaczenie mogłoby wprowadzić w błąd.',
  topicCtaHeading: 'Ćwicz słownictwo — {topic} ({language})',
  topicCtaBody:
    'Słowa wracają tuż zanim byś je zapomniał, a każdy kierunek językowy jest śledzony osobno.',
  sameTopicElsewhere: 'Ten sam temat w innych językach',
  moreIn: 'Więcej słówek — {language}',
  allLists: 'Wszystkie listy słówek — {language}',
};

export default strings;
