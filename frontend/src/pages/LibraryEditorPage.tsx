import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEntry, deleteEntry, listEntries, updateEntry } from '../api/entries';
import { getLibrary } from '../api/libraries';
import { ApiError } from '../api/client';
import type { EntryDto, TranslationDto } from '../api/types';
import EntryForm from '../components/EntryForm';
import { useAuth } from '../auth/AuthContext';
import { FREE_WORDS_PER_LIBRARY } from '../lib/premium';
import { flagFor } from '../lib/languages';
import { useI18n } from '../i18n/I18nProvider';

export default function LibraryEditorPage() {
  const { id } = useParams();
  const libraryId = Number(id);
  const qc = useQueryClient();
  const { t } = useI18n();
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<EntryDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const library = useQuery({ queryKey: ['library', libraryId], queryFn: () => getLibrary(libraryId), enabled: Number.isFinite(libraryId) });
  const entries = useQuery({ queryKey: ['entries', libraryId], queryFn: () => listEntries(libraryId), enabled: Number.isFinite(libraryId) });

  const wordCount = entries.data?.length ?? 0;
  const atWordLimit = !isPremium && wordCount >= FREE_WORDS_PER_LIBRARY;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['entries', libraryId] });
    qc.invalidateQueries({ queryKey: ['libraries'] });
  };

  const add = useMutation({
    mutationFn: (v: { translations: TranslationDto[]; notes: string | null }) => createEntry(libraryId, v.translations, v.notes),
    onSuccess: () => { setAdding(false); setFormError(null); invalidate(); },
    onError: (e) => setFormError(e instanceof ApiError ? e.message : t('editor.addFailed')),
  });

  const edit = useMutation({
    mutationFn: (v: { entryId: number; translations: TranslationDto[]; notes: string | null }) => updateEntry(v.entryId, v.translations, v.notes),
    onSuccess: () => { setEditing(null); setFormError(null); invalidate(); },
    onError: (e) => setFormError(e instanceof ApiError ? e.message : t('editor.updateFailed')),
  });

  const remove = useMutation({
    mutationFn: (entryId: number) => deleteEntry(entryId),
    onSuccess: invalidate,
  });

  if (!Number.isFinite(libraryId)) return <p className="alert alert-error">{t('editor.invalidLibrary')}</p>;

  return (
    <div className="page">
      <p>
        <Link to="/libraries" className="btn btn-link">
          {t('editor.back')}
        </Link>
      </p>
      <h1>{library.data?.name ?? t('editor.library')}</h1>
      {library.data?.description && <p className="muted">{library.data.description}</p>}

      <div className="card">
        <div className="section-head">
          <h2>
            {t('editor.words')}
            {!isPremium && (
              <span className="muted small">
                {' '}
                {t('premium.wordCount', { count: wordCount, max: FREE_WORDS_PER_LIBRARY })}
              </span>
            )}
          </h2>
          {!adding && !editing && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={atWordLimit}
              onClick={() => { setAdding(true); setFormError(null); }}
            >
              {t('editor.addWord')}
            </button>
          )}
        </div>

        {atWordLimit && !adding && (
          <p className="alert alert-error">
            {t('premium.wordLimitReached', { max: FREE_WORDS_PER_LIBRARY })}{' '}
            <Link to="/account">{t('premium.upgradeLink')}</Link>
          </p>
        )}

        {(library.data?.hiddenEntryCount ?? 0) > 0 && (
          <p className="alert alert-info">
            {t('premium.hiddenWords', { count: library.data!.hiddenEntryCount })}{' '}
            <Link to="/account">{t('premium.restoreCta')}</Link>
          </p>
        )}

        {adding && (
          <EntryForm
            submitLabel={t('editor.addWordSubmit')}
            busy={add.isPending}
            error={formError}
            onSubmit={(translations, notes) => add.mutate({ translations, notes })}
            onCancel={() => { setAdding(false); setFormError(null); }}
          />
        )}

        {entries.isLoading && <p className="muted">{t('editor.loadingWords')}</p>}
        {entries.data && entries.data.length === 0 && !adding && <p className="muted">{t('editor.empty')}</p>}

        <ul className="entry-list">
          {entries.data?.map((entry) => (
            <li className="entry-item" key={entry.id}>
              {editing?.id === entry.id ? (
                <EntryForm
                  initial={entry}
                  submitLabel={t('editor.saveChanges')}
                  busy={edit.isPending}
                  error={formError}
                  onSubmit={(translations, notes) => edit.mutate({ entryId: entry.id, translations, notes })}
                  onCancel={() => { setEditing(null); setFormError(null); }}
                />
              ) : (
                <>
                  <div className="entry-translations">
                    {entry.translations.map((tr) => (
                      <span className="chip" key={tr.languageCode}>
                        {flagFor(tr.languageCode) && `${flagFor(tr.languageCode)} `}
                        <span className="chip-lang">{tr.languageCode}</span> {tr.text}
                      </span>
                    ))}
                  </div>
                  {entry.notes && <span className="entry-notes muted">{entry.notes}</span>}
                  <div className="entry-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => { setEditing(entry); setFormError(null); }}>
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => { if (window.confirm(t('editor.deleteWordConfirm'))) remove.mutate(entry.id); }}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
