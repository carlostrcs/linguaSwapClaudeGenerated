import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getOverview } from '../api/stats';
import ActivityHeatmap from '../components/ActivityHeatmap';
import AccuracyTrendChart from '../components/AccuracyTrendChart';
import BoxBar from '../components/BoxBar';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint && <div className="muted small">{hint}</div>}
    </div>
  );
}

export default function StatsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const { data, isLoading, isError } = useQuery({ queryKey: ['stats-overview'], queryFn: getOverview });

  return (
    <div className="page">
      <h1>{t('stats.title')}</h1>
      {isLoading && <p className="muted">{t('common.loading')}</p>}
      {isError && <p className="alert alert-error">{t('stats.loadFailed')}</p>}

      {data && (
        <>
          <div className="stat-grid">
            <StatCard label={t('stats.words')} value={data.words} />
            <StatCard
              label={t('stats.accuracy')}
              value={`${data.accuracy}%`}
              hint={t('stats.answers', { correct: data.correctAttempts, total: data.totalAttempts })}
            />
            <StatCard label={t('stats.mastered')} value={data.mastered} hint={t('stats.reachedBox5')} />
            <StatCard label={t('stats.dueNow')} value={data.dueNow} />
            <StatCard label={t('stats.dayStreak')} value={data.studyStreakDays} />
            <StatCard label={t('stats.libraries')} value={data.libraries} />
          </div>

          {/* Activity heatmap — free for everyone (engagement / streak motivator). */}
          <div className="card">
            <h2>{t('stats.activity')}</h2>
            <p className="muted small">{t('stats.activitySub')}</p>
            <ActivityHeatmap activity={data.activity} />
          </div>

          {isPremium ? (
            <>
              <div className="card">
                <h2>{t('stats.trend')}</h2>
                <p className="muted small">{t('stats.trendSub')}</p>
                <AccuracyTrendChart activity={data.activity} />
              </div>

              <h2>{t('stats.byLibrary')}</h2>
              {data.perLibrary.length === 0 && <p className="muted">{t('stats.noLibraries')}</p>}
              <div className="lib-stats-list">
                {data.perLibrary.map((l) => (
                  <div className="card lib-stat" key={l.libraryId}>
                    <div className="lib-stat-head">
                      <Link to={`/practice/${l.libraryId}`} className="lib-stat-name">
                        {l.name}
                      </Link>
                      <span className="muted small">
                        {t('stats.libSummary', { words: l.words, acc: l.accuracy, mastered: l.mastered, due: l.dueNow })}
                      </span>
                    </div>
                    <BoxBar stats={l} />
                  </div>
                ))}
              </div>
              <p className="muted small">{t('stats.boxesExplain')}</p>
            </>
          ) : (
            <div className="card">
              <h2>
                {t('stats.byLibrary')} <span className="premium-badge">{t('premium.badge')}</span>
              </h2>
              <p className="muted">{t('premium.statsLocked')}</p>
              <Link className="btn btn-primary" to="/account">
                {t('premium.upgrade')}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
