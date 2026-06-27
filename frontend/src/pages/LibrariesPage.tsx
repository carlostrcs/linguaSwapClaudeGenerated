import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLibrary, deleteLibrary, listLibraries, updateLibrary } from '../api/libraries';
import { importEntries } from '../api/entries';
import { ApiError } from '../api/client';
import type { ImportEntry } from '../api/types';
import { parseImportFile } from '../lib/importFile';
import ImportPanel from '../components/ImportPanel';
import { useAuth } from '../auth/AuthContext';
import { FREE_LIBRARY_LIMIT } from '../lib/premium';
import { useI18n } from '../i18n/I18nProvider';

export default function LibrariesPage() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const { data: libraries, isLoading, isError } = useQuery({ queryKey: ['libraries'], queryFn: listLibraries });

  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const libraryCount = libraries?.length ?? 0;
  const atLibraryLimit = !isPremium && libraryCount >= FREE_LIBRARY_LIMIT;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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

  const rename = useMutation({
    mutationFn: (vars: { id: number; name: string }) => updateLibrary(vars.id, vars.name),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteLibrary(id),
    onSuccess: invalidate,
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

  const onRename = (id: number, current: string) => {
    const next = window.prompt(t('libraries.renamePrompt'), current);
    if (next && next.trim()) rename.mutate({ id, name: next.trim() });
  };

  const onDelete = (id: number, libName: string) => {
    if (window.confirm(t('libraries.deleteConfirm', { name: libName }))) remove.mutate(id);
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
                {t('libraries.open')}
              </Link>
              <Link className="btn btn-primary" to={`/practice/${lib.id}`}>
                {t('libraries.practise')}
              </Link>
              {isPremium && (
                <button type="button" className="btn btn-ghost" onClick={() => onImportClick(lib.id, lib.name)} disabled={importMut.isPending}>
                  {t('libraries.import')}
                </button>
              )}
              <button type="button" className="btn btn-ghost" onClick={() => onRename(lib.id, lib.name)}>
                {t('libraries.rename')}
              </button>
              <button type="button" className="btn btn-danger" onClick={() => onDelete(lib.id, lib.name)}>
                {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
