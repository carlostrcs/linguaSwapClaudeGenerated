import { useEffect, useMemo, useRef, useState } from 'react';
import type { DailyActivity } from '../api/types';
import { useI18n } from '../i18n/I18nProvider';

// Daily accuracy over the last 30 days as a single-series line (one y-axis, 0–100%). Answer
// volume rides a separate slim bar strip beneath — deliberately NOT a second y-axis on the
// same plot. Days are keyed in UTC to match the server.
const DAYS = 30;
const W = 640;
const H = 234;
const PAD_L = 30;
const PAD_R = 14;
const ACC_TOP = 26; // headroom above the 100% line so the endpoint label never clips the top edge
const ACC_H = 120;
const ACC_BOTTOM = ACC_TOP + ACC_H;
const VOL_TOP = 164;
const VOL_H = 44;
const VOL_BOTTOM = VOL_TOP + VOL_H;
const AXIS_Y = 224;

const accY = (acc: number): number => ACC_TOP + (1 - acc / 100) * ACC_H;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

interface DayPoint {
  i: number;
  x: number;
  total: number;
  correct: number;
  acc: number;
  date: string;
}

// Tooltip anchored in screen pixels (not SVG units) so it stays readable when the chart scales down.
interface Tip {
  i: number;
  svgX: number;
  svgY: number;
  left: number;
  top: number;
  below: boolean;
  text: string;
}

