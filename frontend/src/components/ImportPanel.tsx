import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importEntries } from '../api/entries';
import { importNewLibrary } from '../api/libraries';
import { ApiError } from '../api/client';
import type { ImportEntry, LibrarySummary } from '../api/types';
import { parseImportFile } from '../lib/importFile';
import { useI18n } from '../i18n/I18nProvider';

const EXAMPLE_FILE = JSON.stringify(
  [
    { translations: { en: 'dog', es: 'perro' }, notes: 'animal' },
    { translations: { en: 'thank you', es: 'gracias' } },
  ],
  null,
  2,
);

interface Props {
  libraries: LibrarySummary[];
}

export default function ImportPanel({ libraries }: Props) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<ImportEntry[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [target, setTarget] = useState('new'); // 'new' or a library id (as string)
  const [newName, setNewName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const reset = () => {
    setEntries(null);
    setFileName('');
    setNewName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = async (file: File | undefined) => {
    setMsg(null);
    setErr(null);
    if (!file) return;
    try {
      const parsed = await parseImportFile(file);
      setEntries(parsed);
      setFileName(file.name);
      setNewName((current) => current || file.name.replace(/\.[^.]+$/, ''));
    } catch {
      setEntries(null);
      setFileName('');
      setErr(t('libraries.importInvalid'));
    }
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (!entries) throw new Error('no-entries');
      return target === 'new'
        ? importNewLibrary(newName.trim(), null, entries)
        : importEntries(Number(target), entries);
    },
    onSuccess: (res) => {
      const name = target === 'new' ? newName.trim() : libraries.find((l) => l.id === Number(target))?.name ?? '';
      setErr(null);
      setMsg(
        res.skipped > 0
          ? t('libraries.importSuccessSkipped', { count: res.imported, skipped: res.skipped, name })
          : t('libraries.importSuccess', { count: res.imported, name }),
      );
      qc.invalidateQueries({ queryKey: ['libraries'] });
      if (target !== 'new') qc.invalidateQueries({ queryKey: ['entries', Number(target)] });
      reset();
    },
    onError: (e) => {
      setMsg(null);
      setErr(e instanceof ApiError ? e.message : t('libraries.importFailed'));
    },
  });

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  };

  const downloadExample = () => {
    const url = URL.createObjectURL(new Blob([EXAMPLE_FILE], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linguaswap-import-example.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const canImport = entries !== null && (target !== 'new' || newName.trim().length > 0) && !mutation.isPending;

  return (
    <div className="card" onClick={() => setOpen((o) => !o)}>
      <button type="button" className="import-header" aria-expanded={open}>
        <h2>{t('import.title')}</h2>
        <span className="chevron" aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
      <div className="import-body" onClick={(e) => e.stopPropagation()}>
      {msg && <p className="alert alert-success">{msg}</p>}
      {err && <p className="alert alert-error">{err}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e: ChangeEvent<HTMLInputElement>) => void handleFile(e.target.files?.[0])}
      />

      <div
        className={`dropzone ${dragOver ? 'dropzone-over' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
      >
        {entries !== null ? t('import.chosen', { file: fileName, count: entries.length }) : t('import.dropzone')}
      </div>

      <div className="pref-row import-targets">
        <label>
          {t('import.target')}
          <select className="pref-select" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="new">{t('import.newLibrary')}</option>
            {libraries.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        {target === 'new' && (
          <label>
            {t('import.name')}
            <input className="pref-select" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </label>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-primary" disabled={!canImport} onClick={() => mutation.mutate()}>
          {mutation.isPending ? t('common.saving') : t('import.run')}
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
      </div>
      )}
    </div>
  );
}
