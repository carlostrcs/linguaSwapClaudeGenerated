import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { EntryDto } from '../api/types';
import EntryForm from '../components/EntryForm';
import RenameLibraryModal from '../components/RenameLibraryModal';
import ConfirmModal from '../components/ConfirmModal';
import { addDemoEntry, deleteDemoEntry, getDemoLibrary, listDemoEntries, renameDemoLibrary, updateDemoEntry } from '../lib/demo/demoStore';
import { filterEntries } from '../lib/searchEntries';
import { useI18n } from '../i18n/I18nProvider';

/**
 * The demo's word editor — mirrors LibraryEditorPage (add / edit / delete words, reusing
 * EntryForm) backed by the client-side demo store, without import or premium word limits.
 */
export default function DemoLibraryEditorPage() {
  const { id } = useParams();
  const libraryId = Number(id);
  const { t } = useI18n();

  const [library, setLibrary] = useState(() => getDemoLibrary(libraryId));
  const [entries, setEntries] = useState<EntryDto[]>(() => listDemoEntries(libraryId));
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<EntryDto | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const visibleEntries = filterEntries(entries, search);
  const noMatches = entries.length > 0 && visibleEntries.length === 0 && search.trim().length > 0;

  const reload = () => setEntries(listDemoEntries(libraryId));

  const onConfirmDelete = () => {
    if (pendingDelete === null) return;
    deleteDemoEntry(libraryId, pendingDelete);
    setPendingDelete(null);
    reload();
  };

  const onRename = (name: string) => {
    renameDemoLibrary(libraryId, name);
    setLibrary(getDemoLibrary(libraryId));
    setRenaming(false);
  };

  if (!Number.isFinite(libraryId) || !library) {
    return <p className="alert alert-error">{t('editor.invalidLibrary')}</p>;
  }

  return (
    <div className="page">
      <p>
        <Link to="/demo" className="btn btn-link">
          {t('editor.back')}
        </Link>
      </p>
      <div className="section-head">
        <h1>{library.name}</h1>
        <button type="button" className="btn btn-ghost" onClick={() => setRenaming(true)}>
          {t('libraries.rename')}
        </button>
      </div>
      {library.description && <p className="muted">{library.description}</p>}

      {renaming && (
        <RenameLibraryModal
          currentName={library.name}
          onSubmit={onRename}
          onClose={() => setRenaming(false)}
        />
      )}

      {pendingDelete !== null && (
        <ConfirmModal
          title={t('editor.deleteWordTitle')}
          message={t('editor.deleteWordConfirm')}
          onConfirm={onConfirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}

      <div className="card">
        <div className="section-head">
          <h2>{t('editor.words')}</h2>
          {!adding && !editing && (
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
              {t('editor.addWord')}
            </button>
          )}
        </div>

        {adding && (
          <EntryForm
            submitLabel={t('editor.addWordSubmit')}
            onSubmit={(translations, notes) => {
              addDemoEntry(libraryId, translations, notes);
              setAdding(false);
              reload();
            }}
            onCancel={() => setAdding(false)}
          />
        )}

        {entries.length > 0 && (
          <div className="entry-search">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('editor.searchPlaceholder')}
              aria-label={t('editor.searchPlaceholder')}
            />
            {search && (
              <button type="button" className="btn btn-ghost" onClick={() => setSearch('')} title={t('editor.searchClear')}>
                ✕
              </button>
            )}
          </div>
        )}

        {entries.length === 0 && !adding && <p className="muted">{t('editor.empty')}</p>}
        {noMatches && <p className="muted">{t('editor.searchNoMatch', { query: search.trim() })}</p>}

        <ul className="entry-list">
          {visibleEntries.map((entry) => (
            <li className="entry-item" key={entry.id}>
              {editing?.id === entry.id ? (
                <EntryForm
                  initial={entry}
                  submitLabel={t('editor.saveChanges')}
                  onSubmit={(translations, notes) => {
                    updateDemoEntry(libraryId, entry.id, translations, notes);
                    setEditing(null);
                    reload();
                  }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <div className="entry-translations">
                    {entry.translations.map((tr) => (
                      <span className="chip" key={tr.languageCode}>
                        <span className="chip-lang">{tr.languageCode}</span> {tr.text}
                      </span>
                    ))}
                  </div>
                  {entry.notes && <span className="entry-notes muted">{entry.notes}</span>}
                  <div className="entry-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(entry)}>
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setPendingDelete(entry.id)}
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
