// Veri modeli, para ve tarih hesaplamaları.
// Burada DOM yok; her fonksiyon saf hesap yapar.

export const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP'];

export const CURRENCY_SYMBOL = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

// Fatura döngüsü: interval sayısı + birim.
export const UNITS = {
  day: { label: 'gün', perYear: 365 },
  week: { label: 'hafta', perYear: 365 / 7 },
  month: { label: 'ay', perYear: 12 },
  year: { label: 'yıl', perYear: 1 },
};

export const CATEGORIES = [
  'Eğlence',
  'Müzik',
  'Yazılım',
  'Oyun',
  'Barınma',
  'İletişim',
  'Sağlık & Spor',
  'Eğitim',
  'Haber & Yayın',
  'Bulut & Depolama',
  'Diğer',
];

export const STATUS = {
  active: 'Aktif',
  trial: 'Deneme',
  cancelled: 'İptal edildi',
};

export function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function newSubscription(patch = {}) {
  return {
    id: uid(),
    name: '',
    amount: 0,
    currency: 'TRY',
    interval: 1,
    unit: 'month',
    anchorDate: todayISO(), // ilk ödeme tarihi
    category: 'Diğer',
    status: 'active',
    trialEnd: '',
    paymentMethod: '',
    url: '',
    note: '',
    color: pickColor(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...patch,
  };
}

// Antrasit arayüzle uyumlu, bastırılmış tonlar: griye yakın ama
// abonelikleri birbirinden ayırmaya yetecek kadar farklı.
const PALETTE = [
  '#c9ccd1', '#9aa0a6', '#7d8590', '#a68b8b', '#a6957f',
  '#9aa68b', '#8ba69f', '#8b95a6', '#9a8ba6', '#a68b9a',
];

export function pickColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

export { PALETTE };

/* ---------------- Tarih yardımcıları ---------------- */

// Yerel saat diliminde YYYY-MM-DD. (toISOString UTC'ye kaydırdığı için kullanılmıyor.)
export function todayISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function parseISO(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function addPeriod(date, interval, unit) {
  const d = new Date(date.getTime());
  const n = Math.max(1, Number(interval) || 1);
  switch (unit) {
    case 'day':
      d.setDate(d.getDate() + n);
      break;
    case 'week':
      d.setDate(d.getDate() + n * 7);
      break;
    case 'year':
      d.setFullYear(d.getFullYear() + n);
      break;
    case 'month':
    default: {
      // Ayın 31'i gibi tarihlerde taşmayı önle: 31 Ocak + 1 ay -> 28/29 Şubat.
      const day = d.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + n);
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, last));
      break;
    }
  }
  return d;
}

// Bugünden sonraki (veya bugüne eşit) ilk ödeme tarihi.
export function nextPaymentDate(sub, from = new Date()) {
  const anchor = parseISO(sub.anchorDate);
  if (!anchor) return null;
  const ref = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let d = new Date(anchor.getTime());
  if (d >= ref) return d;

  // Aylık/yıllık için doğrudan atla, sonra ince ayar yap (uzun döngüden kaçınmak için).
  const unitPerYear = UNITS[sub.unit]?.perYear ?? 12;
  const periodDays = 365 / unitPerYear * Math.max(1, Number(sub.interval) || 1);
  const behind = Math.floor((ref - d) / 86400000 / periodDays);
  if (behind > 0) {
    for (let i = 0; i < behind; i++) d = addPeriod(d, sub.interval, sub.unit);
  }
  let guard = 0;
  while (d < ref && guard++ < 1000) d = addPeriod(d, sub.interval, sub.unit);
  return d;
}

export function daysUntil(date, from = new Date()) {
  if (!date) return null;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((b - a) / 86400000);
}

export function formatDate(date) {
  if (!date) return '—';
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(date) {
  if (!date) return '—';
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

/* ---------------- Para hesapları ---------------- */

// Kur tablosu: 1 birim yabancı para kaç TRY eder.
export function convert(amount, from, to, rates) {
  if (from === to) return amount;
  const inTRY = from === 'TRY' ? amount : amount * (rates[from] || 0);
  if (to === 'TRY') return inTRY;
  const rate = rates[to] || 0;
  return rate ? inTRY / rate : 0;
}

export function yearlyCost(sub) {
  const perYear = UNITS[sub.unit]?.perYear ?? 12;
  const n = Math.max(1, Number(sub.interval) || 1);
  return (Number(sub.amount) || 0) * (perYear / n);
}

export function monthlyCost(sub) {
  return yearlyCost(sub) / 12;
}

export function monthlyIn(sub, target, rates) {
  return convert(monthlyCost(sub), sub.currency, target, rates);
}

export function yearlyIn(sub, target, rates) {
  return convert(yearlyCost(sub), sub.currency, target, rates);
}

export function formatMoney(value, currency, opts = {}) {
  const v = Number(value) || 0;
  const digits = opts.digits ?? (Math.abs(v) >= 1000 ? 0 : 2);
  try {
    return v.toLocaleString('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  } catch {
    return `${v.toFixed(digits)} ${currency}`;
  }
}

// Toplamlar yalnızca ödemesi süren abonelikleri kapsar.
export function isCounted(sub) {
  return sub.status === 'active' || sub.status === 'trial';
}

export function summarize(subs, target, rates) {
  const counted = subs.filter(isCounted);
  let monthly = 0;
  for (const s of counted) monthly += monthlyIn(s, target, rates);
  return {
    monthly,
    yearly: monthly * 12,
    count: counted.length,
    total: subs.length,
  };
}

export function byCategory(subs, target, rates) {
  const map = new Map();
  for (const s of subs.filter(isCounted)) {
    const key = s.category || 'Diğer';
    map.set(key, (map.get(key) || 0) + monthlyIn(s, target, rates));
  }
  return [...map.entries()]
    .map(([category, monthly]) => ({ category, monthly }))
    .sort((a, b) => b.monthly - a.monthly);
}

// Önümüzdeki `days` gün içindeki ödemeler, tarihe göre sıralı.
export function upcoming(subs, days = 30, from = new Date()) {
  const out = [];
  for (const s of subs) {
    if (s.status === 'cancelled') continue;
    const date = nextPaymentDate(s, from);
    const left = daysUntil(date, from);
    if (left === null || left > days) continue;
    out.push({ sub: s, date, days: left });
  }
  return out.sort((a, b) => a.date - b.date);
}
