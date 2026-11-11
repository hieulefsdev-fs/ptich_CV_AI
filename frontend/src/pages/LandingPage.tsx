import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Target,
  AlertTriangle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

const TRENDING_ROLES = [
  'Frontend Developer (React/Next.js)',
  'Backend Developer (Python/FastAPI)',
  'AI / Machine Learning Engineer',
  'Fullstack Developer (Node/React)',
  'Data Analyst',
  'DevOps & Cloud Engineer',
  'Mobile Developer (Flutter/React Native)',
  'Business Analyst (BA)'
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchRole, setSearchRole] = useState('');

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRole.trim()) {
      navigate(`/analyze?job=${encodeURIComponent(searchRole.trim())}`);
    } else {
      navigate('/analyze');
    }
  };

  const handleSelectRole = (role: string) => {
    navigate(`/analyze?job=${encodeURIComponent(role)}`);
  };

  return (
    <div className="space-y-20 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-blue-600/20 blur-[130px] rounded-full pointer-events-none -z-10"></div>

        {/* Anti-Unemployment Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-black mb-6 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          CHỐNG THẤT NGHIỆP • KỶ NGUYÊN TRÍ TUỆ NHÂN TẠO (AI)
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto leading-[1.15]">
          Phân Tích CV Chuẩn ATS &amp; <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-300 dark:to-blue-400">
            Bổ Sung Kỹ Năng Thiếu
          </span> Cho Sinh Viên
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
          AI đang thay đổi hoàn toàn quy chuẩn tuyển dụng. Khám phá chính xác CV của bạn đang thiếu kỹ năng gì đối với vị trí mục tiêu, nhận điểm ATS tức thì và nhận ngay <strong>bản CV hoàn chỉnh tối ưu hóa</strong> sẵn sàng nộp đơn.
        </p>

        {/* Search / Target Job Form */}
        <div className="mt-10 max-w-2xl mx-auto">
          <form
            onSubmit={handleStartAnalysis}
            className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800"
          >
            <div className="flex-1 w-full px-3 py-2 flex items-center gap-3">
              <Target className="w-5 h-5 text-emerald-500 shrink-0" />
              <input
                type="text"
                placeholder="Nhập vị trí bạn muốn ứng tuyển (ví dụ: Frontend Developer)..."
                value={searchRole}
                onChange={(e) => setSearchRole(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm"
            >
              PHÂN TÍCH NGAY
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Trending Role Quick Tags */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Gợi ý nhanh:</span>
            {TRENDING_ROLES.slice(0, 4).map((role) => (
              <button
                key={role}
                onClick={() => handleSelectRole(role)}
                className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors border border-slate-200/60 dark:border-slate-800"
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Free Tier Guarantee Badge */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Miễn phí 3 lần phân tích CV đầu tiên</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Tự động sinh CV hoàn thiện chuẩn ATS</span>
          </div>
        </div>

        {/* 3D Hero Showcase: floating ATS score card with orbiting skill chips */}
        <div className="hero3d-scene mt-16 max-w-3xl mx-auto h-72 sm:h-80 relative hidden sm:block">
          <div className="hero3d-card absolute inset-x-0 top-4 mx-auto w-72 sm:w-80 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Báo cáo ATS</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">Đã tối ưu</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center shrink-0">
                <span className="text-2xl font-black text-slate-900 dark:text-white">92</span>
                <span className="text-[9px] font-bold text-slate-400">/ 100</span>
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="h-2 rounded-full bg-emerald-500/70 w-full"></div>
                <div className="h-2 rounded-full bg-emerald-500/40 w-4/5"></div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 w-2/3"></div>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Frontend Developer (React) — đã bổ sung 4 kỹ năng còn thiếu vào bản CV hoàn chỉnh.
            </p>
          </div>

          <div className="hero3d-chip absolute left-2 sm:left-8 top-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Docker
          </div>
          <div className="hero3d-chip-delayed absolute right-2 sm:right-6 top-10 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Tools
          </div>
          <div className="hero3d-chip absolute right-6 sm:right-16 bottom-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-blue-500" /> CI/CD
          </div>
          <div className="hero3d-chip-delayed absolute left-6 sm:left-16 bottom-6 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> ATS Ready
          </div>
        </div>
      </section>

      {/* The Problem & The Solution Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: The AI Reality for Fresh Grads */}
          <div className="p-8 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Thực trạng sinh viên ra trường trong kỷ nguyên AI
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span><strong>75% CV của sinh viên bị hệ thống ATS tự động loại</strong> ngay từ vòng hồ sơ vì thiếu từ khóa kỹ thuật chuyên sâu và số liệu định lượng.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span><strong>AI thay đổi yêu cầu tuyển dụng</strong>: Doanh nghiệp không còn cần người chỉ biết code cơ bản, họ đòi hỏi ứng viên biết dùng công cụ AI, kiểm thử, Docker, CI/CD.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span><strong>Mông lung về Skill Gap</strong>: Sinh viên không biết mình đang thiếu chính xác kỹ năng nào để tự học và bổ sung kịp thời.</span>
              </li>
            </ul>
          </div>

          {/* Right: How AI Career Coach Bridges the Gap */}
          <div className="p-8 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Giải pháp toàn diện từ AI Career Coach
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Chẩn đoán khuyết thiếu kỹ năng (Skill Gap)</strong>: Bóc tách từng kỹ năng cốt lõi và công cụ AI bạn còn thiếu đối chiếu trực tiếp với thị trường.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Sinh bản CV hoàn chỉnh mới</strong>: Tự động lồng ghép các kỹ năng thiếu vào các dự án mẫu và kinh nghiệm thực tế chuẩn công thức Google XYZ.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Cả bản Free và Plus đều nhận được CV</strong>: Cam kết hỗ trợ mọi sinh viên có được bộ hồ sơ năng lực sắc bén nhất để ứng tuyển.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Quy Trình 3 Bước Đơn Giản
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Chỉ mất chưa đầy 30 giây để nâng cấp toàn diện hồ sơ năng lực của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-emerald-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg">
              1
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Tải Lên CV Của Bạn
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Hỗ trợ tệp PDF, DOCX hoặc dán trực tiếp nội dung văn bản. Chọn vị trí việc làm bạn mong muốn chinh phục.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-blue-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-lg">
              2
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              AI Quét Điểm ATS &amp; Lỗ Hổng
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Nhận điểm số ATS chuẩn xác, bảng ma trận phân loại kỹ năng đã có vs kỹ năng còn thiếu và lộ trình học tập 4 tuần.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-violet-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-lg">
              3
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Nhận CV Hoàn Thiện &amp; Xuất PDF
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              AI viết lại một bản CV hoàn thiện đã bù đắp kỹ năng còn thiếu. Bạn có thể in, xuất PDF hoặc sao chép ngay lập tức.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Preview */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                CHÍNH SÁCH RÕ RÀNG
              </span>
              <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
                Gói Miễn Phí (Free) vs Gói Vô Hạn (Plus)
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Chúng tôi tôn trọng sinh viên: Tài khoản Free được tặng sẵn 3 lượt phân tích. Sau 3 lượt, bạn có thể kích hoạt gói Plus để tiếp tục tối ưu hóa không giới hạn.
              </p>
              <div className="pt-2">
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all"
                >
                  Xem Bảng Giá &amp; Kích Hoạt
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="space-y-3 bg-white/5 p-6 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-sm">
                <span className="text-slate-300">Tính năng</span>
                <span className="font-bold text-emerald-400">Free / Plus</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span>Số lượt phân tích CV</span>
                <span className="font-bold">3 lượt / Vô hạn</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span>Phát hiện kỹ năng còn thiếu</span>
                <span className="font-bold text-emerald-400">Có (Cả 2 bản)</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span>Sinh bản CV hoàn chỉnh chuẩn ATS</span>
                <span className="font-bold text-emerald-400">Có (Cả 2 bản)</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span>Xuất PDF và In ấn</span>
                <span className="font-bold text-emerald-400">Không giới hạn</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="text-center px-4 max-w-3xl mx-auto space-y-6">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Đừng để CV của bạn bị loại bỏ bởi các thuật toán ATS
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Gia nhập cùng hàng ngàn sinh viên tự tin bước vào thị trường việc làm với bộ hồ sơ được chuẩn hóa bởi AI.
        </p>
        <div>
          <Link
            to={user ? '/analyze' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-base text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 shadow-xl shadow-emerald-600/30 hover:scale-105 transition-all"
          >
            BẮT ĐẦU PHÂN TÍCH MIỄN PHÍ NGAY
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};
