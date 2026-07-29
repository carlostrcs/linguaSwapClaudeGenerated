import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { LANGUAGES } from '../i18n/translations';
import type { LanguageId } from '../i18n/translations';
import { localeHomePath } from '../content/site';

interface LanguagePickerProps {
  /**
   * Navigate to that locale's homepage on change (`/` for English, `/es`, `/fr`, …) instead of
   * only switching language in place.
   *
   * Set on the landing page, where each locale has a real indexable URL of its own — otherwise
   * two different URLs would render Spanish (`/` with a stored preference, and `/es`), which is
   * confusing to a user and duplicate content to a search engine. Left off inside the app, where
   * the routes are unprefixed and there is nowhere else to go.
   */
  navigateToLocaleHome?: boolean;
}

/**
 * The UI-language switcher for logged-out chrome (landing header, auth pages, demo topbar).
 *
 * The Account page has its own labelled copy of this control; this one is unlabelled and compact
 * because it sits in a topbar. It exists because language used to be reachable only from
 * `/account` — behind auth — which left a logged-out visitor with no way to change it at all.
 */
export default function LanguagePicker({ navigateToLocaleHome = false }: LanguagePickerProps) {
  const { lang, setLang, t } = useI18n();
  const navigate = useNavigate();

  const onChange = (next: LanguageId) => {
    setLang(next);
    if (navigateToLocaleHome) navigate(localeHomePath(next));
  };

  return (
    <select
      className="pref-select lang-picker"
      value={lang}
      onChange={(e) => onChange(e.target.value as LanguageId)}
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
