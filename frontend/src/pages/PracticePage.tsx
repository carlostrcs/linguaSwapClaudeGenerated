import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listEntries } from '../api/entries';
import { getLibrary } from '../api/libraries';
import { saveJourneyState, startSession } from '../api/practice';
import { recordWrite } from '../lib/offlineQueue';
import { ApiError } from '../api/client';
import type { Difficulty, PracticeMode, PracticeWord, StartSessionResponse } from '../api/types';
import PracticeSetup from '../components/PracticeSetup';
import PracticeRunner from '../components/PracticeRunner';
import JourneyRunner from '../components/JourneyRunner';
import LearnNewRunner from '../components/LearnNewRunner';
import { isJourneyMode, isLearnNewMode, modeReschedules } from '../lib/practiceModes';
import { checkLocally } from '../lib/practiceCheck';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';

export default function PracticePage() {
  const { id } = useParams();
  const libraryId = Number(id);
  const { t } = useI18n();
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;

  const library = useQuery({ queryKey: ['library', libraryId], queryFn: () => getLibrary(libraryId), enabled: Number.isFinite(libraryId) });
  const entries = useQuery({ queryKey: ['entries', libraryId], queryFn: () => listEntries(libraryId), enabled: Number.isFinite(libraryId) });

  const languages = useMemo(() => {
    const set = new Set<string>();
    entries.data?.forEach((e) => e.translations.forEach((tr) => set.add(tr.languageCode)));
    return [...set].sort();
  }, [entries.data]);

  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [mode, setMode] = useState<PracticeMode>('SmartReview');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState<StartSessionResponse | null>(null);

  // Each word's current Leitner box, so the mastered badge can be worked out locally.
  const boxes = useRef<Record<number, number>>({});

  useEffect(() => {
    if (languages.length >= 1 && !source) setSource(languages[0]);
    if (languages.length >= 2 && !target) setTarget(languages[1]);
  }, [languages, source, target]);

  const begin = async (e: FormEvent) => {
    e.preventDefault();
    setSetupError(null);
    if (!source || !target || source === target) {
      setSetupError(t('practice.pickTwo'));
      return;
    }
    setStarting(true);
    try {
      const started = await startSession(libraryId, source, target, difficulty, mode);
      // Seed here rather than in an effect: it must be ready before the first card renders.
      boxes.current = Object.fromEntries(started.words.map((w) => [w.entryId, w.boxLevel]));
      setSession(started);
    } catch (err) {
      setSetupError(err instanceof ApiError ? err.message : t('practice.startFailed'));
    } finally {
      setStarting(false);
    }
  };

  if (!Number.isFinite(libraryId)) return <p className="alert alert-error">{t('editor.invalidLibrary')}</p>;

  // ---------- Playing / Done ----------
  if (session) {
    const reschedules = modeReschedules(session.mode);

    // Grade locally so the card colours instantly, and record the attempt in the background. The
    // server re-checks and owns the durable Attempt/Leitner row; a dropped write costs one row of
    // stats, which beats making the user wait a round trip for every word.
    //
    // `recordWrite` owns the ordering (and the offline queue), so there is no local promise chain
    // here any more: it serializes every write app-wide, which is what keeps repeats of one word
    // out of a race for the LearningStates unique index — and it parks the write instead of losing
    // it when the network is gone. See lib/offlineQueue.
    const checkAnswer = async (word: PracticeWord, answer: string) => {
      const res = checkLocally(
        word.acceptedAnswer,
        answer,
        session.targetLanguage,
        boxes.current[word.entryId] ?? 0,
        reschedules,
      );
      if (reschedules) boxes.current[word.entryId] = res.nextBox;
      void recordWrite({ kind: 'answer', sessionId: session.sessionId, entryId: word.entryId, answer });
      return res;
    };

    // The API rejects an answer once the session has ended, so this has to land behind the answers
    // — including any parked offline, which is why it goes through the same queue rather than
    // straight to the network. Otherwise ending a session would invalidate its own backlog.
    const finish = () => {
      void recordWrite({ kind: 'end', sessionId: session.sessionId });
    };

    const backSlot = (
      <Link className="btn btn-ghost" to="/libraries">
        {t('practice.backToLibraries')}
      </Link>
    );

    if (isJourneyMode(session.mode)) {
      return (
        <JourneyRunner
          words={session.words}
          difficulty={session.difficulty}
          sourceLanguage={session.sourceLanguage}
          targetLanguage={session.targetLanguage}
          checkAnswer={checkAnswer}
          initialState={session.journey}
          onPersist={(state) =>
            void saveJourneyState(libraryId, session.sourceLanguage, session.targetLanguage, state).catch(
              () => {},
            )}
          onExit={() => {
            finish();
            setSession(null);
          }}
          backSlot={backSlot}
        />
      );
    }

    if (isLearnNewMode(session.mode)) {
      return (
        <LearnNewRunner
          words={session.words}
          difficulty={session.difficulty}
          sourceLanguage={session.sourceLanguage}
          targetLanguage={session.targetLanguage}
          checkAnswer={checkAnswer}
          onExit={() => {
            finish();
            setSession(null);
          }}
          backSlot={backSlot}
        />
      );
    }

    return (
      <PracticeRunner
        words={session.words}
        difficulty={session.difficulty}
        mode={session.mode}
        sourceLanguage={session.sourceLanguage}
        targetLanguage={session.targetLanguage}
        checkAnswer={checkAnswer}
        onComplete={finish}
        onAgain={() => setSession(null)}
        backSlot={backSlot}
      />
    );
  }

  // ---------- Setup ----------
  return (
    <div className="page narrow">
      <p>
        <Link to="/libraries" className="btn btn-link">
          {t('editor.back')}
        </Link>
      </p>
      <h1>
        {t('practice.title')}
        {library.data ? `: ${library.data.name}` : ''}
      </h1>

      {entries.isLoading && <p className="muted">{t('common.loading')}</p>}
      {entries.data && languages.length < 2 ? (
        <p className="muted">{t('practice.needTwoLangs')}</p>
      ) : (
        languages.length >= 2 && (
          <PracticeSetup
            languages={languages}
            source={source}
            target={target}
            difficulty={difficulty}
            mode={mode}
            isPremium={isPremium}
            onSource={setSource}
            onTarget={setTarget}
            onDifficulty={setDifficulty}
            onMode={setMode}
            onStart={begin}
            error={setupError}
            busy={starting}
          />
        )
      )}
    </div>
  );
}
