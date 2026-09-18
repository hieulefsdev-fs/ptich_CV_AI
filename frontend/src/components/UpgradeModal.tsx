import React, { useRef, useState } from 'react';
import { Crown, Check, X, Zap, ShieldCheck, QrCode } from 'lucide-react';
import { createVnpayPayment } from '../api/payment';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  // Subtle 3D tilt that follows the cursor — purely cosmetic, no external assets.
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 8 });
  };
  const resetTilt = () => setTilt({ x: 0, y: 0 });

  // Redirects the browser to the real, signed VNPay sandbox payment page.
  // The account is only ever upgraded server-side, after VNPay redirects
  // back to /payment/vnpay-return with a verified signature.
  const handlePayWithVnpay = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const order = await createVnpayPayment();
      window.location.href = order.payment_url;
    } catch (e) {
      setErrorMsg('Không thể khởi tạo giao dịch VNPay. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  const handleShowQr = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const order = await createVnpayPayment();
      setQrCodeUrl(order.qr_code_url);
    } catch (e) {
      setErrorMsg('Không thể tạo mã QR thanh toán. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" style={{ perspective: '1200px' }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 120ms ease-out',
        }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 overflow-hidden"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3" style={{ transform: 'translateZ(30px)' }}>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Crown className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Nâng Cấp Gói <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">PLUS VÔ HẠN</span>
          </h3>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            25.000<span className="text-base font-bold text-slate-500">đ / tài khoản</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Thanh toán một lần duy nhất qua VNPay, mở khoá phân tích CV không giới hạn.
          </p>
        </div>

        <div className="mt-6 space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          {[
            'Phân tích CV không giới hạn số lượt (Gói Free tối đa 3 lần)',
            'Tự động sinh CV hoàn chỉnh bổ sung kỹ năng thiếu chuẩn ATS',
            'Tối ưu hóa từ khóa AI Tools giúp sinh viên cạnh tranh vượt trội',
            'Xuất PDF không giới hạn & lưu trữ toàn bộ lịch sử',
          ].map((line) => (
            <div key={line} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>{line}</span>
            </div>
          ))}
        </div>

        {errorMsg && (
          <p className="mt-4 text-xs font-semibold text-rose-500">{errorMsg}</p>
        )}

        {qrCodeUrl && (
          <div className="mt-5 flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <img src={qrCodeUrl} alt="Mã QR thanh toán VNPay 25.000đ" className="w-40 h-40 rounded-xl bg-white p-2" />
            <p className="text-[11px] text-slate-500 text-center">
              Quét bằng app ngân hàng hỗ trợ VietQR để thanh toán 25.000đ, sau đó bấm "Tôi đã thanh toán" bên dưới để làm mới trạng thái tài khoản.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2" style={{ transform: 'translateZ(20px)' }}>
          <button
            onClick={handlePayWithVnpay}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-white" />
                THANH TOÁN 25.000Đ QUA VNPAY
              </>
            )}
          </button>
          <button
            onClick={handleShowQr}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Hoặc quét mã QR ngân hàng
          </button>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Giao dịch được ký và xác thực HMAC-SHA512 bởi VNPay
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Để sau, tôi sẽ nâng cấp sau
          </button>
        </div>
      </div>
    </div>
  );
};
