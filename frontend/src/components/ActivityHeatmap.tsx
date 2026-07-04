import { useEffect, useMemo, useRef, useState } from 'react';
import type { DailyActivity } from '../api/types';
import { useI18n } from '../i18n/I18nProvider';

// A GitHub-style calendar: one column per week, one row per weekday (Sun→Sat), the last ~year.
// Cells are filled by a sequential green ramp (theme-aware CSS vars); empty days recede to the
// surface. Days are keyed in UTC to stay aligned with the server's UTC day bucketing.
const WEEKS = 53;
const CELL = 12;
const STEP = 15; // CELL + 3px surface gap
const TOP = 18; // month-label band
const LEFT = 26; // weekday-label gutter
const WIDTH = LEFT + WEEKS * STEP;
const HEIGHT = TOP + 7 * STEP;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

interface HeatCell {
  key: string;
  x: number;
  y: number;
  lvl: number;
  title: string;
}

// Popup anchored in screen pixels so it stays readable when the SVG scales down on mobile.
interface Tip {
  key: string;
  left: number;
  top: number;
  below: boolean;
  text: string;
}

// Fixed thresholds tuned to per-day answer counts → intensity 1..4 (0 = no activity).
function level(count: number): number {
  if (count <= 0) return 0;
  if (count < 10) return 1;
  if (count < 25) return 2;
  if (count < 50) return 3;
  return 4;
}

const utcKey = (d: Date): string => d.toISOString().slice(0, 10);

export default function ActivityHeatmap({ activity }: { activity: DailyActivity[] }) {
  const { t, lang } = useI18n();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const model = useMemo(() => {
    const totals = new Map(activity.map((a) => [a.date, a.total]));

    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    // Back up to the Sunday that starts the leftmost column.
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - end.getUTCDay() - (WEEKS - 1) * 7);

    const dateFmt = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
    const monthFmt = new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' });
    const weekdayFmt = new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' });

    const cells: HeatCell[] = [];
    const months: { key: string; x: number; label: string }[] = [];
    let lastMonth = -1;

    const cursor = new Date(start);
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        if (cursor.getTime() <= end.getTime()) {
          const key = utcKey(cursor);
          const count = totals.get(key) ?? 0;
          cells.push({
            key,
            x: LEFT + w * STEP,
            y: TOP + d * STEP,
            lvl: level(count),
            title: t('stats.activityCell', { count, date: dateFmt.format(cursor) }),
          });
          if (d === 0 && cursor.getUTCMonth() !== lastMonth) {
            lastMonth = cursor.getUTCMonth();
            months.push({ key: `m${w}`, x: LEFT + w * STEP, label: monthFmt.format(cursor) });
          }
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    const weekdays = [1, 3, 5].map((d) => {
      const ref = new Date(start);
      ref.setUTCDate(ref.getUTCDate() + d);
      return { d, y: TOP + d * STEP + CELL - 2, label: weekdayFmt.format(ref) };
    });

    return { cells, months, weekdays };
  }, [activity, lang, t]);

  // Reset the popup when the data changes or the chart is resized (pixel anchor would go stale).
  useEffect(() => setTip(null), [activity]);
  useEffect(() => {
    const onResize = () => setTip(null);
    // Dismiss on any click/tap outside the heatmap (anywhere on the page), not just inside the card.
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setTip(null);
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerdown', onDown);
    };
  }, []);

  const selectCell = (c: HeatCell) => {
    setTip((prev) => {
      if (prev?.key === c.key) return null; // tapping the same day again dismisses it
      const svgEl = svgRef.current;
      const wrapEl = wrapRef.current;
      if (!svgEl || !wrapEl) return null;
      // Measure the SVG's actual rendered box (max-width-capped, left-aligned) to map units → pixels.
      const s = svgEl.getBoundingClientRect();
      const wr = wrapEl.getBoundingClientRect();
      const scale = s.width / WIDTH;
      const row = Math.round((c.y - TOP) / STEP);
      const below = row < 3; // top rows → drop the popup below the cell so it isn't clipped
      return {
        key: c.key,
        left: clamp(s.left - wr.left + (c.x + CELL / 2) * scale, 60, wr.width - 60),
        top: s.top - wr.top + (below ? c.y + CELL : c.y) * scale + (below ? 6 : -6),
        below,
        text: c.title,
      };
    });
  };

  if (activity.length === 0) {
    return <p className="muted small">{t('stats.activityNone')}</p>;
  }

  return (
    <div className="chart-wrap" ref={wrapRef} onClick={() => setTip(null)}>
      <figure className="heatmap-figure">
        {/* Scrolls horizontally on mobile (SVG keeps a legible min-width there); dismiss any open
            popup on scroll since it's pixel-anchored to the pre-scroll position. */}
        <div className="chart-scroll" onScroll={() => setTip(null)}>
        <svg className="heatmap" ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t('stats.activitySub')}>
          {model.months.map((m) => (
            <text key={m.key} className="heat-axis" x={m.x} y={TOP - 6}>
              {m.label}
            </text>
          ))}
          {model.weekdays.map((wd) => (
            <text key={wd.d} className="heat-axis" x={0} y={wd.y}>
              {wd.label}
            </text>
          ))}
          {model.cells.map((c) => (
            <rect
              key={c.key}
              className={`heat-cell heat-${c.lvl}${tip?.key === c.key ? ' heat-cell--active' : ''}`}
              x={c.x}
              y={c.y}
              width={CELL}
              height={CELL}
              rx={2.5}
              onClick={(e) => {
                e.stopPropagation();
                selectCell(c);
              }}
            >
              <title>{c.title}</title>
            </rect>
          ))}
        </svg>
        </div>
        <figcaption className="heat-legend">
          <span>{t('stats.less')}</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={`heat-swatch heat-${l}`} />
          ))}
          <span>{t('stats.more')}</span>
        </figcaption>
      </figure>
      {tip && (
        <div className={tip.below ? 'chart-tip below' : 'chart-tip'} style={{ left: tip.left, top: tip.top }} role="status">
          {tip.text}
        </div>
      )}
    </div>
  );
}
