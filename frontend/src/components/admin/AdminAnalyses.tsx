import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import type { AdminAnalysisRow } from '../../types';
import { paginate, relativeTime } from '../../utils/adminMetrics';
import type { CsvColumn } from '../../utils/adminMetrics';
import { Chip, CsvButton, EmptyState, Pager, SearchBox, td, th } from './ui';

type ScoreFilter = 'all' | 'high' | 'mid' | 'low';
const PAGE = 15;

const inBand = (a: AdminAnalysisRow, f: ScoreFilter): boolean => {
  const s = a.atsScore ?? -1;
  if (f === 'high') return s >= 80;
  if (f === 'mid') return s >= 50 && s < 80;
  if (f === 'low') return s >= 0 && s < 50;
  return true;
};

const CSV: CsvColumn<AdminAnalysisRow>[] = [
  { label: 'ID', value: (a) => a.id },
  { label: 'Email người dùng', value: (a) => a.userEmail },
  { label: 'Vị trí ứng tuyển', value: (a) => a.targetJobTitle },
  { label: 'Điểm ATS', value: (a) => a.atsScore },
  { label: 'File CV gốc', value: (a) => a.originalFilename },
  { label: 'Thời gian', value: (a) => a.createdAt },
];

interface Props {
  analyses: AdminAnalysisRow[];
  now: number;
  onDownload: (a: AdminAnalysisRow) => void;
}

export const AdminAnalyses: React.FC<Props> = ({ analyses, now, onDownload }) => {
  const [query, setQuery] = useState('');
  const [band, setBand] = useState<ScoreFilter>('all');
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({ all: analyses.length, high: analyses.filter((a) => inBand(a, 'high')).length, mid: analyses.filter((a) => inBand(a, 'mid')).length, low: analyses.filter((a) => inBand(a, 'low')).length }),
    [analyses],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return analyses
      .filter((a) => inBand(a, band) && (!q || a.userEmail.toLowerCase().includes(q) || (a.targetJobTitle ?? '').toLowerCase().includes(q) || (a.originalFilename ?? '').toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [analyses, band, query]);

  const view = paginate(rows, page, PAGE);
  const scoreColor = (s: number | null) => (s === null ? 'bg-slate-600' : s >= 80 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-rose-500');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={band === 'all'} onClick={() => { setBand('all'); setPage(1); }} count={counts.all}>Tất cả</Chip>
        <Chip active={band === 'high'} onClick={() => { setBand('high'); setPage(1); }} count={counts.high}>≥ 80 điểm</Chip>
        <Chip active={band === 'mid'} onClick={() => { setBand('mid'); setPage(1); }} count={counts.mid}>50 – 79</Chip>
        <Chip active={band === 'low'} onClick={() => { setBand('low'); setPage(1); }} count={counts.low}>&lt; 50</Chip>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Tìm theo email, vị trí, tên file…" />
        <CsvButton rows={rows} columns={CSV} filename={`luot-phan-tich-${new Date(now).toISOString().slice(0, 10)}.csv`} />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className={th}>#</th>
                <th className={th}>Người dùng</th>
                <th className={th}>Vị trí ứng tuyển</th>
                <th className={th}>Điểm ATS</th>
                <th className={th}>File CV</th>
                <th className={th}>Thời gian</th>
                <th className={`${th} text-right`}>CV gốc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {view.rows.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className={`${td} font-mono text-xs text-slate-500`}>{a.id}</td>
                  <td className={`${td} text-xs font-mono text-slate-400`}>{a.userEmail}</td>
                  <td className={`${td} font-semibold text-slate-100 max-w-xs truncate`} title={a.targetJobTitle}>{a.targetJobTitle}</td>
                  <td className={td}>
                    <div className="flex items-center gap-2 w-28">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${scoreColor(a.atsScore)}`} style={{ width: `${Math.min(100, Math.max(0, a.atsScore ?? 0))}%` }} />
                      </div>
                      <span className="w-8 text-right text-xs font-bold tabular-nums text-slate-200">{a.atsScore ?? '--'}</span>
                    </div>
                  </td>
                  <td className={`${td} text-xs text-slate-400 max-w-[200px] truncate`} title={a.originalFilename ?? ''}>
                    {a.hasOriginalCv ? a.originalFilename : <span className="italic text-slate-600">Dán văn bản</span>}
                  </td>
                  <td className={`${td} text-xs text-slate-500 whitespace-nowrap`} title={new Date(a.createdAt).toLocaleString('vi-VN')}>
                    {relativeTime(new Date(a.createdAt).getTime(), now)}
                  </td>
                  <td className={`${td} text-right`}>
                    {a.hasOriginalCv ? (
                      <button onClick={() => onDownload(a)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-700 text-xs font-semibold text-slate-300 hover:border-indigo-500/60 hover:text-white transition-colors">
                        <Download className="w-3.5 h-3.5" /> Tải
                      </button>
                    ) : (
                      <span className="text-xs text-slate-700">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState text="Không có lượt phân tích nào khớp bộ lọc." />}
        </div>
        <Pager page={view.page} pageCount={view.pageCount} total={rows.length} size={PAGE} onPage={setPage} />
      </div>
    </div>
  );
};
