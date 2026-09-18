import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Crown, ArrowRight } from 'lucide-react';
import { confirmVnpayReturn, type VnpayReturnResult } from '../api/payment';
import { useAuth } from '../contexts/AuthContext';

/**
 * VNPay redirects the user's browser here (see VNPAY_RETURN_URL) with a
 * signed query string. We forward that exact query string to the backend,
 * which re-verifies the HMAC-SHA512 signature before upgrading the account —
 * this page only ever displays the backend's verdict, it never decides
 * success on its own.
 */
export const VnpayReturnPage: React.FC = () => {
  const [result, setResult] = useState<VnpayReturnResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshUser } = useAuth();

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await confirmVnpayReturn(window.location.search);
        setResult(data);
        if (data.success) {
          await refreshUser();
        }
      } catch (e) {
        setResult({
          success: false,
          status: 'failed',
          message: 'Không thể xác minh giao dịch với máy chủ. Vui lòng liên hệ hỗ trợ nếu tiền đã bị trừ.',
          txn_ref: '',
        });
      } finally {
        setIsLoading(false);
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
        {isLoading ? (
          <>
            <Loader2 className="w-12 h-12 mx-auto text-indigo-500 animate-spin" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Đang xác minh giao dịch VNPay...
            </h2>
            <p className="text-xs text-slate-500">Vui lòng không đóng trang này.</p>
          </>
        ) : result?.success ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Thanh toán thành công!</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{result.message}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Crown className="w-3.5 h-3.5" /> Tài khoản đã lên Gói Plus
            </div>
            <Link
              to="/analyze"
              className="mt-2 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 transition-all"
            >
              Bắt đầu phân tích CV <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 flex items-center justify-center">
              <XCircle className="w-9 h-9 text-rose-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Thanh toán không thành công</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {result?.message || 'Giao dịch đã bị huỷ hoặc chữ ký không hợp lệ.'}
            </p>
            <Link
              to="/pricing"
              className="mt-2 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 transition-all"
            >
              Thử lại
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
