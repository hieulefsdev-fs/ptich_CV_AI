import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { downloadOriginalCv } from '../api/payment';
import type { CVAnalysisListItem } from '../types';
import {
  History,
  FileText,
  Trash2,
  ExternalLink,
  Plus,
  Clock,
  AlertCircle,
  Download
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<CVAnalysisListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchHistory = async () => {
    try {
      const res = await api.get('/analysis/history');
      setHistory(res.data);
    } catch (err: any) {
      setErrorMsg('Không thể tải danh sách lịch sử phân tích CV.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi phân tích CV này?')) return;
    try {
      await api.delete(`/analysis/${id}`);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert('Không thể xóa bản ghi này. Vui lòng thử lại.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-emerald-500" />
            Lịch Sử Phân Tích CV Của Bạn
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý và xem lại các bản phân tích ATS và CV đã được tối ưu hóa trước đây.
          </p>
        </div>

        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Phân tích CV mới
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* History List */}
      {history.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Chưa có bản ghi phân tích CV nào
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Hãy bắt đầu bằng cách tải lên CV đầu tiên để khám phá điểm ATS và nhận bản CV hoàn chỉnh mới.
          </p>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
          >
            Phân tích CV ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.target_job_title}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {item.original_filename || 'Nội dung dán'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.created_at ?? Date.now()).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Score & Actions */}
              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="text-right">
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {item.ats_score}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">Điểm ATS</div>
                </div>

                <div className="flex items-center gap-2">
                  {item.has_original_cv && (
                    <button
                      onClick={() => downloadOriginalCv(item.id, item.original_filename)}
                      className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                      title="Tải CV gốc đã tải lên"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}

                  <Link
                    to={`/report/${item.id}`}
                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                    title="Xem chi tiết báo cáo & CV hoàn thiện"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Xóa kết quả này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
