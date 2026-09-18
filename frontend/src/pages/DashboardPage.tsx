import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { UpgradeModal } from '../components/UpgradeModal';
import {
  UploadCloud,
  FileText,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Crown,
  Zap,
  Target
} from 'lucide-react';

const SAMPLE_CV_TEXT = `NGUYỄN VĂN HẢI
Email: hai.nguyen.it@dau.edu.vn | Số điện thoại: 0912.345.678
Địa chỉ: Đà Nẵng, Việt Nam | GitHub: github.com/hainguyen-dev

MỤC TIÊU NGHỀ NGHIỆP:
Sinh viên năm cuối ngành Công nghệ Thông tin tại Đại học Kiến Trúc Đà Nẵng (DAU). Mong muốn tìm kiếm cơ hội thực tập / Fresher tại vị trí kỹ sư phần mềm để trau dồi kỹ năng thực chiến và cống hiến cho công ty.

HỌC VẤN:
- Trường Đại học Kiến Trúc Đà Nẵng (2021 - 2025)
- Chuyên ngành: Công nghệ Thông tin
- Điểm trung bình tích lũy: 3.2 / 4.0

KỸ NĂNG:
- Lập trình: HTML, CSS, JavaScript, ReactJS cơ bản, Java căn bản
- Cơ sở dữ liệu: MySQL cơ bản
- Công cụ: Git, VS Code

DỰ ÁN ĐÃ THỰC HIỆN:
1. Website Thương Mại Điện Tử Mini (Đồ án môn học):
- Xây dựng giao diện xem sản phẩm, giỏ hàng bằng React.
- Viết API đơn giản với Node.js và MySQL để lưu trữ sản phẩm.
- Tham gia thiết kế cơ sở dữ liệu và kết nối frontend với backend.

2. Ứng Dụng Quản Lý Sinh Viên:
- Viết bằng Java Swing kết nối cơ sở dữ liệu SQL Server.
- Có chức năng thêm, sửa, xóa, tìm kiếm thông tin sinh viên.`;

const COMMON_JOB_OPTIONS = [
  'Frontend Developer (React / TypeScript)',
  'Backend Developer (Java Spring Boot / Node.js)',
  'Fullstack Developer (React & Java/Python)',
  'AI / Machine Learning Engineer',
  'Data Analyst / Data Engineer',
  'DevOps & Cloud Engineer',
  'Mobile App Developer (Flutter / React Native)',
  'QA / Tester Automation'
];

