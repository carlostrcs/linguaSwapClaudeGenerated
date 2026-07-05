import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  addDemoFeatured,
  createDemoLibrary,
  deleteDemoLibrary,
  listDemoFeatured,
  listDemoLibraries,
} from '../lib/demo/demoStore';
import ConfirmModal from '../components/ConfirmModal';
import { useI18n } from '../i18n/I18nProvider';

// Feather "trash-2", inlined (mirrors LibrariesPage; no icon lib in this project, keeps it CSP-safe).
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

/**
 * The demo's libraries dashboard — mirrors LibrariesPage (create / open / practise / rename /
 * delete) but backed by the client-side demo store and without the premium import features.
 */
export default function DemoLibrariesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [libraries, setLibraries] = useState(() => listDemoLibraries());
  const [featured, setFeatured] = useState(() => listDemoFeatured());
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);

  const reload = () => {
    setLibraries(listDemoLibraries());
    setFeatured(listDemoFeatured());
  };

  const onAddFeatured = (featuredName: string) => {
    const lib = addDemoFeatured(featuredName);
    reload();
    if (lib) navigate(`/demo/libraries/${lib.id}`);
  };

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

  const onConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteDemoLibrary(pendingDelete.id);
    setPendingDelete(null);
    reload();
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

      {featured.length > 0 && (
        <section className="featured-section">
          <div className="featured-head">
            <h2>{t('featured.title')}</h2>
          </div>
          <p className="muted">{t('featured.subtitle')}</p>
          <div className="library-grid">
            {featured.map((f) => (
              <div className="card library-card featured-card" key={f.name}>
                <div className="library-card-head">
                  <span className="library-title">{f.name}</span>
                  <span className="badge">
                    {t(f.wordCount === 1 ? 'libraries.word' : 'libraries.words', { count: f.wordCount })}
                  </span>
                </div>
                {f.description && <p className="muted">{f.description}</p>}
                {f.sampleWords.length > 0 && (
                  <ul className="teaser-words">
                    {f.sampleWords.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
                <div className="card-actions">
                  <button type="button" className="btn btn-primary" onClick={() => onAddFeatured(f.name)}>
                    {t('featured.add')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pendingDelete && (
        <ConfirmModal
          title={t('libraries.deleteTitle')}
          message={t('libraries.deleteConfirm', { name: pendingDelete.name })}
          onConfirm={onConfirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
