// Thin wrapper around the browser-native Web Speech API (window.speechSynthesis). Pronunciation is
// produced on demand, entirely client-side — no audio is stored or fetched. Voice availability
// depends on the user's browser/OS; when a locale has no installed voice the browser falls back to
// its default (or stays silent). Keeping the SpeechSynthesis surface here isolates the component
// from the API and gives us one place to guard support and cancel in-flight utterances.

import { speechLangFor } from './languages';

/** True when the current browser exposes speech synthesis. */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Pick an installed voice matching the locale, best-effort (voices can load async). */
function voiceFor(locale: string): SpeechSynthesisVoice | undefined {
  const target = locale.toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  // Exact locale first (es-ES), then any voice for the same base language (es-*).
  const base = target.split('-')[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === target) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(`${base}-`) || v.lang.toLowerCase() === base)
  );
}

/**
 * Speak `text` in the given app language code. No-op on empty text or unsupported browsers. Any
 * in-progress or queued utterance is cancelled first so rapid clicks never overlap or pile up.
 */
export function speak(text: string, lang: string): void {
  if (!isSpeechSupported()) return;
  const trimmed = text?.trim();
  if (!trimmed) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(trimmed);
  const locale = speechLangFor(lang);
  utterance.lang = locale;
  const voice = voiceFor(locale);
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}
