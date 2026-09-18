import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import type { AdminStats, PaymentOrderRecord } from '../types';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [orders, setOrders] = useState<PaymentOrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'analyses' | 'orders'>('users');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionMsg, setActionMsg] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, analysesRes, ordersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/analyses'),
        api.get('/admin/orders')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setAnalyses(analysesRes.data);
      setOrders(ordersRes.data);
    } catch (err: any) {
      console.error('Error fetching admin data', err);
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      const res = await api.put(`/admin/users/${userId}/toggle-active`);
      setActionMsg(res.data.message);
      loadData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleChangeTier = async (userId: number, newTier: string) => {
    try {
      const res = await api.put(`/admin/users/${userId}/change-tier?tier=${newTier}`);
      setActionMsg(res.data.message);
      loadData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDownloadOriginal = async (analysisId: number, filename: string) => {
    try {
      const res = await api.get(`/cv/original-cv/${analysisId}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `original_cv_${analysisId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Không thể tải file CV gốc hoặc file không tồn tại.');
    }
  };

  if (user?.role !== 'ROLE_ADMIN' && user?.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Truy Cập Bị Từ Chối</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          Khu vực quản trị chỉ dành cho tài khoản Admin cấp cao.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Trung Tâm Quản Trị Hệ Thống
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            Hệ Thống Phân Tích CV & Quản Trị Học Viên
          </h1>
          <p className="text-sm text-slate-500">Giám sát tải, người dùng, giao dịch VNPay 25k và file CV gốc an toàn</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-2 self-start"
        >
          Làm mới dữ liệu
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng Học Viên</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats ? stats.totalUsers : '--'}
            </h3>
            <p className="text-xs text-emerald-500 font-semibold mt-1">
              {stats ? `${stats.plusUsers} Plus / ${stats.freeUsers} Free` : ''}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng Phân Tích</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats ? stats.totalAnalyses : '--'}
            </h3>
            <p className="text-xs text-indigo-500 font-semibold mt-1">Đã sinh CV hoàn chỉnh</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Giao Dịch Thành Công</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats ? stats.successfulOrders : '--'}
            </h3>
            <p className="text-xs text-emerald-500 font-semibold mt-1">Cổng VNPay 25k</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Doanh Thu VNPay</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats ? `${Number(stats.totalRevenue).toLocaleString('vi-VN')} đ` : '--'}
            </h3>
            <p className="text-xs text-amber-500 font-semibold mt-1">Gói Plus 25.000 VNĐ</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Học Viên ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('analyses')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'analyses'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Hồ Sơ CV & File Gốc ({analyses.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'orders'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Giao Dịch VNPay ({orders.length})
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm theo email, họ tên, mã..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Họ và Tên</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Gói / Lượt</th>
                  <th className="px-6 py-4">Xác Thực OTP</th>
                  <th className="px-6 py-4">Trạng Thái</th>
                  <th className="px-6 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {users
                  .filter(
                    (u) =>
                      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">#{u.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {u.fullName}
                        {u.role === 'ROLE_ADMIN' && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-500 font-bold">
                            ADMIN
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.tier === 'plus'
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {u.tier.toUpperCase()} ({u.cvQuotaUsed}/{u.maxFreeQuota})
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác thực
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-semibold">
                            <XCircle className="w-3.5 h-3.5" /> Chưa OTP
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {u.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-600 font-semibold">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-rose-500/10 text-rose-600 font-semibold">
                            Đã khoá
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {u.tier === 'free' ? (
                          <button
                            onClick={() => handleChangeTier(u.id, 'plus')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-colors"
                          >
                            Set Plus
                          </button>
                        ) : (
                          <button
                            onClick={() => handleChangeTier(u.id, 'free')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 text-xs font-bold transition-colors"
                          >
                            Set Free
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleActive(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            u.isActive
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600'
                          }`}
                        >
                          {u.isActive ? 'Khoá' : 'Mở khoá'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analyses Tab */}
      {activeTab === 'analyses' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Học Viên</th>
                  <th className="px-6 py-4">Vị Trí Ứng Tuyển</th>
                  <th className="px-6 py-4">Điểm ATS</th>
                  <th className="px-6 py-4">File Gốc</th>
                  <th className="px-6 py-4">Thời Gian</th>
                  <th className="px-6 py-4 text-right">Tải CV Gốc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {analyses
                  .filter(
                    (a) =>
                      a.targetJobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">#{a.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{a.userFullName}</div>
                        <div className="text-xs text-slate-400 font-mono">{a.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {a.targetJobTitle}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-black text-sm ${
                            a.atsScore >= 75
                              ? 'text-emerald-500'
                              : a.atsScore >= 50
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          }`}
                        >
                          {a.atsScore}/100
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {a.hasOriginalCv ? (
                          <span className="text-slate-600 dark:text-slate-300 font-mono truncate max-w-[150px] inline-block">
                            {a.originalFilename}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Nhập văn bản</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                        {new Date(a.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {a.hasOriginalCv ? (
                          <button
                            onClick={() => handleDownloadOriginal(a.id, a.originalFilename)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Tải file gốc
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Mã Giao Dịch</th>
                  <th className="px-6 py-4">Học Viên</th>
                  <th className="px-6 py-4">Số Tiền</th>
                  <th className="px-6 py-4">Ngân Hàng</th>
                  <th className="px-6 py-4">Trạng Thái</th>
                  <th className="px-6 py-4">Thời Gian Khởi Tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {orders
                  .filter(
                    (o) =>
                      o.txnRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      o.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-indigo-500 font-bold">
                        {o.txnRef}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{o.userFullName}</div>
                        <div className="text-xs text-slate-400 font-mono">{o.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                        {Number(o.amount).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        {o.vnpBankCode || 'VNPay Sandbox'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            o.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : o.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                        {new Date(o.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
