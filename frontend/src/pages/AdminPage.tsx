import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import type { AdminAnalysisRow, AdminStats, AdminUserRow, PaymentOrderRecord } from '../types';
import { attentionItems } from '../utils/adminMetrics';
import type { OrdersFilter, UsersFilter } from '../utils/adminMetrics';
import { AdminLayout } from '../components/admin/AdminLayout';
import type { AdminTab } from '../components/admin/AdminLayout';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminAnalyses } from '../components/admin/AdminAnalyses';
import { AdminOrders } from '../components/admin/AdminOrders';

interface AdminData {
  stats: AdminStats;
  users: AdminUserRow[];
  analyses: AdminAnalysisRow[];
  orders: PaymentOrderRecord[];
}

const TABS: AdminTab[] = ['overview', 'users', 'analyses', 'orders'];
const USER_FILTERS: UsersFilter[] = ['all', 'free', 'plus', 'locked', 'unverified', 'quota'];
const ORDER_FILTERS: OrdersFilter[] = ['all', 'SUCCESS', 'PENDING', 'FAILED'];
const REFRESH_MS = 60_000;

export const AdminPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'admin';

  // The tab and filters live in the query string (/admin?tab=users&filter=quota) so the
  // page path stays exactly "/admin" — anything keyed on that path (e.g. a Cloudflare rule) keeps working.
  const rawTab = params.get('tab');
  const tab: AdminTab = TABS.includes(rawTab as AdminTab) ? (rawTab as AdminTab) : 'overview';
  const rawFilter = params.get('filter') ?? 'all';
  const usersFilter: UsersFilter = USER_FILTERS.includes(rawFilter as UsersFilter) ? (rawFilter as UsersFilter) : 'all';
  const ordersFilter: OrdersFilter = ORDER_FILTERS.includes(rawFilter as OrdersFilter) ? (rawFilter as OrdersFilter) : 'all';

  const go = useCallback(
    (next: AdminTab, filter?: string) => {
      const p: Record<string, string> = { tab: next };
      if (filter && filter !== 'all') p.filter = filter;
      setParams(p);
    },
    [setParams],
  );

  const load = useCallback(async (silent: boolean) => {
    if (!silent) setRefreshing(true);
    try {
      const [stats, users, analyses, orders] = await Promise.all([
        api.get<AdminStats>('/admin/stats'),
        api.get<AdminUserRow[]>('/admin/users'),
        api.get<AdminAnalysisRow[]>('/admin/analyses'),
        api.get<PaymentOrderRecord[]>('/admin/orders'),
      ]);
      setData({ stats: stats.data, users: users.data, analyses: analyses.data, orders: orders.data });
      setError('');
      setNow(Date.now());
      setUpdatedAt(Date.now());
    } catch (err: any) {
      const status = err?.response?.status;
      setError(status === 403 ? 'Tài khoản này không có quyền quản trị.' : 'Không tải được dữ liệu quản trị. Kiểm tra backend rồi bấm “Làm mới”.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    load(true);
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load(true);
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [isAdmin, load]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const run = async (request: () => Promise<{ data: { message?: string } }>) => {
    try {
      const res = await request();
      setToast({ ok: true, text: res.data.message ?? 'Đã cập nhật.' });
      await load(true);
    } catch (err: any) {
      setToast({ ok: false, text: err?.response?.data?.message ?? 'Có lỗi xảy ra, thao tác chưa được thực hiện.' });
    }
  };

  const onToggleActive = (u: AdminUserRow) => {
    const locking = u.isActive !== false;
    if (locking && !window.confirm(`Khoá tài khoản ${u.email}? Người này sẽ không đăng nhập được nữa.`)) return;
    run(() => api.put(`/admin/users/${u.id}/toggle-active`));
  };

  const onChangeTier = (u: AdminUserRow, tier: 'free' | 'plus') => {
    if (!window.confirm(`Đổi gói của ${u.email} sang ${tier.toUpperCase()}?`)) return;
    run(() => api.put(`/admin/users/${u.id}/change-tier?tier=${tier}`));
  };

  const onDownload = async (a: AdminAnalysisRow) => {
    try {
      const res = await api.get(`/cv/original-cv/${a.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', a.originalFilename || `original_cv_${a.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setToast({ ok: false, text: 'Không tải được file CV gốc (file không tồn tại hoặc lỗi máy chủ).' });
    }
  };

  const attentionCount = useMemo(() => (data ? attentionItems(data.users, data.orders, now).length : 0), [data, now]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <TriangleAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-white">Truy cập bị từ chối</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm">Khu vực quản trị chỉ dành cho tài khoản admin.</p>
        <Link to="/" className="mt-5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-100 transition-colors">
          Về trang chính
        </Link>
      </div>
    );
  }

  return (
    <AdminLayout
      tab={tab}
      onTab={(t) => go(t)}
      counts={{ users: data?.users.length ?? 0, analyses: data?.analyses.length ?? 0, orders: data?.orders.length ?? 0, attention: attentionCount }}
      adminEmail={user?.email ?? ''}
      onLogout={logout}
      onRefresh={() => load(false)}
      refreshing={refreshing}
      updatedAt={updatedAt}
    >
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-sm text-rose-200 flex items-center gap-3">
          <TriangleAlert className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => load(false)} className="px-3 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold">
            Thử lại
          </button>
        </div>
      )}

      {!data && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse" />
          ))}
        </div>
      )}

      {data && tab === 'overview' && (
        <AdminOverview stats={data.stats} users={data.users} analyses={data.analyses} orders={data.orders} now={now} onOpen={(t, f) => go(t, f)} />
      )}
      {data && tab === 'users' && (
        <AdminUsers
          users={data.users}
          filter={usersFilter}
          onFilter={(f) => go('users', f)}
          currentEmail={user?.email ?? ''}
          now={now}
          onToggleActive={onToggleActive}
          onChangeTier={onChangeTier}
        />
      )}
      {data && tab === 'analyses' && <AdminAnalyses analyses={data.analyses} now={now} onDownload={onDownload} />}
      {data && tab === 'orders' && <AdminOrders orders={data.orders} filter={ordersFilter} onFilter={(f) => go('orders', f)} now={now} />}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 max-w-sm flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-semibold ${
            toast.ok ? 'bg-slate-900 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-rose-500/40 text-rose-300'
          }`}
        >
          {toast.ok ? <CircleCheck className="w-4 h-4 shrink-0" /> : <TriangleAlert className="w-4 h-4 shrink-0" />}
          {toast.text}
        </div>
      )}
    </AdminLayout>
  );
};
