/**
 * Pure helpers behind the admin console: time bucketing, histograms, rankings,
 * "needs attention" rules, activity feed and CSV export. No React, no I/O,
 * so they can be reasoned about (and tested) on their own.
 */

export interface DayBucket {
  start: number;
  label: string;
  value: number;
}

const toTime = (iso?: string | null): number => {
  if (!iso) return NaN;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? NaN : t;
};

export const startOfDay = (t: number): number => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const dayStarts = (days: number, now: number): number[] => {
  const today = new Date(startOfDay(now));
  const starts: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    starts.push(d.getTime());
  }
  return starts;
};

const label = (t: number): string => {
  const d = new Date(t);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Sum `amount` of each event into the last `days` calendar days (today included, oldest first). */
export function dailySums(events: { time: number; amount: number }[], days: number, now: number): DayBucket[] {
  const starts = dayStarts(days, now);
  const buckets: DayBucket[] = starts.map((s) => ({ start: s, label: label(s), value: 0 }));
  for (const e of events) {
    if (Number.isNaN(e.time)) continue;
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (e.time >= buckets[i].start) {
        // beyond "now" (clock skew) still counts toward today
        buckets[i].value += e.amount;
        break;
      }
    }
  }
  return buckets;
}

export function dailyCounts(isoTimes: (string | null | undefined)[], days: number, now: number): DayBucket[] {
  return dailySums(
    isoTimes.map((iso) => ({ time: toTime(iso), amount: 1 })),
    days,
    now,
  );
}

export interface HistogramBin {
  label: string;
  min: number;
  max: number;
  count: number;
}

export function scoreHistogram(scores: (number | null | undefined)[]): HistogramBin[] {
  const bins: HistogramBin[] = [
    { label: '0–19', min: 0, max: 19, count: 0 },
    { label: '20–39', min: 20, max: 39, count: 0 },
    { label: '40–59', min: 40, max: 59, count: 0 },
    { label: '60–79', min: 60, max: 79, count: 0 },
    { label: '80–100', min: 80, max: 100, count: 0 },
  ];
  for (const s of scores) {
    if (s === null || s === undefined || Number.isNaN(s)) continue;
    const v = Math.min(100, Math.max(0, Math.round(s)));
    const bin = bins.find((b) => v >= b.min && v <= b.max);
    if (bin) bin.count++;
  }
  return bins;
}

export interface JobStat {
  title: string;
  count: number;
  avgScore: number;
}

const jobKey = (title: string): string =>
  title
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/[/&|,;:+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** Most-targeted jobs. "Backend Developer (Java)" and "backend developer" count as one. */
export function topJobs(rows: { targetJobTitle: string; atsScore: number | null }[], limit: number): JobStat[] {
  const groups = new Map<string, { title: string; count: number; sum: number; scored: number }>();
  for (const r of rows) {
    const key = jobKey(r.targetJobTitle ?? '');
    if (!key) continue;
    const g = groups.get(key) ?? { title: (r.targetJobTitle ?? '').replace(/\s+/g, ' ').trim(), count: 0, sum: 0, scored: 0 };
    g.count++;
    if (typeof r.atsScore === 'number') {
      g.sum += r.atsScore;
      g.scored++;
    }
    groups.set(key, g);
  }
  return Array.from(groups.values())
    .map((g) => ({ title: g.title, count: g.count, avgScore: g.scored ? Math.round(g.sum / g.scored) : 0 }))
    .sort((a, b) => b.count - a.count || b.avgScore - a.avgScore)
    .slice(0, limit);
}

export const percent = (part: number, whole: number): number => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export const average = (nums: number[]): number => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);

// ---------- "needs attention" ----------

export type UsersFilter = 'all' | 'free' | 'plus' | 'locked' | 'unverified' | 'quota';
export type OrdersFilter = 'all' | 'SUCCESS' | 'PENDING' | 'FAILED';

export interface AttentionItem {
  id: string;
  tone: 'info' | 'warn' | 'danger';
  title: string;
  detail: string;
  count: number;
  tab: 'users' | 'orders';
  filter: UsersFilter | OrdersFilter;
}

interface AttUser {
  tier: string;
  cvQuotaUsed: number;
  maxFreeQuota: number;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
}
interface AttOrder {
  status: string;
  createdAt: string;
}

const HOUR = 3_600_000;

export const isQuotaExhausted = (u: AttUser): boolean => u.tier === 'free' && u.cvQuotaUsed >= u.maxFreeQuota;

