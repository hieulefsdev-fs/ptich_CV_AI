import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Trophy, BarChart3, FileText } from 'lucide-react';
import type { CVAnalysisListItem } from '../types';

interface Point {
  id: number;
  score: number;
  time: number;
  job: string;
}

const scoreOf = (item: CVAnalysisListItem): number => item.ats_score ?? item.atsScore ?? 0;
const timeOf = (item: CVAnalysisListItem): number => {
  const raw = item.created_at ?? item.createdAt;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
};
const jobOf = (item: CVAnalysisListItem): string => (item.target_job_title ?? item.targetJobTitle ?? '').trim();

const ALL = '__all__';

/** Pure-SVG line chart of ATS score over time (no chart library needed). */
const LineChart: React.FC<{ points: Point[] }> = ({ points }) => {
  const W = 640;
  const H = 220;
  const pad = { l: 36, r: 16, t: 14, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const x = (i: number) => (points.length === 1 ? pad.l + innerW / 2 : pad.l + (i / (points.length - 1)) * innerW);
  const y = (score: number) => pad.t + (1 - Math.min(100, Math.max(0, score)) / 100) * innerH;

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
  const fmt = (t: number) => new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Biểu đồ điểm ATS theo thời gian">
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="4 4" />
          <text x={pad.l - 6} y={y(g) + 4} textAnchor="end" className="fill-slate-400 text-[10px]">{g}</text>
        </g>
      ))}
      {/* 80 = "good" threshold used on the report page */}
      <line x1={pad.l} x2={W - pad.r} y1={y(80)} y2={y(80)} className="stroke-emerald-400/60" strokeDasharray="2 4" />
      <path d={path} fill="none" className="stroke-emerald-500" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={p.id}>
          <circle cx={x(i)} cy={y(p.score)} r={4.5} className="fill-white dark:fill-slate-900 stroke-emerald-500" strokeWidth={2.5} />
          <title>{`${new Date(p.time).toLocaleString('vi-VN')} — ${p.job || 'Không rõ vị trí'}: ${p.score}/100`}</title>
          {(points.length <= 8 || i === 0 || i === points.length - 1) && (
            <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">{fmt(p.time)}</text>
          )}
        </g>
      ))}
    </svg>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; sub?: React.ReactNode }> = ({
  icon, label, value, sub,
}) => (
  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">{icon}{label}</div>
    <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{value}</div>
    {sub && <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>}
  </div>
);

export const ScoreStats: React.FC<{ history: CVAnalysisListItem[] }> = ({ history }) => {
  const [jobFilter, setJobFilter] = useState(ALL);

  const jobs = useMemo(() => Array.from(new Set(history.map(jobOf).filter(Boolean))), [history]);

  // oldest -> newest, optionally limited to one target job
  const points: Point[] = useMemo(
    () =>
      history
        .filter((h) => jobFilter === ALL || jobOf(h) === jobFilter)
        .map((h) => ({ id: h.id, score: scoreOf(h), time: timeOf(h), job: jobOf(h) }))
        .sort((a, b) => a.time - b.time),
    [history, jobFilter],
  );

  if (history.length === 0) return null;

  const total = points.length;
  const avg = total ? Math.round(points.reduce((s, p) => s + p.score, 0) / total) : 0;
  const best = total ? Math.max(...points.map((p) => p.score)) : 0;
  const delta = total >= 2 ? points[total - 1].score - points[0].score : null;

  return (
    <section className="space-y-4 no-print">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-500" />
          Thống kê tiến bộ của bạn
        </h2>
        {jobs.length > 1 && (
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-2.5 py-1.5"
            aria-label="Lọc theo vị trí ứng tuyển"
          >
            <option value={ALL}>Tất cả vị trí</option>
            {jobs.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<FileText className="w-3.5 h-3.5" />} label="Số lần phân tích" value={total} />
        <StatCard icon={<BarChart3 className="w-3.5 h-3.5" />} label="Điểm trung bình" value={<>{avg}<span className="text-xs font-normal text-slate-400">/100</span></>} />
        <StatCard icon={<Trophy className="w-3.5 h-3.5" />} label="Điểm cao nhất" value={<>{best}<span className="text-xs font-normal text-slate-400">/100</span></>} />
        <StatCard
          icon={delta === null || delta === 0 ? <Minus className="w-3.5 h-3.5" /> : delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          label="Thay đổi từ lần đầu"
          value={
            delta === null ? (
              <span className="text-slate-400">—</span>
            ) : (
              <span className={delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-rose-500' : 'text-slate-500'}>
                {delta > 0 ? '+' : ''}{delta}
              </span>
            )
          }
          sub={delta === null ? 'Cần ít nhất 2 lần phân tích' : 'điểm, so với lần phân tích đầu tiên'}
        />
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {total >= 2 ? (
          <LineChart points={points} />
        ) : (
          <p className="text-xs text-slate-400 text-center py-8">
            Biểu đồ sẽ xuất hiện khi bạn có ít nhất 2 lần phân tích{jobFilter !== ALL ? ' cho vị trí này' : ''}.
          </p>
        )}
      </div>
    </section>
  );
};
