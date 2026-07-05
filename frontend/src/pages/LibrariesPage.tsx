import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLibrary, deleteLibrary, listLibraries } from '../api/libraries';
import { getAccount } from '../api/account';
import { importEntries } from '../api/entries';
import { ApiError } from '../api/client';
import type { ImportEntry } from '../api/types';
import { parseImportFile } from '../lib/importFile';
import ImportPanel from '../components/ImportPanel';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../auth/AuthContext';
import { FREE_LIBRARY_LIMIT } from '../lib/premium';
import { useI18n } from '../i18n/I18nProvider';

// Feather "trash-2", inlined (no icon lib in this project; keeps it CSP-safe).
// stroke="currentColor" lets it inherit the button colour across every theme.
function TrashIcon() {
  return (
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export default function LibrariesPage() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const { data: libraries, isLoading, isError } = useQuery({ queryKey: ['libraries'], queryFn: listLibraries });

  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const libraryCount = libraries?.length ?? 0;
  const atLibraryLimit = !isPremium && libraryCount >= FREE_LIBRARY_LIMIT;

  // How many libraries are hidden by the free-tier cap (from the shared account query).
  const account = useQuery({ queryKey: ['account'], queryFn: getAccount });
  const hiddenLibraries = account.data?.hiddenLibraries ?? 0;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);

  // Per-card quick import (the central ImportPanel handles new-library + target selection).
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importTarget = useRef<{ id: number; name: string } | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['libraries'] });

  const create = useMutation({
    mutationFn: () => createLibrary(name.trim(), description.trim() || null),
    onSuccess: () => {
      setName('');
      setDescription('');
      setFormError(null);
      invalidate();
    },
    onError: (e) => setFormError(e instanceof ApiError ? e.message : t('libraries.createFailed')),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteLibrary(id),
    onSuccess: () => {
      setPendingDelete(null);
      invalidate();
      // Deleting a copy of a featured library frees its master to reappear on the Featured shelf.
      qc.invalidateQueries({ queryKey: ['featured'] });
    },
  });

  const importMut = useMutation({
    mutationFn: (vars: { libraryId: number; entries: ImportEntry[] }) => importEntries(vars.libraryId, vars.entries),
    onSuccess: (res, vars) => {
      setImportErr(null);
      const name = importTarget.current?.name ?? '';
      setImportMsg(
        res.skipped > 0
          ? t('libraries.importSuccessSkipped', { count: res.imported, skipped: res.skipped, name })
          : t('libraries.importSuccess', { count: res.imported, name }),
      );
      qc.invalidateQueries({ queryKey: ['libraries'] });
      qc.invalidateQueries({ queryKey: ['entries', vars.libraryId] });
    },
    onError: (e) => {
      setImportMsg(null);
      setImportErr(e instanceof ApiError ? e.message : t('libraries.importFailed'));
    },
  });

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError(t('libraries.nameRequired'));
      return;
    }
    if (atLibraryLimit) {
      setFormError(t('premium.libraryLimitReached', { max: FREE_LIBRARY_LIMIT }));
      return;
    }
    create.mutate();
  };

  const onImportClick = (id: number, libName: string) => {
    importTarget.current = { id, name: libName };
    setImportMsg(null);
    setImportErr(null);
    fileInputRef.current?.click();
  };

  const onFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file later
    const target = importTarget.current;
    if (!file || !target) return;
    try {
      const entries = await parseImportFile(file);
      importMut.mutate({ libraryId: target.id, entries });
    } catch {
      setImportMsg(null);
      setImportErr(t('libraries.importInvalid'));
    }
  };

  return (
    <div className="page">
      <h1>{t('libraries.title')}</h1>

      <input ref={fileInputRef} type="file" accept=".json,application/json" hidden onChange={onFileChosen} />

      <form className="card create-form" onSubmit={onCreate}>
        <h2>{t('libraries.new')}</h2>
        {!isPremium && (
          <p className="muted small">{t('premium.libraryCount', { count: libraryCount, max: FREE_LIBRARY_LIMIT })}</p>
        )}
        {formError && <p className="alert alert-error">{formError}</p>}
        {atLibraryLimit && (
          <p className="alert alert-error">
            {t('premium.libraryLimitReached', { max: FREE_LIBRARY_LIMIT })}{' '}
            <Link to="/account">{t('premium.upgradeLink')}</Link>
          </p>
        )}
        <div className="inline-fields">
          <input placeholder={t('libraries.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} disabled={atLibraryLimit} />
          <input placeholder={t('libraries.descriptionPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} disabled={atLibraryLimit} />
          <button type="submit" className="btn btn-primary" disabled={create.isPending || atLibraryLimit}>
            {t('libraries.add')}
          </button>
        </div>
      </form>

      {isPremium ? (
        <ImportPanel libraries={libraries ?? []} />
      ) : (
        <div className="card">
          <h2>
            {t('import.title')} <span className="premium-badge">{t('premium.badge')}</span>
          </h2>
          <p className="muted">{t('premium.importLocked')}</p>
          <Link className="btn btn-primary" to="/account">
            {t('premium.upgrade')}
          </Link>
        </div>
      )}

      {importMsg && <p className="alert alert-success">{importMsg}</p>}
      {importErr && <p className="alert alert-error">{importErr}</p>}

      {isLoading && <p className="muted">{t('common.loading')}</p>}
      {isError && <p className="alert alert-error">{t('libraries.loadFailed')}</p>}
      {libraries && libraries.length === 0 && <p className="muted">{t('libraries.empty')}</p>}

      {hiddenLibraries > 0 && (
        <p className="alert alert-info">
          {t('premium.hiddenLibraries', { count: hiddenLibraries })}{' '}
          <Link to="/account">{t('premium.restoreCta')}</Link>
        </p>
      )}

      <div className="library-grid">
        {libraries?.map((lib) => (
          <div className="card library-card" key={lib.id}>
            <div className="library-card-head">
              <Link className="library-title" to={`/libraries/${lib.id}`}>
                {lib.name}
              </Link>
              <span className="badge">
                {t(lib.entryCount === 1 ? 'libraries.word' : 'libraries.words', { count: lib.entryCount })}
              </span>
            </div>
            {lib.description && <p className="muted">{lib.description}</p>}
            <div className="card-actions">
              <Link className="btn btn-secondary" to={`/libraries/${lib.id}`}>
                {t('libraries.edit')}
              </Link>
              <Link className="btn btn-primary" to={`/practice/${lib.id}`}>
                {t('libraries.practise')}
              </Link>
              {isPremium && (
                <button type="button" className="btn btn-ghost" onClick={() => onImportClick(lib.id, lib.name)} disabled={importMut.isPending}>
                  {t('libraries.import')}
                </button>
              )}
              <button
                type="button"
                className="library-delete"
                aria-label={t('libraries.deleteAria', { name: lib.name })}
                title={t('common.delete')}
                onClick={() => setPendingDelete({ id: lib.id, name: lib.name })}
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>

      {pendingDelete && (
        <ConfirmModal
          title={t('libraries.deleteTitle')}
          message={t('libraries.deleteConfirm', { name: pendingDelete.name })}
          busy={remove.isPending}
          onConfirm={() => remove.mutate(pendingDelete.id)}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
