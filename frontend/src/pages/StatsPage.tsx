import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getOverview } from '../api/stats';
import type { LibraryStats } from '../api/types';

// box 1..5 colours (struggling -> mastered)
const BOX_COLORS = ['#fca5a5', '#fcd34d', '#bef264', '#6ee7b7', '#34d399'];

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint && <div className="muted small">{hint}</div>}
    </div>
  );
}

function BoxBar({ stats }: { stats: LibraryStats }) {
  const total = stats.boxDistribution.reduce((sum, b) => sum + b.count, 0);
  if (total === 0) return <p className="muted small">Not practised yet.</p>;
  return (
    <div className="box-bar" title="Leitner box distribution (box 1 → 5)">
      {stats.boxDistribution.map((b, i) =>
        b.count > 0 ? (
          <div key={b.box} className="box-seg" style={{ flexGrow: b.count, background: BOX_COLORS[i] }}>
            {b.count}
          </div>
        ) : null,
      )}
    </div>
  );
}

export default function StatsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['stats-overview'], queryFn: getOverview });

  return (
    <div className="page">
      <h1>Statistics</h1>
      {isLoading && <p className="muted">Loading…</p>}
      {isError && <p className="alert alert-error">Could not load statistics.</p>}

      {data && (
        <>
          <div className="stat-grid">
            <StatCard label="Words" value={data.words} />
            <StatCard label="Accuracy" value={`${data.accuracy}%`} hint={`${data.correctAttempts}/${data.totalAttempts} answers`} />
            <StatCard label="Mastered" value={data.mastered} hint="reached box 5" />
            <StatCard label="Due now" value={data.dueNow} />
            <StatCard label="Day streak" value={data.studyStreakDays} />
            <StatCard label="Libraries" value={data.libraries} />
          </div>

          <h2>By library</h2>
          {data.perLibrary.length === 0 && <p className="muted">No libraries yet.</p>}
          <div className="lib-stats-list">
            {data.perLibrary.map((l) => (
              <div className="card lib-stat" key={l.libraryId}>
                <div className="lib-stat-head">
                  <Link to={`/practice/${l.libraryId}`} className="lib-stat-name">
                    {l.name}
                  </Link>
                  <span className="muted small">
                    {l.words} words · {l.accuracy}% accuracy · {l.mastered} mastered · {l.dueNow} due
                  </span>
                </div>
                <BoxBar stats={l} />
              </div>
            ))}
          </div>
          <p className="muted small">
            Words climb through the boxes (red → green) as you answer correctly; a wrong answer sends a word back to box 1.
          </p>
        </>
      )}
    </div>
  );
}
