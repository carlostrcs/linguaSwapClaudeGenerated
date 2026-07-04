import type { LibraryStats } from '../api/types';
import { useI18n } from '../i18n/I18nProvider';

// Leitner box distribution as a proportional stacked bar (theme-aware, danger→success), plus a
// legend and a grey "not started" segment for never-practised words. Per-segment counts live in
// tooltips + the legend rather than cramped inline numbers.
export default function BoxBar({ stats }: { stats: LibraryStats }) {
  const { t } = useI18n();
  const boxTotal = stats.boxDistribution.reduce((sum, b) => sum + b.count, 0);
  const total = boxTotal + stats.unseen;

  if (total === 0) return <p className="muted small">{t('stats.notPractised')}</p>;

  return (
    <>
      <div className="box-bar">
        {stats.boxDistribution.map((b) =>
          b.count > 0 ? (
            <div
              key={b.box}
              className={`box-seg box-seg--${b.box}`}
              style={{ flexGrow: b.count }}
              title={t('stats.boxTooltip', { box: b.box, count: b.count })}
            >
              {b.count}
            </div>
          ) : null,
        )}
        {stats.unseen > 0 && (
          <div
            className="box-seg box-seg--unseen"
            style={{ flexGrow: stats.unseen }}
            title={t('stats.unseenTooltip', { count: stats.unseen })}
          >
            {stats.unseen}
          </div>
        )}
      </div>
      <div className="box-legend">
        <span className="box-legend-scale">
          <span className="muted small">{t('stats.struggling')}</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`box-swatch box-seg--${n}`} />
          ))}
          <span className="muted small">{t('stats.mastered')}</span>
        </span>
        {stats.unseen > 0 && (
          <span className="box-legend-unseen">
            <span className="box-swatch box-seg--unseen" />
            <span className="muted small">{t('stats.unseenTooltip', { count: stats.unseen })}</span>
          </span>
        )}
      </div>
    </>
  );
}
