import { isSpeechSupported, speak } from '../lib/speech';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  /** The text to pronounce. */
  text: string;
  /** App language code of the text (e.g. 'es', 'en'). */
  lang: string;
  /**
   * Visible caption next to the speaker. Omit for the bare icon that sits beside a word; pass a
   * label when the control stands on its own and needs to say what it will pronounce.
   */
  label?: string;
  /**
   * Put the button in the tab order. Off by default: the helper controls beside a practice word
   * stay out of it so Tab still walks input → submit. Turn it on for a standalone control that
   * would otherwise be unreachable without a mouse.
   */
  focusable?: boolean;
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
 * browser has no speech support, so callers never show a dead control. Two shapes: the bare icon that
 * sits next to a word, and a labelled pill for a standalone control (`label`). Clicking never steals
 * focus from the practice answer input (mouseDown preventDefault), and the bare icon also stays out
 * of the tab order, mirroring the diacritic keypad's focus discipline.
 */
export default function SpeakButton({ text, lang, label, focusable = false }: Props) {
  const { t } = useI18n();
  if (!isSpeechSupported()) return null;

  const accessibleLabel = label ?? t('practice.playAudio');
  return (
    <button
      type="button"
      className={`speak-btn${label ? ' speak-btn-labelled' : ''}`}
      tabIndex={focusable ? undefined : -1}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => speak(text, lang)}
    >
      {SpeakerIcon}
      {label && <span className="speak-btn-label">{label}</span>}
    </button>
  );
}
