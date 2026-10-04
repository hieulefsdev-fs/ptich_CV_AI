import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import type { CVAnalysis, SkillItem } from '../types';
import { compareSkills } from '../utils/compareSkills';
import { ArrowLeft, AlertCircle, ArrowRight, CheckCircle2, XCircle, Clock, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Normalized {
  id: number;
  job: string;
  score: number;
  time: number;
  matched: SkillItem[];
  missing: SkillItem[];
}

const normalize = (a: CVAnalysis): Normalized => {
  const raw = a.created_at ?? a.createdAt;
  const t = raw ? new Date(raw).getTime() : 0;
  return {
    id: a.id,
    job: (a.target_job_title ?? a.targetJobTitle ?? '').trim(),
    score: a.ats_score ?? a.atsScore ?? 0,
    time: Number.isNaN(t) ? 0 : t,
    matched: a.matched_skills ?? a.matchedSkills ?? [],
    missing: a.missing_skills ?? a.missingSkills ?? [],
  };
};

const SkillList: React.FC<{
  title: string;
  hint: string;
  items: string[];
  tone: 'good' | 'bad' | 'warn' | 'neutral';
  icon: React.ReactNode;
}> = ({ title, hint, items, tone, icon }) => {
  const toneClass = {
    good: 'border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
    bad: 'border-rose-500/30 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300',
    warn: 'border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
    neutral: 'border-slate-300/50 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300',
  }[tone];

  return (
    <div className={`p-4 rounded-2xl border ${toneClass}`}>
      <h3 className="text-sm font-bold flex items-center gap-2">{icon}{title} ({items.length})</h3>
      <p className="text-[11px] opacity-70 mt-0.5">{hint}</p>
      {items.length === 0 ? (
        <p className="text-xs opacity-60 mt-3">Không có.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {items.map((s) => (
            <span key={s} className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white/70 dark:bg-slate-800/70">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export const ComparePage: React.FC = () => {
  const [params] = useSearchParams();
  const idA = params.get('a');
  const idB = params.get('b');

  const [reports, setReports] = useState<[Normalized, Normalized] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!idA || !idB || idA === idB) {
      setErrorMsg('Hãy chọn đúng 2 báo cáo khác nhau trong trang Lịch sử để so sánh.');
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [ra, rb] = await Promise.all([api.get(`/analysis/${idA}`), api.get(`/analysis/${idB}`)]);
        if (cancelled) return;
        const pair = [normalize(ra.data), normalize(rb.data)].sort((x, y) => x.time - y.time);
        setReports([pair[0], pair[1]]);
      } catch {
        if (!cancelled) setErrorMsg('Không thể tải một trong hai báo cáo để so sánh.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idA, idB]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (errorMsg || !reports) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{errorMsg || 'Không có dữ liệu để so sánh.'}</h2>
        <Link to="/history" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">
          <ArrowLeft className="w-4 h-4" />
          Về trang Lịch sử
        </Link>
      </div>
    );
  }

  const [older, newer] = reports;
  const delta = newer.score - older.score;
  const diff = compareSkills(older, newer);
  const sameJob = older.job.toLowerCase() === newer.job.toLowerCase();
  const fmt = (t: number) => new Date(t).toLocaleString('vi-VN');

  const Header: React.FC<{ r: Normalized; label: string }> = ({ r, label }) => (
    <Link
      to={`/report/${r.id}`}
      className="flex-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 shadow-sm transition-colors"
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
        {r.score}<span className="text-sm font-normal text-slate-400">/100</span>
      </div>
      <div className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5 text-emerald-500" />{r.job || 'Không rõ vị trí'}
      </div>
      <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1.5"><Clock className="w-3 h-3" />{fmt(r.time)}</div>
    </Link>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/history" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Quay lại Lịch sử
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">So sánh hai lần phân tích CV</h1>

      {!sameJob && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Hai báo cáo nhắm tới hai vị trí khác nhau, nên mức thay đổi điểm chỉ mang tính tham khảo.</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-stretch gap-3">
        <Header r={older} label="Lần trước" />
        <div className="flex md:flex-col items-center justify-center gap-1 px-2">
          <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block" />
          <div
            className={`px-4 py-2 rounded-xl font-black text-lg flex items-center gap-1.5 ${
              delta > 0
                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'
                : delta < 0
                  ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {delta > 0 ? <TrendingUp className="w-5 h-5" /> : delta < 0 ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
            {delta > 0 ? '+' : ''}{delta}
          </div>
          <span className="text-[10px] text-slate-400">điểm</span>
        </div>
        <Header r={newer} label="Lần sau" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkillList title="Kỹ năng đã cải thiện" hint="Đạt yêu cầu ở lần sau, chưa đạt ở lần trước." items={diff.gained} tone="good" icon={<CheckCircle2 className="w-4 h-4" />} />
        <SkillList title="Kỹ năng bị tụt" hint="Từng đạt yêu cầu nhưng lần sau lại bị đánh giá thiếu." items={diff.lost} tone="bad" icon={<XCircle className="w-4 h-4" />} />
        <SkillList title="Vẫn còn thiếu" hint="Thiếu ở cả hai lần — ưu tiên bổ sung." items={diff.stillMissing} tone="warn" icon={<AlertCircle className="w-4 h-4" />} />
        <SkillList title="Khoảng trống mới xuất hiện" hint="Lần sau mới thấy thiếu, lần trước không nhắc tới." items={diff.newGaps} tone="neutral" icon={<AlertCircle className="w-4 h-4" />} />
      </div>

      <p className="text-[11px] text-slate-400">
        Kỹ năng được so khớp theo tên. Vì AI có thể đặt tên hơi khác nhau giữa các lần phân tích (ví dụ "React" và "ReactJS"),
        một vài mục có thể bị tính là khác nhau dù thực chất là một.
      </p>
    </div>
  );
};
