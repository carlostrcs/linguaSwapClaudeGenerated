import { useI18n } from '../i18n/I18nProvider';
import { LANGUAGES } from '../i18n/translations';
import type { LanguageId } from '../i18n/translations';

/**
 * The UI-language switcher for logged-out chrome (landing header, auth pages, demo topbar).
 *
 * The Account page has its own labelled copy of this control; this one is unlabelled and compact
 * because it sits in a topbar. It exists because language used to be reachable only from
 * `/account` — behind auth — which left a logged-out visitor with no way to change it at all.
 */
export default function LanguagePicker() {
  const { lang, setLang, t } = useI18n();

  return (
    <select
      className="pref-select lang-picker"
      value={lang}
      onChange={(e) => setLang(e.target.value as LanguageId)}
      aria-label={t('account.language')}
    >
      {LANGUAGES.map((l) => (
        <option key={l.id} value={l.id}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
