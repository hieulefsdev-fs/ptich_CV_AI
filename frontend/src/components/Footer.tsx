import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Shield, Award, GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-300 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: About */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                AI CAREER COACH
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              Giải pháp tối ưu hóa hồ sơ năng lực và định hướng kỹ năng thực chiến chuẩn ATS dành cho sinh viên,
              giúp cử nhân tự tin vượt qua rào cản tuyển dụng và tìm kiếm việc làm trong kỷ nguyên chuyển dịch số và AI.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-500" /> Chuẩn ATS Quốc Tế</span>
              <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-blue-500" /> Bổ Sung Kỹ Năng Thiếu</span>
              <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-violet-500" /> Vì Sinh Viên Việt Nam</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Khám Phá
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/analyze" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Phân tích CV Chuẩn ATS
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Gói Miễn Phí & Gói Plus
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Quản lý CV đã phân tích
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Career Tracks */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Vị Trí Phổ Biến
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>Frontend Engineer (React/Next.js)</li>
              <li>Backend Engineer (Python/Node.js)</li>
              <li>AI / Data Science Specialist</li>
              <li>DevOps & Cloud Practitioner</li>
              <li>Product & Business Analyst</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <p>© {new Date().getFullYear()} AI Career Coach. Hệ thống phân tích CV thông minh.</p>
          <p className="flex items-center gap-1">
            Xây dựng với tâm huyết dành cho thế hệ sinh viên kỷ nguyên AI <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
