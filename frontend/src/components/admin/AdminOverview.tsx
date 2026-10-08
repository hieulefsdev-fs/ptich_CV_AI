import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, CreditCard, FileText, Sparkles, UserPlus } from 'lucide-react';
import type { AdminAnalysisRow, AdminStats, AdminUserRow, PaymentOrderRecord } from '../../types';
import {
  activityFeed,
  attentionItems,
  average,
  dailyCounts,
  dailySums,
  percent,
  relativeTime,
  scoreHistogram,
  topJobs,
} from '../../utils/adminMetrics';
import type { AttentionItem, OrdersFilter, UsersFilter } from '../../utils/adminMetrics';
import { BarChart, Donut, HBar, Sparkline } from './charts';
import { Panel } from './ui';
import type { AdminTab } from './AdminLayout';

interface Props {
  stats: AdminStats;
  users: AdminUserRow[];
  analyses: AdminAnalysisRow[];
  orders: PaymentOrderRecord[];
  now: number;
  onOpen: (tab: AdminTab, filter?: UsersFilter | OrdersFilter) => void;
}

type Metric = 'analyses' | 'signups' | 'revenue';

const money = (n: number) => `${Math.round(n).toLocaleString('vi-VN')} đ`;

const Kpi: React.FC<{ label: string; value: React.ReactNode; sub: React.ReactNode; spark?: number[]; sparkClass?: string; accent: string }> = ({
  label,
  value,
  sub,
  spark,
  sparkClass,
  accent,
}) => (
  <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5">
    <div className={`absolute inset-x-0 top-0 h-0.5 ${accent}`} />
    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div>
    <div className="mt-2 text-3xl font-black text-white tabular-nums tracking-tight">{value}</div>
    <div className="mt-1 text-xs text-slate-400">{sub}</div>
    {spark && <div className="mt-3 -mb-1">{<Sparkline values={spark} className={sparkClass} />}</div>}
  </div>
);

const TONE: Record<AttentionItem['tone'], string> = {
  danger: 'border-rose-500/30 bg-rose-500/5 text-rose-300',
  warn: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
  info: 'border-sky-500/30 bg-sky-500/5 text-sky-300',
};

const FEED_ICON = { signup: UserPlus, analysis: FileText, order: CreditCard } as const;
const FEED_TONE = { neutral: 'text-slate-400 bg-slate-800', good: 'text-emerald-300 bg-emerald-500/15', warn: 'text-amber-300 bg-amber-500/15', bad: 'text-rose-300 bg-rose-500/15' } as const;

