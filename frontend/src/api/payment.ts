import api from './client';

export interface VnpayCreateResponse {
  payment_url: string;
  txn_ref: string;
  amount: number;
  qr_code_url: string;
  order_desc: string;
}

export interface VnpayReturnResult {
  success: boolean;
  status: 'completed' | 'failed';
  message: string;
  txn_ref: string;
  amount?: number;
  user_tier?: string;
}

/**
 * Creates a real, signed VNPay payment order for the 25.000đ Plus plan
 * and returns the sandbox payment URL to redirect the browser to.
 * No tier upgrade happens here — the backend only flips the user to
 * "plus" after VNPay redirects back with a verified signature.
 */
export async function createVnpayPayment(bankCode?: string): Promise<VnpayCreateResponse> {
  const res = await api.post<VnpayCreateResponse>('/payment/create-vnpay-url', {
    bank_code: bankCode || '',
    order_desc: 'Nang cap Goi Plus 25.000d - AI Career Coach',
  });
  return res.data;
}

/**
 * Called by the /payment/vnpay-return page after VNPay redirects the user
 * back with its signed query string. Forwards that exact query string to
 * the backend, which re-verifies the HMAC-SHA512 signature before granting
 * the upgrade — the frontend never decides success/failure on its own.
 */
export async function confirmVnpayReturn(queryString: string): Promise<VnpayReturnResult> {
  const res = await api.get<VnpayReturnResult>(`/payment/vnpay-return${queryString}`);
  return res.data;
}

/**
 * Triggers a browser download of the user's original, as-submitted CV file
 * for a given analysis. Requires the caller to already know (via
 * `has_original_cv`) that a file exists for this record.
 */
export async function downloadOriginalCv(analysisId: number, suggestedFilename?: string): Promise<void> {
  const res = await api.get(`/analysis/${analysisId}/original-cv`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = suggestedFilename || `cv_goc_${analysisId}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
