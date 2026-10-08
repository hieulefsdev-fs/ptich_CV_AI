import React from 'react';
import { niceMax } from '../../utils/adminMetrics';
import type { DayBucket } from '../../utils/adminMetrics';

export const Sparkline: React.FC<{ values: number[]; className?: string }> = ({ values, className = 'stroke-indigo-400' }) => {
  const W = 100;
  const H = 28;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? W / 2 : (i / (values.length - 1)) * W;
    const y = H - 2 - (v / max) * (H - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-7" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" className={className} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

interface BarChartProps {
  data: DayBucket[];
  barClass?: string;
  format?: (n: number) => string;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, barClass = 'fill-indigo-500', format = (n) => String(n), height = 220 }) => {
  const W = 720;
  const pad = { l: 44, r: 8, t: 10, b: 24 };
  const innerW = W - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const top = niceMax(Math.max(...data.map((d) => d.value), 0));
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.min(34, slot * 0.62);
  const labelEvery = Math.ceil(data.length / 8);
  const y = (v: number) => pad.t + innerH - (v / top) * innerH;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full h-auto" role="img" aria-label="Biểu đồ cột theo ngày">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={pad.l} x2={W - pad.r} y1={y(top * f)} y2={y(top * f)} className="stroke-slate-800" />
          {Number.isInteger(top * f) && (
            <text x={pad.l - 8} y={y(top * f) + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
              {format(top * f)}
            </text>
          )}
        </g>
      ))}
      {data.map((d, i) => {
        const cx = pad.l + slot * i + slot / 2;
        const h = (d.value / top) * innerH;
        return (
          <g key={d.start}>
            <rect x={cx - barW / 2} y={d.value > 0 ? y(d.value) : pad.t + innerH - 1} width={barW} height={Math.max(d.value > 0 ? h : 1, 1)} rx={2} className={d.value > 0 ? barClass : 'fill-slate-800'} />
            <title>{`${d.label}: ${format(d.value)}`}</title>
            {i % labelEvery === 0 && (
              <text x={cx} y={height - 6} textAnchor="middle" className="fill-slate-500 text-[10px]">
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export interface DonutSegment {
  label: string;
  value: number;
  color: string; // a CSS colour value
}

export const Donut: React.FC<{ segments: DonutSegment[]; size?: number; children?: React.ReactNode }> = ({ segments, size = 132, children }) => {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 50;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={60} cy={60} r={r} fill="none" stroke="rgb(30 41 59)" strokeWidth={14} />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle key={s.label} cx={60} cy={60} r={r} fill="none" stroke={s.color} strokeWidth={14} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
};

/** One labelled horizontal bar: `value` as a share of `max`. */
export const HBar: React.FC<{ label: React.ReactNode; value: number; max: number; right?: React.ReactNode; barClass?: string }> = ({
  label,
  value,
  max,
  right,
  barClass = 'bg-indigo-500',
}) => (
  <div className="space-y-1">
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="truncate text-slate-300">{label}</span>
      <span className="shrink-0 tabular-nums text-slate-400">{right ?? value}</span>
    </div>
    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
      <div className={`h-full rounded-full ${barClass}`} style={{ width: `${max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0}%` }} />
    </div>
  </div>
);
