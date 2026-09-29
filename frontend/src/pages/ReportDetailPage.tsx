import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { downloadOriginalCv } from '../api/payment';
import type { CVAnalysis } from '../types';
import { GeneratedCVView } from '../components/GeneratedCVView';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  Layers,
  GraduationCap,
  ChevronRight,
  Download,
  CirclePlay,
  ExternalLink,
  Briefcase
} from 'lucide-react';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'generated_cv'>('diagnosis');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await api.get(`/analysis/${id}`);
        setAnalysis(res.data);
      } catch (err: any) {
        setErrorMsg('Không thể tải kết quả phân tích CV này.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Đang tải chi tiết hồ sơ phân tích...
        </p>
      </div>
    );
  }

  if (errorMsg || !analysis) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {errorMsg || 'Không tìm thấy kết quả phân tích.'}
        </h2>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại phân tích CV khác
        </Link>
      </div>
    );
  }

  const atsScore = analysis.ats_score ?? analysis.atsScore ?? 0;
  const getScoreColor = () => {
    if (atsScore >= 80) return 'text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40';
    if (atsScore >= 60) return 'text-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-950/40';
    return 'text-rose-500 border-rose-500 bg-rose-50 dark:bg-rose-950/40';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Phân tích hồ sơ mới
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Thời gian tạo: {new Date(analysis.created_at ?? Date.now()).toLocaleString('vi-VN')}</span>
        </div>

        {analysis.has_original_cv && (
          <button
            onClick={() => downloadOriginalCv(analysis.id, analysis.original_filename)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Tải CV gốc đã nộp
          </button>
        )}
      </div>

      {/* Hero Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md no-print">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Target className="w-3.5 h-3.5" />
              Mục tiêu: {analysis.target_job_title}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Báo Cáo Phân Tích &amp; Tối Ưu Năng Lực Ứng Tuyển
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              {analysis.assessment_summary}
            </p>
            {analysis.job_listings && analysis.job_listings.length > 0 ? (
              <div className="pt-1 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  Việc làm phù hợp đang tuyển:
                </span>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  {analysis.job_listings.map((job, jIdx) => (
                    <a
                      key={jIdx}
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors max-w-[220px]"
                      title={`${job.title}${job.company ? ' — ' + job.company : ''}`}
                    >
                      <span className="truncate">{job.title}{job.company ? ` · ${job.company}` : ''}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            ) : analysis.job_search_urls && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  Tìm việc ngay:
                </span>
                {analysis.job_search_urls.linkedin && (
                  <a
                    href={analysis.job_search_urls.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors"
                  >
                    LinkedIn <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {analysis.job_search_urls.topcv && (
                  <a
                    href={analysis.job_search_urls.topcv}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-colors"
                  >
                    TopCV <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {analysis.job_search_urls.vietnamworks && (
                  <a
                    href={analysis.job_search_urls.vietnamworks}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/60 transition-colors"
                  >
                    VietnamWorks <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ATS Score Circular Badge */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div
              className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-inner ${getScoreColor()}`}
            >
              <span className="text-3xl font-black tracking-tight">{atsScore}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Điểm ATS / 100</span>
            </div>
            <span className="mt-2 text-xs font-bold text-slate-500">
              {atsScore >= 80 ? 'Hồ sơ Tốt' : atsScore >= 60 ? 'Hồ sơ Trung bình' : 'Nguy cơ bị loại'}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'diagnosis'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            1. Chẩn Đoán Thiếu Hụt Kỹ Năng &amp; Lộ Trình
          </button>

          <button
            onClick={() => setActiveTab('generated_cv')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'generated_cv'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            2. Xem Bản CV Hoàn Chỉnh Mới (Đã Bổ Sung Kỹ Năng)
          </button>
        </div>
      </div>

      {/* Tab 1: Skill Diagnosis & Action Plan */}
      {activeTab === 'diagnosis' && (
        <div className="space-y-8 no-print">
          {/* Matched vs Missing Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Kỹ Năng Đã Khớp Chuẩn Tuyển Dụng ({(analysis.matched_skills ?? []).length})
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Các điểm sáng đã có trong hồ sơ của bạn được nhà tuyển dụng ghi nhận.
              </p>
              <div className="space-y-2.5">
                {(analysis.matched_skills ?? []).map((skill, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                      <span>{skill.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        {skill.category}
                      </span>
                    </div>
                    {skill.advice && (
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">{skill.advice}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Skills (AI Era Gap) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-500/20 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  Kỹ Năng Còn Thiếu Trọng Yếu ({(analysis.missing_skills ?? []).length})
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lỗ hổng khiến CV của bạn bị đánh giá thấp hoặc bị bot ATS lọc bỏ trong kỷ nguyên AI.
              </p>
              <div className="space-y-2.5">
                {(analysis.missing_skills ?? []).map((skill, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-rose-800 dark:text-rose-300">
                      <span>{skill.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300">
                        {skill.category}
                      </span>
                    </div>
                    {skill.advice && (
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">{skill.advice}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Plan & Learning Roadmap */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-500" />
                Lộ Trình Bù Đắp Kỹ Năng Cấp Tốc Dành Cho Sinh Viên
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Kế hoạch hành động từng bước để biến các kỹ năng còn thiếu thành thế mạnh trong vòng 2-4 tuần.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(analysis.action_plan ?? []).map((plan, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                    {i + 1}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {plan.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {plan.description}
                  </p>
                  {plan.learning_resources && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                      <strong className="block text-slate-700 dark:text-slate-300 mb-1">Tài nguyên gợi ý:</strong>
                      <ul className="list-disc list-inside space-y-0.5">
                        {plan.learning_resources.map((res, rIdx) => (
                          <li key={rIdx}>{res}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {plan.youtube_search_url && (
                    <a
                      href={plan.youtube_search_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                    >
                      <CirclePlay className="w-3.5 h-3.5" />
                      Xem video hướng dẫn trên YouTube
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Next CTA to view Generated CV */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Hệ thống đã tự động tích hợp các kỹ năng thiếu này vào bản CV mới của bạn!
                </span>
              </div>
              <button
                onClick={() => setActiveTab('generated_cv')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                Xem Bản CV Mới Ngay
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Generated Enhanced CV */}
      {activeTab === 'generated_cv' && (
        <div>
          {analysis.generated_cv_json ? (
            <GeneratedCVView
              cvData={analysis.generated_cv_json}
              targetJob={analysis.target_job_title ?? analysis.targetJobTitle ?? ''}
            />
          ) : (
            <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Báo cáo này chưa có bản CV mẫu đã cải thiện.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tính năng này chỉ áp dụng cho tài khoản Plus tại thời điểm phân tích. Nâng cấp lên Plus rồi phân tích lại để nhận bản CV mẫu.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
