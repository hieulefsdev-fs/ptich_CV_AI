import React, { useMemo, useState } from 'react';
import type { PaymentOrderRecord } from '../../types';
import { paginate, relativeTime } from '../../utils/adminMetrics';
import type { CsvColumn, OrdersFilter } from '../../utils/adminMetrics';
import { Chip, CsvButton, EmptyState, Pager, SearchBox, td, th } from './ui';

const PAGE = 15;

const CSV: CsvColumn<PaymentOrderRecord>[] = [
  { label: 'Mã giao dịch', value: (o) => o.txnRef },
  { label: 'Email', value: (o) => o.userEmail },
  { label: 'Họ tên', value: (o) => o.userFullName },
  { label: 'Số tiền (VND)', value: (o) => o.amount },
  { label: 'Ngân hàng', value: (o) => o.vnpBankCode },
  { label: 'Trạng thái', value: (o) => o.status },
  { label: 'Khởi tạo', value: (o) => o.createdAt },
  { label: 'Thanh toán lúc', value: (o) => o.paidAt },
];

const PILL: Record<string, string> = {
  SUCCESS: 'bg-emerald-500/15 text-emerald-300',
  PENDING: 'bg-amber-500/15 text-amber-300',
  FAILED: 'bg-rose-500/15 text-rose-300',
};
const LABEL: Record<string, string> = { SUCCESS: 'Thành công', PENDING: 'Đang chờ', FAILED: 'Thất bại' };

interface Props {
  orders: PaymentOrderRecord[];
  filter: OrdersFilter;
  onFilter: (f: OrdersFilter) => void;
  now: number;
}

export const AdminOrders: React.FC<Props> = ({ orders, filter, onFilter, now }) => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      all: orders.length,
      SUCCESS: orders.filter((o) => o.status === 'SUCCESS').length,
      PENDING: orders.filter((o) => o.status === 'PENDING').length,
      FAILED: orders.filter((o) => o.status === 'FAILED').length,
    }),
    [orders],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => (filter === 'all' || o.status === filter) && (!q || o.txnRef.toLowerCase().includes(q) || o.userEmail.toLowerCase().includes(q) || (o.userFullName ?? '').toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, filter, query]);

  const revenue = rows.filter((o) => o.status === 'SUCCESS').reduce((s, o) => s + Number(o.amount), 0);
  const view = paginate(rows, page, PAGE);
  const go = (f: OrdersFilter) => { onFilter(f); setPage(1); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={filter === 'all'} onClick={() => go('all')} count={counts.all}>Tất cả</Chip>
        <Chip active={filter === 'SUCCESS'} onClick={() => go('SUCCESS')} count={counts.SUCCESS}>Thành công</Chip>
        <Chip active={filter === 'PENDING'} onClick={() => go('PENDING')} count={counts.PENDING}>Đang chờ</Chip>
        <Chip active={filter === 'FAILED'} onClick={() => go('FAILED')} count={counts.FAILED}>Thất bại</Chip>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Tìm theo mã giao dịch, email, họ tên…" />
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-500">
            Doanh thu trong bộ lọc: <b className="ml-1 text-sm text-amber-300 tabular-nums">{revenue.toLocaleString('vi-VN')} đ</b>
          </div>
          <CsvButton rows={rows} columns={CSV} filename={`giao-dich-${new Date(now).toISOString().slice(0, 10)}.csv`} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className={th}>Mã giao dịch</th>
                <th className={th}>Người dùng</th>
                <th className={`${th} text-right`}>Số tiền</th>
                <th className={th}>Ngân hàng</th>
                <th className={th}>Trạng thái</th>
                <th className={th}>Khởi tạo</th>
                <th className={th}>Thanh toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {view.rows.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className={`${td} font-mono text-xs text-indigo-300`}>{o.txnRef}</td>
                  <td className={td}>
                    <div className="font-semibold text-slate-100">{o.userFullName}</div>
                    <div className="text-xs text-slate-500 font-mono">{o.userEmail}</div>
                  </td>
                  <td className={`${td} text-right font-bold tabular-nums text-slate-100 whitespace-nowrap`}>{Number(o.amount).toLocaleString('vi-VN')} đ</td>
                  <td className={`${td} text-xs font-mono text-slate-500`}>{o.vnpBankCode || '—'}</td>
                  <td className={td}>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${PILL[o.status] ?? 'bg-slate-800 text-slate-300'}`}>{LABEL[o.status] ?? o.status}</span>
                  </td>
                  <td className={`${td} text-xs text-slate-500 whitespace-nowrap`} title={new Date(o.createdAt).toLocaleString('vi-VN')}>
                    {relativeTime(new Date(o.createdAt).getTime(), now)}
                  </td>
                  <td className={`${td} text-xs text-slate-500 whitespace-nowrap`}>{o.paidAt ? new Date(o.paidAt).toLocaleString('vi-VN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState text="Không có giao dịch nào khớp bộ lọc." />}
        </div>
        <Pager page={view.page} pageCount={view.pageCount} total={rows.length} size={PAGE} onPage={setPage} />
      </div>
    </div>
  );
};
