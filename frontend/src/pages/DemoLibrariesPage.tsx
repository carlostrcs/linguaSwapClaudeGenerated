import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createDemoLibrary, deleteDemoLibrary, listDemoLibraries } from '../lib/demo/demoStore';
import { useI18n } from '../i18n/I18nProvider';

/**
 * The demo's libraries dashboard — mirrors LibrariesPage (create / open / practise / rename /
 * delete) but backed by the client-side demo store and without the premium import features.
 */
export default function DemoLibrariesPage() {
  const { t } = useI18n();
  const [libraries, setLibraries] = useState(() => listDemoLibraries());
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const reload = () => setLibraries(listDemoLibraries());

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError(t('libraries.nameRequired'));
      return;
    }
    createDemoLibrary(name, description || null);
    setName('');
    setDescription('');
    setFormError(null);
    reload();
  };

  const onDelete = (id: number, libName: string) => {
    if (window.confirm(t('libraries.deleteConfirm', { name: libName }))) {
      deleteDemoLibrary(id);
      reload();
    }
  };

  return (
    <div className="page">
      <h1>{t('demo.librariesTitle')}</h1>
      <p className="muted">{t('demo.banner')}</p>

      <form className="card create-form" onSubmit={onCreate}>
        <h2>{t('libraries.new')}</h2>
        {formError && <p className="alert alert-error">{formError}</p>}
        <div className="inline-fields">
          <input placeholder={t('libraries.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
          <input
            placeholder={t('libraries.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            {t('libraries.add')}
          </button>
        </div>
      </form>

      {libraries.length === 0 && <p className="muted">{t('libraries.empty')}</p>}

      <div className="library-grid">
        {libraries.map((lib) => (
          <div className="card library-card" key={lib.id}>
            <div className="library-card-head">
              <Link className="library-title" to={`/demo/libraries/${lib.id}`}>
                {lib.name}
              </Link>
              <span className="badge">
                {t(lib.entryCount === 1 ? 'libraries.word' : 'libraries.words', { count: lib.entryCount })}
              </span>
            </div>
            {lib.description && <p className="muted">{lib.description}</p>}
            <div className="card-actions">
              <Link className="btn btn-secondary" to={`/demo/libraries/${lib.id}`}>
                {t('libraries.edit')}
              </Link>
              <Link className="btn btn-primary" to={`/demo/practice/${lib.id}`}>
                {t('libraries.practise')}
              </Link>
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
