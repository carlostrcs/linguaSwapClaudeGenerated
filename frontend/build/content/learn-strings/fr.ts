import type { LearnStrings } from './types';

const strings: LearnStrings = {
  languageNames: {
    en: 'anglais',
    es: 'espagnol',
    fr: 'français',
    de: 'allemand',
    it: 'italien',
    pt: 'portugais',
    pl: 'polonais',
  },
  languageNamesCap: {
    en: 'Anglais',
    es: 'Espagnol',
    fr: 'Français',
    de: 'Allemand',
    it: 'Italien',
    pt: 'Portugais',
    pl: 'Polonais',
  },
  topicNouns: {
    travel: 'du voyage',
    food: 'du restaurant et de la cuisine',
    dating: 'des rencontres',
    work: 'du travail et des affaires',
    smalltalk: 'de la conversation courante',
    shopping: 'des achats',
    health: 'de la santé et des urgences',
    slang: "de l'argot et des expressions",
    home: 'de la maison',
    nature: 'de la nature et des animaux',
    verbs: 'des verbes essentiels',
    adjectives: 'des adjectifs essentiels',
    'common-300': 'des 300 mots les plus courants',
    'common-1000': 'des 1000 mots les plus courants',
  },

  crumbHome: 'Accueil',
  crumbVocabulary: 'Vocabulaire',

  indexTitle: 'Listes de vocabulaire par langue et par thème | LinguaSwap',
  indexDescription:
    'Listes de vocabulaire soignées sur {topics} thèmes et {languages} langues : voyage, cuisine, travail, santé, argot et les mots les plus courants, avec la répétition espacée pour les retenir.',
  indexHeading: 'Listes de vocabulaire',
  indexLede:
    '{words} mots sélectionnés sur {topics} thèmes, chacun aligné dans {languages} langues — avec la répétition espacée pour les faire tenir.',
  byLanguage: 'Par langue',
  byTopic: 'Par thème',
  cardTopicsWords: '{topics} thèmes · {words} mots',

  hubTitle: 'Apprendre le vocabulaire {language} — {topics} listes soignées | LinguaSwap',
  hubDescription:
    '{words} mots {language} sur {topics} thèmes, chacun avec sa traduction et programmé pour révision par un système Leitner de répétition espacée.',
  hubHeading: 'Apprendre le vocabulaire {language}',
  hubLede:
    '{words} mots {language} sur {topics} thèmes, chacun avec sa traduction et programmé pour révision par un système Leitner de répétition espacée.',
  hubTopics: 'Vocabulaire {language} par thème',
  hubOthers: 'Autres langues',
  cardMeta: '{words} mots · {percent} % quasi identiques',
  hubCtaHeading: 'Commencer à travailler le {language}',
  hubCtaBody:
    'Choisissez un thème, choisissez un sens, et entraînez-vous. Le forfait gratuit couvre cinq bibliothèques et 500 mots chacune.',
  otherLanguageLink: 'Vocabulaire {language}',

  topicTitle: 'Vocabulaire {topic} en {language} — {count} mots | LinguaSwap',
  topicDescription:
    '{shown} mots {topic} en {language} avec leur traduction, tirés d’une bibliothèque soignée de {count}. Travaillez-les dans les deux sens avec la répétition espacée.',
  topicHeading: 'Vocabulaire {topic} en {language} : {count} mots',
  topicLede:
    '{description} Cette page en liste {shown} avec leur traduction en {language}, puis vous laisse travailler l’ensemble complet dans les deux sens avec la répétition espacée.',
  tableHeading: 'De {source} vers {target} : les {shown} premiers mots',
  colNotes: 'Notes',
  moreWords:
    '<strong>{count} mots de plus</strong> dans la bibliothèque complète &laquo;&nbsp;{deck}&nbsp;&raquo;, chacun aligné dans sept langues et programmé pour vous par la répétition espacée. Ajoutez-la à votre compte et commencez à travailler de {source} vers {target} en un clic.',
  watchOut: 'À quoi faire attention en {language}',
  factCognates:
    '<strong>{count} de ces {total} mots</strong> sont quasi identiques en {source} et en {target} ({percent} %){examples}. Ceux-là sont offerts ; l’intérêt de s’entraîner est dans le reste.',
  factAccents:
    '<strong>Les accents comptent.</strong> Les réponses sont évaluées avec les accents, il vous faut donc {chars} — LinguaSwap affiche un clavier d’un geste pour eux pendant que vous tapez.',
  factCase:
    '<strong>La majuscule compte.</strong> Les noms allemands prennent une majuscule, et les réponses en allemand sont évaluées ainsi : <code>haus</code> n’est pas <code>Haus</code>.',
  factNotes:
    '<strong>{count} mots portent une note d’usage</strong> dans la bibliothèque complète, pour les cas où une traduction directe vous induirait en erreur.',
  topicCtaHeading: 'Travailler le vocabulaire {topic} en {language}',
  topicCtaBody:
    'Les mots reviennent juste avant que vous ne les oubliiez, et chaque sens de traduction est suivi séparément.',
  sameTopicElsewhere: 'Le même thème dans d’autres langues',
  moreIn: 'Plus de vocabulaire {language}',
  allLists: 'Toutes les listes de vocabulaire {language}',
};

export default strings;