export default function AccuracyTrendChart({ activity }: { activity: DailyActivity[] }) {
  const { t, lang } = useI18n();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const model = useMemo(() => {
    const byDate = new Map(activity.map((a) => [a.date, a]));
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dateFmt = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', timeZone: 'UTC' });

    const plotW = W - PAD_L - PAD_R;
    const xAt = (i: number) => PAD_L + (i / (DAYS - 1)) * plotW;

    const days: DayPoint[] = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(end);
      d.setUTCDate(d.getUTCDate() - (DAYS - 1 - i));
      const a = byDate.get(d.toISOString().slice(0, 10));
      const total = a?.total ?? 0;
      return {
        i,
        x: xAt(i),
        total,
        correct: a?.correct ?? 0,
        acc: total > 0 ? Math.round(((a?.correct ?? 0) / total) * 100) : 0,
        date: dateFmt.format(d),
      };
    });

    const maxVol = Math.max(1, ...days.map((d) => d.total));
    const points = days.filter((d) => d.total > 0);
    const barW = Math.min(10, plotW / DAYS - 2);
    const hitW = plotW / (DAYS - 1);

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${accY(p.acc).toFixed(1)}`).join(' ');
    const areaPath = points.length
      ? `M ${points[0].x.toFixed(1)} ${ACC_BOTTOM} ` +
        points.map((p) => `L ${p.x.toFixed(1)} ${accY(p.acc).toFixed(1)}`).join(' ') +
        ` L ${points[points.length - 1].x.toFixed(1)} ${ACC_BOTTOM} Z`
      : '';

    return { days, points, maxVol, barW, hitW, linePath, areaPath, firstLabel: days[0].date, lastLabel: days[DAYS - 1].date };
  }, [activity, lang]);

  // Reset the popup when the data changes or the chart is resized (pixel anchor would go stale).
  useEffect(() => setTip(null), [activity]);
  useEffect(() => {
    const onResize = () => setTip(null);
    // Dismiss on any click/tap outside the chart (anywhere on the page), not just inside the card.
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

  const selectDay = (d: DayPoint) => {
    setTip((prev) => {
      if (prev?.i === d.i) return null; // tapping the same day again dismisses it
      const svgEl = svgRef.current;
      const wrapEl = wrapRef.current;
      if (!svgEl || !wrapEl) return null;
      // Measure the SVG's actual rendered box (it's max-width-capped and left-aligned, so it can
      // be narrower than the wrapper) to map SVG units → screen pixels correctly on any width.
      const s = svgEl.getBoundingClientRect();
      const wr = wrapEl.getBoundingClientRect();
      const scale = s.width / W;
      const offX = s.left - wr.left;
      const offY = s.top - wr.top;
      const svgY = accY(d.acc);
      const below = svgY < 46; // near the top of the plot → place the popup below the point
      return {
        i: d.i,
        svgX: d.x,
        svgY,
        left: clamp(offX + d.x * scale, 46, wr.width - 46),
        top: offY + svgY * scale + (below ? 8 : -8),
        below,
        text: t('stats.trendPoint', { acc: d.acc, count: d.total, date: d.date }),
      };
    });
  };

  if (model.points.length === 0) {
    return <p className="muted small">{t('stats.trendNone')}</p>;
  }

  const last = model.points[model.points.length - 1];

  return (
    <div className="chart-wrap" ref={wrapRef} onClick={() => setTip(null)}>
      {/* Scrolls horizontally on mobile (SVG keeps a legible min-width there); dismiss any open
          popup on scroll since it's pixel-anchored to the pre-scroll position. */}
      <div className="chart-scroll" onScroll={() => setTip(null)}>
      <svg className="trend-chart" ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('stats.trendSub')}>
        {/* accuracy gridlines + y labels (0 / 50 / 100) */}
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line className="trend-grid" x1={PAD_L} y1={accY(g)} x2={W - PAD_R} y2={accY(g)} />
            <text className="trend-axis" x={PAD_L - 6} y={accY(g) + 3} textAnchor="end">
              {g}
            </text>
          </g>
        ))}

        {/* volume strip (answers per day) — its own baseline, not a second y-axis */}
        {model.days.map((d) =>
          d.total > 0 ? (
            <rect
              key={d.i}
              className="trend-vol"
              x={d.x - model.barW / 2}
              y={VOL_BOTTOM - (d.total / model.maxVol) * VOL_H}
              width={model.barW}
              height={(d.total / model.maxVol) * VOL_H}
              rx={1.5}
            />
          ) : null,
        )}
        <text className="trend-axis" x={PAD_L} y={VOL_TOP - 4}>
          {t('stats.trendVolume')}
        </text>

        {/* crosshair for the selected day */}
        {tip && <line className="trend-crosshair" x1={tip.svgX} y1={ACC_TOP} x2={tip.svgX} y2={VOL_BOTTOM} />}

        {/* accuracy area + line + point dots */}
        {model.areaPath && <path className="trend-area" d={model.areaPath} />}
        <path className="trend-line" d={model.linePath} />
        {model.points.map((p) => (
          <circle key={p.i} className={tip?.i === p.i ? 'trend-dot trend-dot--active' : 'trend-dot'} cx={p.x} cy={accY(p.acc)} r={tip?.i === p.i ? 4.5 : 3} />
        ))}

        {/* endpoint value label (single series → label the end, not every point) */}
        <text className="trend-endlabel" x={Math.min(last.x + 6, W - PAD_R)} y={accY(last.acc) - 6} textAnchor={last.x > W - 60 ? 'end' : 'start'}>
          {last.acc}%
        </text>

        {/* x-axis date range */}
        <text className="trend-axis" x={PAD_L} y={AXIS_Y} textAnchor="start">
          {model.firstLabel}
        </text>
        <text className="trend-axis" x={W - PAD_R} y={AXIS_Y} textAnchor="end">
          {model.lastLabel}
        </text>

        {/* full-column tap/hover targets (last, so they sit on top). Native title keeps desktop hover. */}
        {model.points.map((p) => (
          <rect
            key={p.i}
            className="trend-hit"
            x={p.x - model.hitW / 2}
            y={ACC_TOP}
            width={model.hitW}
            height={VOL_BOTTOM - ACC_TOP}
            aria-label={t('stats.trendPoint', { acc: p.acc, count: p.total, date: p.date })}
            onClick={(e) => {
              e.stopPropagation();
              selectDay(p);
            }}
          >
            <title>{t('stats.trendPoint', { acc: p.acc, count: p.total, date: p.date })}</title>
          </rect>
        ))}
      </svg>
      </div>

      {tip && (
        <div className={tip.below ? 'chart-tip below' : 'chart-tip'} style={{ left: tip.left, top: tip.top }} role="status">
          {tip.text}
        </div>
      )}
    </div>
  );
}
