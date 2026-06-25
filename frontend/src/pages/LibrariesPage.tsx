import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLibrary, deleteLibrary, listLibraries, updateLibrary } from '../api/libraries';
import { importEntries } from '../api/entries';
import { ApiError } from '../api/client';
import type { ImportEntry } from '../api/types';
import { useI18n } from '../i18n/I18nProvider';

const EXAMPLE_FILE = JSON.stringify(
  [
    { translations: { en: 'dog', es: 'perro' }, notes: 'animal' },
    { translations: { en: 'thank you', es: 'gracias' } },
  ],
  null,
  2,
);

export default function LibrariesPage() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const { data: libraries, isLoading, isError } = useQuery({ queryKey: ['libraries'], queryFn: listLibraries });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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
      setImportMsg(t('libraries.importSuccess', { count: res.imported, name: importTarget.current?.name ?? '' }));
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

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setImportMsg(null);
      setImportErr(t('libraries.importInvalid'));
      return;
    }
    const entries = Array.isArray(parsed) ? parsed : (parsed as { entries?: unknown }).entries;
    if (!Array.isArray(entries)) {
      setImportMsg(null);
      setImportErr(t('libraries.importInvalid'));
      return;
    }
    importMut.mutate({ libraryId: target.id, entries: entries as ImportEntry[] });
  };

  const downloadExample = () => {
    const url = URL.createObjectURL(new Blob([EXAMPLE_FILE], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linguaswap-import-example.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <h1>{t('libraries.title')}</h1>

      <input ref={fileInputRef} type="file" accept=".json,application/json" hidden onChange={onFileChosen} />

      <form className="card create-form" onSubmit={onCreate}>
        <h2>{t('libraries.new')}</h2>
        {formError && <p className="alert alert-error">{formError}</p>}
        <div className="inline-fields">
          <input placeholder={t('libraries.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder={t('libraries.descriptionPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>
            {t('libraries.add')}
          </button>
        </div>
        <details className="import-help">
          <summary>{t('libraries.importFormat')}</summary>
          <p className="muted small">{t('libraries.importHelp')}</p>
          <pre>{EXAMPLE_FILE}</pre>
          <button type="button" className="btn btn-link" onClick={downloadExample}>
            {t('libraries.downloadExample')}
          </button>
        </details>
      </form>

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
              <button type="button" className="btn btn-ghost" onClick={() => onImportClick(lib.id, lib.name)} disabled={importMut.isPending}>
                {t('libraries.import')}
              </button>
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
