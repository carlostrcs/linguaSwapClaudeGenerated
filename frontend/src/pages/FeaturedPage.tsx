import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addFeaturedLibrary, listFeaturedLibraries } from '../api/libraries';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';

/**
 * The "Featured libraries" shelf — curated default sets offered as a premium enticement. Visible to
 * everyone: premium users **Add** a personal copy (then jump into it); free users see the same cards
 * with blurred teaser words + a lock + Upgrade. Masters live on a hidden system account, so a free
 * user can never reach the words — only this preview.
 */
export default function FeaturedPage() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;

  const { data: featured, isLoading, isError } = useQuery({ queryKey: ['featured'], queryFn: listFeaturedLibraries });
  const [featuredErr, setFeaturedErr] = useState<string | null>(null);

  // Add a curated default library — clones it into the account, then jumps to the new copy.
  const addFeatured = useMutation({
    mutationFn: (id: number) => addFeaturedLibrary(id),
    onSuccess: (lib) => {
      setFeaturedErr(null);
      qc.invalidateQueries({ queryKey: ['libraries'] });
      qc.invalidateQueries({ queryKey: ['featured'] });
      navigate(`/libraries/${lib.id}`);
    },
    onError: (e) => setFeaturedErr(e instanceof ApiError ? e.message : t('featured.addFailed')),
  });

  return (
    <div className="page">
      <div className="featured-head">
        <h1>{t('featured.pageTitle')}</h1>
        {!isPremium && <span className="premium-badge">{t('premium.badge')}</span>}
      </div>
      <p className="muted">{t('featured.subtitle')}</p>
      {featuredErr && <p className="alert alert-error">{featuredErr}</p>}

      {isLoading && <p className="muted">{t('common.loading')}</p>}
      {isError && <p className="alert alert-error">{t('libraries.loadFailed')}</p>}
      {featured && featured.length === 0 && <p className="muted">{t('featured.empty')}</p>}

      <div className="library-grid">
        {featured?.map((lib) => (
          <div className="card library-card featured-card" key={lib.id}>
            <div className="library-card-head">
              <span className="library-title">{lib.name}</span>
              <span className="badge">
                {t(lib.wordCount === 1 ? 'libraries.word' : 'libraries.words', { count: lib.wordCount })}
              </span>
            </div>
            {lib.description && <p className="muted">{lib.description}</p>}
            {lib.sampleWords.length > 0 && (
              <ul className={`teaser-words${isPremium ? '' : ' locked'}`} aria-hidden={!isPremium}>
                {lib.sampleWords.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
            <div className="card-actions">
              {isPremium ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => addFeatured.mutate(lib.id)}
                  disabled={addFeatured.isPending}
                >
                  {t('featured.add')}
                </button>
              ) : (
                <>
                  <span className="featured-lock muted small">🔒 {t('featured.locked')}</span>
                  <Link className="btn btn-primary" to="/account">
                    {t('premium.upgrade')}
                  </Link>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
