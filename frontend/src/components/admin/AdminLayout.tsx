import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, CreditCard, FileText, House, LayoutDashboard, LogOut, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AdminTab = 'overview' | 'users' | 'analyses' | 'orders';

interface NavItem {
  key: AdminTab;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface Props {
  tab: AdminTab;
  onTab: (t: AdminTab) => void;
  counts: { users: number; analyses: number; orders: number; attention: number };
  adminEmail: string;
  onLogout: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  updatedAt: number | null;
  children: React.ReactNode;
}

const TITLES: Record<AdminTab, { title: string; sub: string }> = {
  overview: { title: 'Tổng quan', sub: 'Sức khoẻ hệ thống và những việc cần xử lý' },
  users: { title: 'Người dùng', sub: 'Tài khoản, gói dịch vụ và trạng thái xác thực' },
  analyses: { title: 'Lượt phân tích CV', sub: 'Toàn bộ báo cáo đã tạo và file CV gốc' },
  orders: { title: 'Giao dịch', sub: 'Đơn hàng VNPay và doanh thu' },
};

export const AdminLayout: React.FC<Props> = ({ tab, onTab, counts, adminEmail, onLogout, onRefresh, refreshing, updatedAt, children }) => {
  const items: NavItem[] = [
    { key: 'overview', label: 'Tổng quan', icon: LayoutDashboard, badge: counts.attention || undefined },
    { key: 'users', label: 'Người dùng', icon: Users },
    { key: 'analyses', label: 'Phân tích CV', icon: FileText },
    { key: 'orders', label: 'Giao dịch', icon: CreditCard },
  ];
  const head = TITLES[tab];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-slate-900/80 border-r border-slate-800">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-black text-white tracking-tight">CV AI</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">Admin console</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active = it.key === tab;
            return (
              <button
                key={it.key}
                onClick={() => onTab(it.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  active ? 'bg-indigo-500/15 text-white ring-1 ring-inset ring-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : ''}`} />
                <span className="flex-1 text-left">{it.label}</span>
                {it.badge !== undefined && <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center justify-center tabular-nums">{it.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 transition-colors">
            <House className="w-4 h-4" />
            Về trang chính
          </Link>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors">
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
          <div className="px-3 pt-2 text-[11px] text-slate-500 truncate" title={adminEmail}>
            {adminEmail}
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Mobile nav strip */}
        <div className="lg:hidden sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800">
          <div className="flex items-center gap-2 px-3 h-12">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
            <div className="flex-1 flex gap-1 overflow-x-auto">
              {items.map((it) => (
                <button
                  key={it.key}
                  onClick={() => onTab(it.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${it.key === tab ? 'bg-indigo-500/20 text-white' : 'text-slate-400'}`}
                >
                  {it.label}
                  {it.badge !== undefined && <span className="ml-1 text-amber-300">{it.badge}</span>}
                </button>
              ))}
            </div>
            <Link to="/" className="p-2 text-slate-400" aria-label="Về trang chính">
              <House className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 lg:px-8 py-5 border-b border-slate-800/80">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">{head.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{head.sub}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 text-[11px] text-slate-500">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              {updatedAt ? `Cập nhật ${new Date(updatedAt).toLocaleTimeString('vi-VN')} · tự làm mới mỗi 60 giây` : 'Đang tải…'}
            </span>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-200 hover:border-indigo-500/50 disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </header>

        <main className="px-5 lg:px-8 py-6 space-y-6">{children}</main>
      </div>
    </div>
  );
};
