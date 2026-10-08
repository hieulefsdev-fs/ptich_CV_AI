import React from 'react';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { toCsv } from '../../utils/adminMetrics';
import type { CsvColumn } from '../../utils/adminMetrics';

export const Panel: React.FC<{ title?: React.ReactNode; action?: React.ReactNode; className?: string; children: React.ReactNode }> = ({
  title,
  action,
  className = '',
  children,
}) => (
  <section className={`rounded-xl border border-slate-800 bg-slate-900/60 ${className}`}>
    {(title || action) && (
      <header className="flex items-center justify-between gap-3 px-5 pt-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</h2>
        {action}
      </header>
    )}
    <div className="p-5 pt-4">{children}</div>
  </section>
);

export const Chip: React.FC<{ active: boolean; onClick: () => void; count?: number; children: React.ReactNode }> = ({ active, onClick, count, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
      active ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300' : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
    }`}
  >
    {children}
    {count !== undefined && <span className={`ml-1.5 tabular-nums ${active ? 'text-indigo-300/80' : 'text-slate-500'}`}>{count}</span>}
  </button>
);

export const SearchBox: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
  <div className="relative w-full sm:w-72">
    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
    />
  </div>
);

export const Pager: React.FC<{ page: number; pageCount: number; total: number; size: number; onPage: (p: number) => void }> = ({
  page,
  pageCount,
  total,
  size,
  onPage,
}) => {
  const from = total === 0 ? 0 : (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
      <span className="tabular-nums">
        {from}–{to} / {total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="p-1.5 rounded-md border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Trang trước">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2 tabular-nums text-slate-400">
          {page} / {pageCount}
        </span>
        <button onClick={() => onPage(page + 1)} disabled={page >= pageCount} className="p-1.5 rounded-md border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Trang sau">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export function CsvButton<T>({ rows, columns, filename }: { rows: T[]; columns: CsvColumn<T>[]; filename: string }) {
  const download = () => {
    // BOM so Excel opens the Vietnamese text as UTF-8
    const blob = new Blob(['\uFEFF' + toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      onClick={download}
      disabled={rows.length === 0}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      title={`Xuất ${rows.length} dòng đang hiển thị (theo bộ lọc) ra file CSV`}
    >
      <Download className="w-3.5 h-3.5" />
      Xuất CSV
    </button>
  );
}

export const th = 'px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap';
export const td = 'px-4 py-3 align-middle';

export const EmptyState: React.FC<{ text: string }> = ({ text }) => <div className="px-4 py-14 text-center text-sm text-slate-500">{text}</div>;