export const AdminOverview: React.FC<Props> = ({ stats, users, analyses, orders, now, onOpen }) => {
  const [metric, setMetric] = useState<Metric>('analyses');
  const [range, setRange] = useState<7 | 14 | 30>(14);

  const d = useMemo(() => {
    const paid = orders.filter((o) => o.status === 'SUCCESS');
    const scores = analyses.map((a) => a.atsScore).filter((s): s is number => typeof s === 'number');
    const signups = (days: number) => dailyCounts(users.map((u) => u.createdAt), days, now);
    const runs = (days: number) => dailyCounts(analyses.map((a) => a.createdAt), days, now);
    const revenue = (days: number) =>
      dailySums(
        paid.map((o) => ({ time: new Date(o.paidAt ?? o.createdAt).getTime(), amount: Number(o.amount) })),
        days,
        now,
      );
    const weekSignups = signups(7).reduce((s, b) => s + b.value, 0);
    const weekRuns = runs(7).reduce((s, b) => s + b.value, 0);
    const todayRuns = runs(1)[0]?.value ?? 0;
    const verified = users.filter((u) => u.isVerified).length;
    const usedOnce = users.filter((u) => (u.cvQuotaUsed ?? 0) > 0).length;
    return {
      signups,
      runs,
      revenue,
      weekSignups,
      weekRuns,
      todayRuns,
      scores,
      avgScore: average(scores),
      strong: scores.filter((s) => s >= 80).length,
      orderTotal: orders.length,
      orderPaid: paid.length,
      orderPending: orders.filter((o) => o.status === 'PENDING').length,
      orderFailed: orders.filter((o) => o.status === 'FAILED').length,
      hist: scoreHistogram(scores),
      jobs: topJobs(analyses, 6),
      attention: attentionItems(users, orders, now),
      feed: activityFeed(users, analyses, orders, 9),
      funnel: [
        { label: 'Đăng ký tài khoản', value: users.length },
        { label: 'Xác thực OTP', value: verified },
        { label: 'Đã phân tích ≥ 1 CV', value: usedOnce },
        { label: 'Nâng cấp Plus', value: stats.plusUsers },
      ],
    };
  }, [users, analyses, orders, stats.plusUsers, now]);

  const series = useMemo(() => {
    const data = metric === 'analyses' ? d.runs(range) : metric === 'signups' ? d.signups(range) : d.revenue(range);
    return { data, total: data.reduce((s, b) => s + b.value, 0) };
  }, [d, metric, range]);

  const spark14 = useMemo(
    () => ({ signups: d.signups(14).map((b) => b.value), runs: d.runs(14).map((b) => b.value), revenue: d.revenue(14).map((b) => b.value) }),
    [d],
  );

  const metricMeta: Record<Metric, { label: string; bar: string; fmt: (n: number) => string; unit: string }> = {
    analyses: { label: 'Phân tích', bar: 'fill-indigo-500', fmt: (n) => String(n), unit: 'lượt' },
    signups: { label: 'Đăng ký', bar: 'fill-sky-500', fmt: (n) => String(n), unit: 'tài khoản' },
    revenue: { label: 'Doanh thu', bar: 'fill-amber-500', fmt: (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)), unit: '' },
  };
  const meta = metricMeta[metric];
  const maxHist = Math.max(...d.hist.map((h) => h.count), 1);
  const maxJob = Math.max(...d.jobs.map((j) => j.count), 1);
  const funnelTop = Math.max(d.funnel[0]?.value ?? 0, 1);
  const barTone = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Kpi
          label="Người dùng"
          value={stats.totalUsers.toLocaleString('vi-VN')}
          sub={<><span className="text-sky-300 font-semibold">+{d.weekSignups}</span> trong 7 ngày · {stats.plusUsers} Plus / {stats.freeUsers} Free</>}
          spark={spark14.signups}
          sparkClass="stroke-sky-400"
          accent="bg-sky-500"
        />
        <Kpi
          label="Lượt phân tích"
          value={stats.totalAnalyses.toLocaleString('vi-VN')}
          sub={<><span className="text-indigo-300 font-semibold">+{d.todayRuns}</span> hôm nay · {d.weekRuns} trong 7 ngày</>}
          spark={spark14.runs}
          sparkClass="stroke-indigo-400"
          accent="bg-indigo-500"
        />
        <Kpi
          label="Doanh thu"
          value={money(stats.totalRevenue)}
          sub={`${stats.successfulOrders} giao dịch thành công · ${percent(stats.plusUsers, stats.totalUsers)}% người dùng là Plus`}
          spark={spark14.revenue}
          sparkClass="stroke-amber-400"
          accent="bg-amber-500"
        />
        <Kpi
          label="Điểm ATS trung bình"
          value={<>{d.avgScore}<span className="text-base font-semibold text-slate-500">/100</span></>}
          sub={`${d.strong} / ${d.scores.length} báo cáo đạt từ 80 điểm (${percent(d.strong, d.scores.length)}%)`}
          accent="bg-violet-500"
        />
        <Kpi
          label="Thanh toán thành công"
          value={<>{percent(d.orderPaid, d.orderTotal)}<span className="text-base font-semibold text-slate-500">%</span></>}
          sub={`${d.orderPaid} thành công · ${d.orderPending} đang chờ · ${d.orderFailed} thất bại`}
          accent="bg-emerald-500"
        />
        <Kpi
          label="Hết lượt miễn phí"
          value={users.filter((u) => u.tier === 'free' && u.cvQuotaUsed >= u.maxFreeQuota).length}
          sub="Người dùng Free đã dùng hết lượt — nhóm dễ nâng cấp nhất"
          accent="bg-rose-500"
        />
      </div>

      {/* Chart + attention */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel
          className="xl:col-span-2"
          title={
            <span className="flex items-center gap-1">
              {(Object.keys(metricMeta) as Metric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide transition-colors ${metric === m ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {metricMeta[m].label}
                </button>
              ))}
            </span>
          }
          action={
            <div className="flex items-center gap-1">
              {([7, 14, 30] as const).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={`px-2 py-1 rounded-md text-[11px] font-semibold ${range === r ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  {r} ngày
                </button>
              ))}
            </div>
          }
        >
          <div className="mb-3 text-sm text-slate-400">
            <span className="text-2xl font-black text-white tabular-nums">{metric === 'revenue' ? money(series.total) : series.total.toLocaleString('vi-VN')}</span>
            <span className="ml-2 text-xs">{metric === 'revenue' ? '' : meta.unit} trong {range} ngày qua</span>
          </div>
          <BarChart data={series.data} barClass={meta.bar} format={meta.fmt} height={300} />
        </Panel>

        <Panel title="Cần chú ý" action={d.attention.length > 0 ? <span className="text-[11px] text-amber-300 font-semibold">{d.attention.length} mục</span> : undefined}>
          {d.attention.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
              Không có gì cần xử lý.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {d.attention.map((a) => (
                <li key={a.id}>
                  <button onClick={() => onOpen(a.tab, a.filter)} className={`group w-full text-left rounded-lg border p-3 transition-colors hover:brightness-125 ${TONE[a.tone]}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-100">{a.title}</div>
                        <div className="mt-0.5 text-[11px] leading-snug text-slate-400">{a.detail}</div>
                      </div>
                      <span className="text-lg font-black tabular-nums">{a.count}</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Distribution row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Cơ cấu gói">
          <div className="flex items-center gap-5">
            <Donut
              segments={[
                { label: 'Plus', value: stats.plusUsers, color: 'rgb(99 102 241)' },
                { label: 'Free', value: stats.freeUsers, color: 'rgb(51 65 85)' },
              ]}
            >
              <div className="text-2xl font-black text-white tabular-nums">{percent(stats.plusUsers, stats.totalUsers)}%</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Plus</div>
            </Donut>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />Plus <b className="ml-1 text-white tabular-nums">{stats.plusUsers}</b></li>
              <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-slate-600" />Free <b className="ml-1 text-white tabular-nums">{stats.freeUsers}</b></li>
            </ul>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
            {d.funnel.map((f, i) => (
              <HBar key={f.label} label={f.label} value={f.value} max={funnelTop} right={`${f.value} · ${percent(f.value, funnelTop)}%`} barClass={['bg-sky-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-violet-500'][i]} />
            ))}
          </div>
        </Panel>

        <Panel title="Phân bố điểm ATS">
          <div className="space-y-3.5">
            {d.hist.map((h, i) => (
              <HBar key={h.label} label={h.label} value={h.count} max={maxHist} right={`${h.count} · ${percent(h.count, d.scores.length)}%`} barClass={barTone[i]} />
            ))}
          </div>
          {d.scores.length === 0 && <p className="mt-4 text-xs text-slate-500">Chưa có báo cáo nào.</p>}
        </Panel>

        <Panel title="Vị trí được nhắm tới nhiều nhất">
          {d.jobs.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có dữ liệu.</p>
          ) : (
            <div className="space-y-3.5">
              {d.jobs.map((j) => (
                <HBar key={j.title} label={j.title} value={j.count} max={maxJob} right={`${j.count} lượt · TB ${j.avgScore}`} barClass="bg-violet-500" />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Activity feed */}
      <Panel title="Hoạt động gần đây">
        {d.feed.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có hoạt động nào.</p>
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {d.feed.map((e) => {
              const Icon = FEED_ICON[e.kind];
              return (
                <li key={e.key} className="flex items-center gap-3 py-2.5">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${FEED_TONE[e.tone]}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{e.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">{e.detail}</div>
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0" title={new Date(e.time).toLocaleString('vi-VN')}>
                    {relativeTime(e.time, now)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
};
