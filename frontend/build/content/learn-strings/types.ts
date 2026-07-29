/**
 * Page copy for the generated vocabulary pages, one set per locale.
 *
 * Templates use `{placeholder}` and go through the same `interpolate` the app uses, so a
 * generated page and the app substitute values identically.
 *
 * Deliberately NOT in `src/i18n/dictionaries` even though the shape is similar: that dictionary
 * ships in the 405 kB client bundle and this copy is never used at runtime. The failure semantics
 * differ too — a missing UI key falls back to English silently, which is right for a UI, while a
 * missing key here must fail the build, because an English sentence stranded in a French page is a
 * visible defect and exactly the "templated filler" signal these pages must avoid.
 */
export interface LearnStrings {
  /** Each language's name as written in this locale's prose, lower-case for mid-sentence use. */
  languageNames: Record<string, string>;
  /** Capitalised form, for headings and link text. */
  languageNamesCap: Record<string, string>;
  /** Short noun phrase per deck slug, e.g. "travel" / "viajes". */
  topicNouns: Record<string, string>;

  crumbHome: string;
  crumbVocabulary: string;

  indexTitle: string;
  indexDescription: string;
  indexHeading: string;
  /** {words} {topics} {languages} */
  indexLede: string;
  byLanguage: string;
  byTopic: string;
  /** {topics} {words} */
  cardTopicsWords: string;

  /** {language} {topics} */
  hubTitle: string;
  /** {words} {language} {topics} */
  hubDescription: string;
  /** {language} */
  hubHeading: string;
  /** {words} {language} {topics} */
  hubLede: string;
  /** {language} */
  hubTopics: string;
  hubOthers: string;
  /** {words} {percent} */
  cardMeta: string;
  /** {language} */
  hubCtaHeading: string;
  hubCtaBody: string;
  /** {language} */
  otherLanguageLink: string;

  /** {language} {topic} {count} */
  topicTitle: string;
  /** {shown} {language} {topic} {count} */
  topicDescription: string;
  /** {language} {topic} {count} */
  topicHeading: string;
  /** {description} {shown} {language} */
  topicLede: string;
  /** {source} {target} {shown} */
  tableHeading: string;
  colNotes: string;
  /** {count} {deck} {source} {target} */
  moreWords: string;
  /** {language} */
  watchOut: string;
  /** {count} {total} {percent} {source} {target} {examples} */
  factCognates: string;
  /** {chars} */
  factAccents: string;
  factCase: string;
  /** {count} */
  factNotes: string;
  /** {language} {topic} */
  topicCtaHeading: string;
  topicCtaBody: string;
  sameTopicElsewhere: string;
  /** {language} */
  moreIn: string;
  /** {language} */
  allLists: string;
}
