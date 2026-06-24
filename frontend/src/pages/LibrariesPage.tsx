import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLibrary, deleteLibrary, listLibraries, updateLibrary } from '../api/libraries';
import { ApiError } from '../api/client';
import { useI18n } from '../i18n/I18nProvider';

export default function LibrariesPage() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const { data: libraries, isLoading, isError } = useQuery({ queryKey: ['libraries'], queryFn: listLibraries });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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

  return (
    <div className="page">
      <h1>{t('libraries.title')}</h1>

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
      </form>

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