export const DashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [targetJob, setTargetJob] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const jobParam = searchParams.get('job');
    if (jobParam) {
      setTargetJob(jobParam);
    } else if (!targetJob) {
      setTargetJob('Frontend Developer (React / TypeScript)');
    }
  }, [searchParams]);

  // Safe fallback for quota properties (supports both camelCase and snake_case)
  const quotaUsed = user?.cvQuotaUsed ?? (user as any)?.cv_quota_used ?? 0;
  const maxQuota = user?.maxFreeQuota ?? (user as any)?.max_free_quota ?? 3;
  const quotaRemaining = user?.tier === 'plus' ? null : Math.max(0, maxQuota - quotaUsed);
  const isFreeLimitReached = user?.tier === 'free' && quotaRemaining === 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['.pdf', '.docx', '.doc', '.txt'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validTypes.includes(ext)) {
        setErrorMsg('Vui lòng tải lên file định dạng .pdf, .docx hoặc .txt');
        return;
      }
      setSelectedFile(file);
      setErrorMsg('');
    }
  };

  const handleLoadSampleCV = () => {
    setInputMode('text');
    setCvText(SAMPLE_CV_TEXT);
    setTargetJob('Frontend Developer (React / TypeScript)');
    setJobDescription('Tuyển dụng Frontend Developer React, TypeScript, Tailwind CSS, hiểu biết tối ưu hiệu năng web và các công cụ AI trong lập trình.');
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isFreeLimitReached) {
      setShowUpgradeModal(true);
      return;
    }

    if (!targetJob.trim()) {
      setErrorMsg('Vui lòng nhập vị trí việc làm mong muốn.');
      return;
    }

    if (inputMode === 'upload' && !selectedFile) {
      setErrorMsg('Vui lòng chọn tệp CV của bạn (PDF hoặc DOCX).');
      return;
    }

    if (inputMode === 'text' && (!cvText || cvText.trim().length < 50)) {
      setErrorMsg('Nội dung CV dán trực tiếp phải có tối thiểu 50 ký tự.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep('Đang trích xuất nội dung văn bản từ hồ sơ...');

    try {
      const formData = new FormData();
      formData.append('target_job_title', targetJob.trim());
      if (jobDescription.trim()) {
        formData.append('target_job_description', jobDescription.trim());
      }

      if (inputMode === 'upload' && selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('cv_text', cvText.trim());
      }

      setTimeout(() => {
        setAnalysisStep('Đang quét từ khóa và tính toán điểm ATS...');
      }, 800);

      setTimeout(() => {
        setAnalysisStep('Đang bóc tách kỹ năng còn thiếu & cơ hội việc làm kỷ nguyên AI...');
      }, 1600);

      setTimeout(() => {
        setAnalysisStep('Đang sinh bản CV hoàn chỉnh chuẩn ATS tối ưu hóa...');
      }, 2400);

      const res = await api.post('/analysis/analyze', formData);

      await refreshUser();
      navigate(`/report/${res.data.id}`);
    } catch (err: any) {
      setIsAnalyzing(false);
      if (err.response?.status === 403) {
        setShowUpgradeModal(true);
      } else {
        setErrorMsg(err.response?.data?.detail || err.response?.data?.error || 'Quá trình phân tích thất bại. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Không gian phân tích hồ sơ thông minh
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Trung Tâm Phân Tích &amp; Tối Ưu CV Chuẩn ATS
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Đo lường mức độ phù hợp với tiêu chuẩn tuyển dụng, tìm ra kỹ năng thiếu và nhận CV mới hoàn thiện.
          </p>
        </div>

        {/* Quota Indicator Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 shrink-0">
          <div className={`p-2.5 rounded-xl ${user?.tier === 'plus' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
            <Crown className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              {user?.tier === 'plus' ? 'Tài Khoản Gói Plus' : 'Tài Khoản Gói Miễn Phí'}
            </div>
            <div className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {user?.tier === 'plus' ? (
                <span className="text-amber-500 font-bold">Phân tích vô hạn lượt</span>
              ) : (
                <span>Còn lại: <strong className="text-emerald-600 dark:text-emerald-400">{quotaRemaining}/{maxQuota}</strong> lượt</span>
              )}
            </div>
          </div>
          {user?.tier === 'free' && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="ml-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
            >
              Nâng cấp
            </button>
          )}
        </div>
      </div>

      {/* Quota Exhausted Warning */}
      {isFreeLimitReached && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bạn đã sử dụng hết {maxQuota}/{maxQuota} lượt phân tích CV của gói Miễn Phí!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Kích hoạt gói Plus ngay hôm nay để phân tích không giới hạn và sinh thêm nhiều bản CV theo từng công ty khác nhau.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all whitespace-nowrap"
          >
            Mở Khóa Gói Plus Ngay
          </button>
        </div>
      )}

      {/* Main Analysis Form */}
      <form onSubmit={handleAnalyze} className="space-y-6">
        {/* Step 1: Target Role & JD */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">
                1
              </span>
              Vị Trí Việc Làm Mong Muốn
            </h3>
            <button
              type="button"
              onClick={handleLoadSampleCV}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              Tải CV sinh viên mẫu để thử nghiệm nhanh
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Tên Vị Trí / Chuyên Ngành Bạn Muốn Ứng Tuyển
            </label>
            <div className="relative">
              <Target className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                placeholder="Ví dụ: Frontend Developer, Backend Java, AI Engineer..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>

            {/* Quick role suggestions */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {COMMON_JOB_OPTIONS.slice(0, 4).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetJob(role)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    targetJob === role
                      ? 'bg-emerald-500 text-white border-emerald-500 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Mô Tả Công Việc Của Doanh Nghiệp (Job Description - JD) <span className="text-slate-400 font-normal lowercase">(không bắt buộc)</span>
            </label>
            <textarea
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Dán nội dung tin tuyển dụng (JD) từ TopCV, VietnamWorks, LinkedIn để đối chiếu chính xác nhất..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Step 2: Upload or Paste CV */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">
                2
              </span>
              Hồ Sơ CV Của Bạn
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  inputMode === 'upload'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Tải lên tệp
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  inputMode === 'text'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Dán nội dung CV
              </button>
            </div>
          </div>

          {inputMode === 'upload' ? (
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-950/50">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-3 pointer-events-none">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                {selectedFile ? (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/40 inline-flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Kéo thả tệp CV hoặc <span className="text-emerald-600 dark:text-emerald-400">chọn từ máy tính</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Định dạng hỗ trợ: PDF, DOCX, TXT (Tối đa 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div>
              <textarea
                rows={8}
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Dán toàn bộ nội dung CV của bạn vào đây (Bao gồm thông tin học vấn, kỹ năng, các dự án đã làm)..."
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Button & Progress Indicator */}
        <div className="pt-2">
          {isAnalyzing ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/30 text-center space-y-4 shadow-xl">
              <div className="relative w-16 h-16 mx-auto">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
                <Sparkles className="w-6 h-6 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Hệ thống AI đang xử lý hồ sơ của bạn...
                </h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                  {analysisStep}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isFreeLimitReached}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base text-white shadow-xl transition-all flex items-center justify-center gap-2.5 ${
                isFreeLimitReached
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-[1.01]'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              TIẾN HÀNH PHÂN TÍCH VÀ TẠO BẢN CV HOÀN CHỈNH
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          refreshUser();
        }}
      />
    </div>
  );
};
