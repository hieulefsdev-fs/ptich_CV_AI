import React, { useMemo, useState } from 'react';
import { CircleCheck, CircleX, Crown, Lock, LockOpen } from 'lucide-react';
import type { AdminUserRow } from '../../types';
import { isQuotaExhausted, paginate, relativeTime } from '../../utils/adminMetrics';
import type { CsvColumn, UsersFilter } from '../../utils/adminMetrics';
import { Chip, CsvButton, EmptyState, Pager, SearchBox, td, th } from './ui';

interface Props {
  users: AdminUserRow[];
  filter: UsersFilter;
  onFilter: (f: UsersFilter) => void;
  currentEmail: string;
  now: number;
  onToggleActive: (u: AdminUserRow) => void;
  onChangeTier: (u: AdminUserRow, tier: 'free' | 'plus') => void;
}

type Sort = 'newest' | 'oldest' | 'quota' | 'name';
const PAGE = 15;

const matches = (u: AdminUserRow, f: UsersFilter): boolean => {
  switch (f) {
    case 'free': return u.tier === 'free';
    case 'plus': return u.tier === 'plus';
    case 'locked': return u.isActive === false;
    case 'unverified': return u.isVerified === false;
    case 'quota': return isQuotaExhausted(u);
    default: return true;
  }
};

const created = (u: AdminUserRow): number => (u.createdAt ? new Date(u.createdAt).getTime() : 0);

const CSV: CsvColumn<AdminUserRow>[] = [
  { label: 'ID', value: (u) => u.id },
  { label: 'Họ tên', value: (u) => u.fullName },
  { label: 'Email', value: (u) => u.email },
  { label: 'Vai trò', value: (u) => u.role },
  { label: 'Gói', value: (u) => u.tier },
  { label: 'Lượt đã dùng', value: (u) => u.cvQuotaUsed },
  { label: 'Lượt miễn phí tối đa', value: (u) => u.maxFreeQuota },
  { label: 'Đã xác thực OTP', value: (u) => u.isVerified },
  { label: 'Đang hoạt động', value: (u) => u.isActive },
  { label: 'Ngày đăng ký', value: (u) => u.createdAt },
];