export function attentionItems(users: AttUser[], orders: AttOrder[], now: number): AttentionItem[] {
  const items: AttentionItem[] = [];

  const abandoned = orders.filter((o) => o.status === 'PENDING' && now - toTime(o.createdAt) > 0.5 * HOUR).length;
  if (abandoned > 0) {
    items.push({
      id: 'orders-pending',
      tone: 'warn',
      title: 'Giao dịch treo ở trạng thái PENDING',
      detail: 'Khởi tạo thanh toán hơn 30 phút nhưng chưa có kết quả (khách bỏ giữa chừng hoặc không nhận được callback).',
      count: abandoned,
      tab: 'orders',
      filter: 'PENDING',
    });
  }

  const failedRecently = orders.filter((o) => o.status === 'FAILED' && now - toTime(o.createdAt) <= 7 * 24 * HOUR).length;
  if (failedRecently > 0) {
    items.push({
      id: 'orders-failed',
      tone: 'danger',
      title: 'Giao dịch thất bại trong 7 ngày qua',
      detail: 'Nên kiểm tra xem có lỗi cấu hình VNPay hay chỉ là khách huỷ thanh toán.',
      count: failedRecently,
      tab: 'orders',
      filter: 'FAILED',
    });
  }

  const quota = users.filter((u) => u.isActive !== false && isQuotaExhausted(u)).length;
  if (quota > 0) {
    items.push({
      id: 'users-quota',
      tone: 'info',
      title: 'Người dùng Free đã hết lượt miễn phí',
      detail: 'Nhóm có khả năng nâng cấp Plus cao nhất.',
      count: quota,
      tab: 'users',
      filter: 'quota',
    });
  }

  const unverified = users.filter((u) => u.isVerified === false && now - toTime(u.createdAt) > 24 * HOUR).length;
  if (unverified > 0) {
    items.push({
      id: 'users-unverified',
      tone: 'warn',
      title: 'Đăng ký quá 24 giờ chưa xác thực OTP',
      detail: 'Có thể không nhận được email OTP — thử kiểm tra cấu hình Gmail SMTP.',
      count: unverified,
      tab: 'users',
      filter: 'unverified',
    });
  }

  const locked = users.filter((u) => u.isActive === false).length;
  if (locked > 0) {
    items.push({
      id: 'users-locked',
      tone: 'info',
      title: 'Tài khoản đang bị khoá',
      detail: 'Xem lại danh sách để mở khoá những trường hợp không còn cần chặn.',
      count: locked,
      tab: 'users',
      filter: 'locked',
    });
  }

  return items;
}

// ---------- activity feed ----------

export interface ActivityEvent {
  key: string;
  time: number;
  kind: 'signup' | 'analysis' | 'order';
  title: string;
  detail: string;
  tone: 'neutral' | 'good' | 'bad' | 'warn';
}

export function activityFeed(
  users: { id: number; email: string; fullName: string; createdAt?: string }[],
  analyses: { id: number; userEmail: string; targetJobTitle: string; atsScore: number | null; createdAt: string }[],
  orders: { id: number; userEmail: string; amount: number; status: string; createdAt: string; paidAt?: string }[],
  limit: number,
): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const u of users) {
    const time = toTime(u.createdAt);
    if (!Number.isNaN(time)) {
      events.push({ key: `u${u.id}`, time, kind: 'signup', title: `${u.fullName || u.email} vừa đăng ký`, detail: u.email, tone: 'neutral' });
    }
  }
  for (const a of analyses) {
    const time = toTime(a.createdAt);
    if (!Number.isNaN(time)) {
      events.push({
        key: `a${a.id}`,
        time,
        kind: 'analysis',
        title: `Phân tích CV cho “${a.targetJobTitle}”`,
        detail: `${a.userEmail} · ${a.atsScore ?? '--'}/100`,
        tone: 'neutral',
      });
    }
  }
  for (const o of orders) {
    const time = toTime(o.status === 'SUCCESS' && o.paidAt ? o.paidAt : o.createdAt);
    if (Number.isNaN(time)) continue;
    const money = `${Number(o.amount).toLocaleString('vi-VN')} đ`;
    events.push({
      key: `o${o.id}`,
      time,
      kind: 'order',
      title: o.status === 'SUCCESS' ? `Thanh toán thành công ${money}` : o.status === 'PENDING' ? `Khởi tạo thanh toán ${money}` : `Thanh toán thất bại ${money}`,
      detail: o.userEmail,
      tone: o.status === 'SUCCESS' ? 'good' : o.status === 'PENDING' ? 'warn' : 'bad',
    });
  }

  return events.sort((a, b) => b.time - a.time).slice(0, limit);
}

export function relativeTime(t: number, now: number): string {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return 'vừa xong';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.round(h / 24);
  return `${d} ngày trước`;
}

// ---------- paging ----------

export function paginate<T>(items: T[], page: number, size: number): { rows: T[]; pageCount: number; page: number } {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const safe = Math.min(Math.max(1, page), pageCount);
  return { rows: items.slice((safe - 1) * size, safe * size), pageCount, page: safe };
}

// ---------- CSV ----------

export interface CsvColumn<T> {
  label: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * RFC-4180 style CSV. String cells that start with = + - @ (which Excel/Sheets would run as
 * formulas — and names/job titles are user-controlled) get a leading apostrophe.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const cell = (v: string | number | boolean | null | undefined): string => {
    if (v === null || v === undefined) return '';
    let s = typeof v === 'string' ? v : String(v);
    if (typeof v === 'string' && FORMULA_START.test(s)) s = `'${s}`;
    if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map((c) => cell(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => cell(c.value(r))).join(','));
  return [header, ...body].join('\r\n');
}

/**
 * Round a chart maximum up to a clean value (1, 1.5, 2, 3, 4, 5, 6, 8 × 10^k) so the axis
 * ends on a readable number without leaving half the plot empty (21 -> 30, not 50).
 */
export function niceMax(max: number): number {
  if (!Number.isFinite(max) || max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  const step = [1, 1.5, 2, 3, 4, 5, 6, 8, 10].find((x) => n <= x + 1e-9) ?? 10;
  return Math.round(step * pow * 1e6) / 1e6;
}
