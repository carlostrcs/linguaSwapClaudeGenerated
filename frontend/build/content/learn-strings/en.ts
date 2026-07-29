import type { LearnStrings } from './types';

const strings: LearnStrings = {
  languageNames: {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
  },
  languageNamesCap: {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
  },
  topicNouns: {
    travel: 'travel',
    food: 'restaurant and food',
    dating: 'dating',
    work: 'business and work',
    smalltalk: 'small talk',
    shopping: 'shopping',
    health: 'health and emergency',
    slang: 'slang and idiom',
    home: 'household',
    nature: 'nature and animal',
    verbs: 'essential verb',
    adjectives: 'essential adjective',
    'common-300': '300 most common word',
    'common-1000': '1000 most common word',
  },

  crumbHome: 'Home',
  crumbVocabulary: 'Vocabulary',

  indexTitle: 'Vocabulary lists by language and topic | LinguaSwap',
  indexDescription:
    'Curated vocabulary lists across {topics} topics and {languages} languages — travel, food, work, health, slang and the most common words, with spaced repetition to make them stick.',
  indexHeading: 'Vocabulary lists',
  indexLede:
    '{words} curated words across {topics} topics, each aligned across {languages} languages — with spaced repetition to make them stick.',
  byLanguage: 'By language',
  byTopic: 'By topic',
  cardTopicsWords: '{topics} topics · {words} words',

  hubTitle: 'Learn {language} vocabulary — {topics} curated word lists | LinguaSwap',
  hubDescription:
    '{words} curated {language} words across {topics} topics, each paired with its translation and scheduled for review by a Leitner spaced-repetition system.',
  hubHeading: 'Learn {language} vocabulary',
  hubLede:
    '{words} curated {language} words across {topics} topics, each paired with its translation and scheduled for review by a Leitner spaced-repetition system.',
  hubTopics: '{language} vocabulary by topic',
  hubOthers: 'Other languages',
  cardMeta: '{words} words · {percent}% near-cognates',
  hubCtaHeading: 'Start practising {language}',
  hubCtaBody:
    'Pick a topic, choose a direction, and drill. The free plan covers five libraries and 500 words each.',
  otherLanguageLink: '{language} vocabulary',

  topicTitle: '{language} {topic} vocabulary — {count} words | LinguaSwap',
  topicDescription:
    '{shown} {language} {topic} words with their translations, from a curated library of {count}. Practise them in either direction with spaced repetition.',
  topicHeading: '{language} {topic} vocabulary: {count} words',
  topicLede:
    '{description} This page lists {shown} of them with their {language} translations, then lets you practise the full set in either direction with spaced repetition.',
  tableHeading: '{source} to {target}: the first {shown} words',
  colNotes: 'Notes',
  moreWords:
    '<strong>{count} more words</strong> in the full &ldquo;{deck}&rdquo; library, each aligned across six languages and scheduled for you by spaced repetition. Add it to your account and start drilling {source} to {target} in one click.',
  watchOut: 'What to watch out for in {language}',
  factCognates:
    '<strong>{count} of these {total} words</strong> are near-identical in {source} and {target} ({percent}%){examples}. Those are free; the value of drilling is in the rest.',
  factAccents:
    '<strong>Accents count.</strong> Answers are graded accent-sensitively, so you need {chars} — LinguaSwap shows a one-tap keypad for them while you type.',
  factCase:
    '<strong>Capitalisation counts.</strong> German nouns are capitalised, and answers in German are graded that way — <code>haus</code> is not <code>Haus</code>.',
  factNotes:
    '<strong>{count} words carry a usage note</strong> in the full library, for the cases where a direct translation would mislead you.',
  topicCtaHeading: 'Practise {language} {topic} vocabulary',
  topicCtaBody:
    'Words come back just before you would forget them, and every language direction is tracked separately.',
  sameTopicElsewhere: 'The same topic in other languages',
  moreIn: 'More {language} vocabulary',
  allLists: 'All {language} vocabulary lists',
};

export default strings;