export const AdminUsers: React.FC<Props> = ({ users, filter, onFilter, currentEmail, now, onToggleActive, onChangeTier }) => {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      all: users.length,
      free: users.filter((u) => matches(u, 'free')).length,
      plus: users.filter((u) => matches(u, 'plus')).length,
      quota: users.filter((u) => matches(u, 'quota')).length,
      unverified: users.filter((u) => matches(u, 'unverified')).length,
      locked: users.filter((u) => matches(u, 'locked')).length,
    }),
    [users],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = users.filter((u) => matches(u, filter) && (!q || u.email.toLowerCase().includes(q) || (u.fullName ?? '').toLowerCase().includes(q)));
    const by: Record<Sort, (a: AdminUserRow, b: AdminUserRow) => number> = {
      newest: (a, b) => created(b) - created(a),
      oldest: (a, b) => created(a) - created(b),
      quota: (a, b) => b.cvQuotaUsed - a.cvQuotaUsed,
      name: (a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? '', 'vi'),
    };
    return list.sort(by[sort]);
  }, [users, filter, query, sort]);

  const view = paginate(rows, page, PAGE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={filter === 'all'} onClick={() => { onFilter('all'); setPage(1); }} count={counts.all}>Tất cả</Chip>
        <Chip active={filter === 'free'} onClick={() => { onFilter('free'); setPage(1); }} count={counts.free}>Free</Chip>
        <Chip active={filter === 'plus'} onClick={() => { onFilter('plus'); setPage(1); }} count={counts.plus}>Plus</Chip>
        <Chip active={filter === 'quota'} onClick={() => { onFilter('quota'); setPage(1); }} count={counts.quota}>Hết lượt</Chip>
        <Chip active={filter === 'unverified'} onClick={() => { onFilter('unverified'); setPage(1); }} count={counts.unverified}>Chưa OTP</Chip>
        <Chip active={filter === 'locked'} onClick={() => { onFilter('locked'); setPage(1); }} count={counts.locked}>Bị khoá</Chip>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Tìm theo email hoặc họ tên…" />
        <div className="flex items-center gap-2">
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60" aria-label="Sắp xếp">
            <option value="newest">Mới đăng ký nhất</option>
            <option value="oldest">Đăng ký lâu nhất</option>
            <option value="quota">Dùng nhiều lượt nhất</option>
            <option value="name">Tên A → Z</option>
          </select>
          <CsvButton rows={rows} columns={CSV} filename={`nguoi-dung-${new Date(now).toISOString().slice(0, 10)}.csv`} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className={th}>Người dùng</th>
                <th className={th}>Gói / lượt dùng</th>
                <th className={th}>Xác thực</th>
                <th className={th}>Trạng thái</th>
                <th className={th}>Đăng ký</th>
                <th className={`${th} text-right`}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {view.rows.map((u) => {
                const isSelf = u.email === currentEmail;
                const isAdmin = u.role === 'ROLE_ADMIN';
                const pct = u.maxFreeQuota > 0 ? Math.min(100, (u.cvQuotaUsed / u.maxFreeQuota) * 100) : 0;
                return (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                          {(u.fullName || u.email).charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-100 truncate flex items-center gap-2">
                            {u.fullName || '—'}
                            {isAdmin && <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 text-[10px] font-bold">ADMIN</span>}
                            {isSelf && <span className="text-[10px] text-slate-500">(bạn)</span>}
                          </div>
                          <div className="text-xs text-slate-500 font-mono truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={td}>
                      {u.tier === 'plus' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-500/15 text-indigo-300 text-xs font-bold">
                          <Crown className="w-3 h-3" /> PLUS
                        </span>
                      ) : (
                        <div className="w-32">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="font-bold text-slate-400">FREE</span>
                            <span className={`tabular-nums ${isQuotaExhausted(u) ? 'text-amber-300 font-semibold' : 'text-slate-500'}`}>{u.cvQuotaUsed}/{u.maxFreeQuota}</span>
                          </div>
                          <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                            <div className={`h-full rounded-full ${isQuotaExhausted(u) ? 'bg-amber-400' : 'bg-slate-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className={td}>
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CircleCheck className="w-3.5 h-3.5" /> Đã xác thực</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400"><CircleX className="w-3.5 h-3.5" /> Chưa OTP</span>
                      )}
                    </td>
                    <td className={td}>
                      {u.isActive === false ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 text-xs font-semibold">Đã khoá</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-xs font-semibold">Hoạt động</span>
                      )}
                    </td>
                    <td className={`${td} text-xs text-slate-500 whitespace-nowrap`} title={u.createdAt ? new Date(u.createdAt).toLocaleString('vi-VN') : ''}>
                      {u.createdAt ? relativeTime(created(u), now) : '—'}
                    </td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <button
                        onClick={() => onChangeTier(u, u.tier === 'plus' ? 'free' : 'plus')}
                        className="px-2.5 py-1.5 rounded-md border border-slate-700 text-xs font-semibold text-slate-300 hover:border-indigo-500/60 hover:text-white transition-colors mr-2"
                      >
                        {u.tier === 'plus' ? 'Hạ xuống Free' : 'Nâng lên Plus'}
                      </button>
                      <button
                        onClick={() => onToggleActive(u)}
                        disabled={isSelf || isAdmin}
                        title={isSelf || isAdmin ? 'Không thể khoá tài khoản admin' : u.isActive === false ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          u.isActive === false ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                        }`}
                      >
                        {u.isActive === false ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        {u.isActive === false ? 'Mở khoá' : 'Khoá'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState text="Không có người dùng nào khớp bộ lọc." />}
        </div>
        <Pager page={view.page} pageCount={view.pageCount} total={rows.length} size={PAGE} onPage={setPage} />
      </div>
    </div>
  );
};
