import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UpgradeModal } from '../components/UpgradeModal';
import {
  Crown,
  Check,
  Zap,
  Sparkles
} from 'lucide-react';

/** Cursor-reactive 3D tilt wrapper — cosmetic only, no external assets. */
const Tilt3D: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -5, y: px * 6 });
  };

  return (
    <div style={{ perspective: '1000px' }}>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 150ms ease-out',
        }}
        className={className}
      >
        {children}
      </div>
    </div>
  );
};

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Title */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-violet-400 border border-indigo-500/20">
          <Crown className="w-3.5 h-3.5" />
          Chính Sách Gói Dịch Vụ Minh Bạch
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Lựa Chọn Gói Phù Hợp Với Lộ Trình Của Bạn
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Cả hai phiên bản đều mang đến giá trị cốt lõi: <strong>Phân tích lỗ hổng kỹ năng</strong> và <strong>sinh bản CV hoàn chỉnh chuẩn ATS</strong> bổ sung kỹ năng thiếu.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {/* Free Plan */}
        <Tilt3D className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6 relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                GÓI MIỄN PHÍ
              </span>
              {user?.tier === 'free' && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full bg-emerald-500/10">
                  Đang sử dụng
                </span>
              )}
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">0 VNĐ</div>
              <p className="text-xs text-slate-500 mt-1">Dành cho sinh viên muốn thử nghiệm tối ưu CV</p>
            </div>

            <ul className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Giới hạn 3 lượt</strong> phân tích CV đối chiếu chuẩn ATS</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Tự động sinh CV hoàn chỉnh</strong> bổ sung các kỹ năng còn thiếu</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Báo cáo chẩn đoán điểm số ATS &amp; Lộ trình học 4 tuần</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>In ấn và xuất file văn bản / Markdown</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <button
              disabled
              className="w-full py-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default"
            >
              Gói Mặc Định Cho Mọi Tài Khoản Mới
            </button>
          </div>
        </Tilt3D>

        {/* Plus Plan */}
        <Tilt3D className="p-8 rounded-3xl bg-gradient-to-b from-white to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20 border-2 border-indigo-500/50 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-4 py-1 rounded-bl-2xl bg-indigo-500 text-slate-950 text-[11px] font-black uppercase tracking-wider">
            Khuyên Dùng Cho Mùa Tuyển Dụng
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-600 dark:text-violet-400 border border-indigo-500/30 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-violet-400" />
                GÓI PLUS VÔ HẠN
              </span>
              {user?.tier === 'plus' && (
                <span className="text-xs font-bold text-indigo-500 border border-indigo-500/30 px-2.5 py-0.5 rounded-full bg-indigo-500/10">
                  Gói hiện tại của bạn
                </span>
              )}
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                Vô Hạn Lượt
              </div>
              <p className="text-xs text-slate-500 mt-1">Dành cho sinh viên đang rải hồ sơ nhiều công ty khác nhau</p>
            </div>

            <ul className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5 font-bold">
                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Không giới hạn số lượt phân tích CV (Unlimited)</span>
              </li>
              <li className="flex items-start gap-2.5 font-bold">
                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Sinh không giới hạn bản CV mới theo từng JD công ty riêng biệt</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Định hướng bộ công cụ AI tối tân nhất giúp tăng 40% năng suất</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Xuất PDF và lưu trữ vĩnh viễn toàn bộ lịch sử phân tích</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            {user?.tier === 'plus' ? (
              <div className="w-full py-3 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-600 dark:text-violet-400 text-center border border-indigo-500/30 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Tài khoản của bạn đã kích hoạt gói Plus
              </div>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-violet-400 via-indigo-500 to-fuchsia-400 hover:from-indigo-300 hover:to-fuchsia-300 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                NÂNG CẤP LÊN GÓI PLUS NGAY
              </button>
            )}
          </div>
        </Tilt3D>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};
