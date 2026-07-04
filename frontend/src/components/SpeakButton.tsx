import { isSpeechSupported, speak } from '../lib/speech';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  /** The text to pronounce. */
  text: string;
  /** App language code of the text (e.g. 'es', 'en'). */
  lang: string;
}

// Feather "volume-2" speaker, inlined (no icon lib in this project; keeps it CSP-safe).
// stroke="currentColor" lets it inherit the button colour across every theme.
const SpeakerIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

/**
 * A small speaker button that pronounces `text` via the Web Speech API. Renders nothing when the
 * browser has no speech support, so callers never show a dead control. Designed to sit next to a
 * word without stealing focus from the practice answer input (tabIndex -1 + mouseDown preventDefault),
 * mirroring the diacritic keypad's focus discipline.
 */
export default function SpeakButton({ text, lang }: Props) {
  const { t } = useI18n();
  if (!isSpeechSupported()) return null;

  const label = t('practice.playAudio');
  return (
    <button
      type="button"
      className="speak-btn"
      tabIndex={-1}
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => speak(text, lang)}
    >
      {SpeakerIcon}
    </button>
  );
}
