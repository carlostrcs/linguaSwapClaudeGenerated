import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Difficulty, EntryDto, PracticeMode, PracticeWord } from '../api/types';
import PracticeSetup from '../components/PracticeSetup';
import PracticeRunner from '../components/PracticeRunner';
import JourneyRunner from '../components/JourneyRunner';
import LearnNewRunner from '../components/LearnNewRunner';
import RegisterPromptModal from '../components/RegisterPromptModal';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';
import {
  getDemoJourney,
  getDemoLibrary,
  listDemoBoxes,
  listDemoEntries,
  recordAnswer,
  saveDemoJourney,
} from '../lib/demo/demoStore';
import { availableLanguages, buildDemoWords, isCorrect, isMastered, primaryAnswer } from '../lib/demo/demoEngine';
import { isJourneyMode, isLearnNewMode, modeReschedules } from '../lib/practiceModes';
import { isCaseSensitiveLang } from '../lib/languages';

/**
 * The demo's practice page — mirrors PracticePage using the shared PracticeSetup/PracticeRunner,
 * but checks answers locally against the demo store. A logged-out visitor is invited to register
 * when they finish or exit a session.
 */
export default function DemoPracticePage() {
  const { id } = useParams();
  const libraryId = Number(id);
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const library = useMemo(() => getDemoLibrary(libraryId), [libraryId]);
  const entries = useMemo<EntryDto[]>(() => listDemoEntries(libraryId), [libraryId]);
  const languages = useMemo(() => availableLanguages(entries), [entries]);

  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [mode, setMode] = useState<PracticeMode>('SmartReview');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [words, setWords] = useState<PracticeWord[] | null>(null);
  const [modalReason, setModalReason] = useState<'finish' | 'exit' | null>(null);

  useEffect(() => {
    if (languages.length >= 1 && !source) setSource(languages[0]);
    if (languages.length >= 2 && !target) setTarget(languages[1]);
  }, [languages, source, target]);

  const begin = (e: FormEvent) => {
    e.preventDefault();
    setSetupError(null);
    if (!source || !target || source === target) {
      setSetupError(t('practice.pickTwo'));
      return;
    }
    const built = buildDemoWords(entries, source, target, difficulty, mode, listDemoBoxes(libraryId, source, target));
    if (built.length === 0) {
      setSetupError(t('practice.startFailed'));
      return;
    }
    setWords(built);
  };

  // Validate locally (mirrors the API). Rescheduling modes record a box level so progress persists;
  // Cram is practice-only, so it leaves the box untouched and just reflects the current mastery.
  const checkAnswer = async (word: PracticeWord, answer: string) => {
    const entry = entries.find((e) => e.id === word.entryId);
    const expectedFull = entry?.translations.find((tr) => tr.languageCode === target)?.text ?? '';
    const correct = isCorrect(expectedFull, answer, isCaseSensitiveLang(target));
    const mastered = modeReschedules(mode)
      ? recordAnswer(libraryId, word.entryId, source, target, correct).mastered
      : isMastered(listDemoBoxes(libraryId, source, target)[word.entryId] ?? 0);
    return { isCorrect: correct, expectedAnswer: primaryAnswer(expectedFull), mastered };
  };

  const closeModal = () => {
    const reason = modalReason;
    setModalReason(null);
    if (reason === 'exit') navigate('/demo');
  };

  if (!Number.isFinite(libraryId) || !library) {
    return <p className="alert alert-error">{t('editor.invalidLibrary')}</p>;
  }

  // ---------- Playing / Done ----------
  if (words) {
    const backSlot = (
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => (isAuthenticated ? navigate('/demo') : setModalReason('exit'))}
      >
        {t('demo.exit')}
      </button>
    );
    return (
      <>
        {isJourneyMode(mode) ? (
          <JourneyRunner
            words={words}
            difficulty={difficulty}
            sourceLanguage={source}
            targetLanguage={target}
            checkAnswer={checkAnswer}
            initialState={getDemoJourney(libraryId, source, target)}
            onPersist={(state) => saveDemoJourney(libraryId, source, target, state)}
            onExit={() => setWords(null)}
            backSlot={backSlot}
          />
        ) : isLearnNewMode(mode) ? (
          <LearnNewRunner
            words={words}
            difficulty={difficulty}
            sourceLanguage={source}
            targetLanguage={target}
            checkAnswer={checkAnswer}
            onExit={() => setWords(null)}
            backSlot={backSlot}
          />
        ) : (
          <PracticeRunner
            words={words}
            difficulty={difficulty}
            mode={mode}
            sourceLanguage={source}
            targetLanguage={target}
            checkAnswer={checkAnswer}
            onComplete={() => {
              if (!isAuthenticated) setModalReason('finish');
            }}
            onAgain={() => setWords(null)}
            backSlot={backSlot}
          />
        )}
        {modalReason && <RegisterPromptModal onClose={closeModal} />}
      </>
    );
  }

  // ---------- Setup ----------
  return (
    <div className="page narrow">
      <p>
        <Link to="/demo" className="btn btn-link">
          {t('editor.back')}
        </Link>
      </p>
      <h1>
        {t('practice.title')}: {library.name}
      </h1>

      {languages.length < 2 ? (
        <p className="muted">{t('practice.needTwoLangs')}</p>
      ) : (
        <PracticeSetup
          languages={languages}
          source={source}
          target={target}
          difficulty={difficulty}
          mode={mode}
          isPremium
          onSource={setSource}
          onTarget={setTarget}
          onDifficulty={setDifficulty}
          onMode={setMode}
          onStart={begin}
          error={setupError}
        />
      )}
    </div>
  );
}
