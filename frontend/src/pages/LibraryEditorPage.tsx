import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEntry, deleteEntry, listEntries, updateEntry } from '../api/entries';
import { getLibrary } from '../api/libraries';
import { ApiError } from '../api/client';
import type { EntryDto, TranslationDto } from '../api/types';
import EntryForm from '../components/EntryForm';

export default function LibraryEditorPage() {
  const { id } = useParams();
  const libraryId = Number(id);
  const qc = useQueryClient();

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<EntryDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const library = useQuery({ queryKey: ['library', libraryId], queryFn: () => getLibrary(libraryId), enabled: Number.isFinite(libraryId) });
  const entries = useQuery({ queryKey: ['entries', libraryId], queryFn: () => listEntries(libraryId), enabled: Number.isFinite(libraryId) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['entries', libraryId] });
    qc.invalidateQueries({ queryKey: ['libraries'] });
  };

  const add = useMutation({
    mutationFn: (v: { translations: TranslationDto[]; notes: string | null }) => createEntry(libraryId, v.translations, v.notes),
    onSuccess: () => { setAdding(false); setFormError(null); invalidate(); },
    onError: (e) => setFormError(e instanceof ApiError ? e.message : 'Could not add the word.'),
  });

  const edit = useMutation({
    mutationFn: (v: { entryId: number; translations: TranslationDto[]; notes: string | null }) => updateEntry(v.entryId, v.translations, v.notes),
    onSuccess: () => { setEditing(null); setFormError(null); invalidate(); },
    onError: (e) => setFormError(e instanceof ApiError ? e.message : 'Could not update the word.'),
  });

  const remove = useMutation({
    mutationFn: (entryId: number) => deleteEntry(entryId),
    onSuccess: invalidate,
  });

  if (!Number.isFinite(libraryId)) return <p className="alert alert-error">Invalid library.</p>;

  return (
    <div className="page">
      <p>
        <Link to="/libraries" className="btn btn-link">
          ← Back to libraries
        </Link>
      </p>
      <h1>{library.data?.name ?? 'Library'}</h1>
      {library.data?.description && <p className="muted">{library.data.description}</p>}

      <div className="card">
        <div className="section-head">
          <h2>Words</h2>
          {!adding && !editing && (
            <button type="button" className="btn btn-primary" onClick={() => { setAdding(true); setFormError(null); }}>
              + Add word
            </button>
          )}
        </div>

        {adding && (
          <EntryForm
            submitLabel="Add word"
            busy={add.isPending}
            error={formError}
            onSubmit={(translations, notes) => add.mutate({ translations, notes })}
            onCancel={() => { setAdding(false); setFormError(null); }}
          />
        )}

        {entries.isLoading && <p className="muted">Loading words…</p>}
        {entries.data && entries.data.length === 0 && !adding && <p className="muted">No words yet. Add your first one.</p>}

        <ul className="entry-list">
          {entries.data?.map((entry) => (
            <li className="entry-item" key={entry.id}>
              {editing?.id === entry.id ? (
                <EntryForm
                  initial={entry}
                  submitLabel="Save changes"
                  busy={edit.isPending}
                  error={formError}
                  onSubmit={(translations, notes) => edit.mutate({ entryId: entry.id, translations, notes })}
                  onCancel={() => { setEditing(null); setFormError(null); }}
                />
              ) : (
                <>
                  <div className="entry-translations">
                    {entry.translations.map((t) => (
                      <span className="chip" key={t.languageCode}>
                        <span className="chip-lang">{t.languageCode}</span> {t.text}
                      </span>
                    ))}
                  </div>
                  {entry.notes && <span className="entry-notes muted">{entry.notes}</span>}
                  <div className="entry-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => { setEditing(entry); setFormError(null); }}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => { if (window.confirm('Delete this word?')) remove.mutate(entry.id); }}
                    >
                      Delete
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
