// Döviz kurlarını otomatik çeker.
//
// Neden doviz.com değil: tarayıcılar bir sayfanın başka bir siteden veri
// okumasını CORS kuralıyla engelliyor ve doviz.com izin başlığı göndermiyor.
// Bu yüzden tarayıcıdan okunmaya açık, anahtarsız iki servis kullanılıyor;
// biri cevap vermezse diğerine geçiliyor.
//
// Saklanan değer her zaman "1 birim yabancı para kaç TRY eder" biçiminde.

import * as store from './store.js';
import { CURRENCIES } from './model.js';

const FOREIGN = CURRENCIES.filter((c) => c !== 'TRY');
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 saat

const PROVIDERS = [
  {
    name: 'exchangerate-api',
    url: 'https://open.er-api.com/v6/latest/TRY',
    parse(json) {
      if (json.result !== 'success' || !json.rates) return null;
      return fromTryRates(json.rates);
    },
  },
  {
    name: 'frankfurter',
    url: `https://api.frankfurter.app/latest?from=TRY&to=${FOREIGN.join(',')}`,
    parse(json) {
      if (!json.rates) return null;
      return fromTryRates(json.rates);
    },
  },
];

// Servisler "1 TRY kaç USD eder" veriyor; bize tersi lazım.
function fromTryRates(tryRates) {
  const out = {};
  for (const code of FOREIGN) {
    const perTry = Number(tryRates[code]);
    if (!perTry || !Number.isFinite(perTry)) return null;
    out[code] = 1 / perTry;
  }
  return out;
}

let inFlight = null;

// force=true ise yaş kontrolü atlanır (Ayarlar'daki yenile tuşu).
export async function refreshRates({ force = false } = {}) {
  const settings = store.getSettings();
  const age = Date.now() - store.ts(settings.ratesUpdatedAt);
  if (!force && settings.ratesUpdatedAt && age < MAX_AGE_MS) {
    return { skipped: 'fresh' };
  }
  if (!navigator.onLine) return { skipped: 'offline' };
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const errors = [];
    for (const provider of PROVIDERS) {
      try {
        const res = await fetch(provider.url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rates = provider.parse(await res.json());
        if (!rates) throw new Error('beklenmeyen cevap biçimi');
        store.updateSettings({
          rates,
          ratesUpdatedAt: new Date().toISOString(),
          ratesSource: provider.name,
        });
        return { ok: true, source: provider.name, rates };
      } catch (err) {
        errors.push(`${provider.name}: ${err.message}`);
      }
    }
    console.warn('Kurlar alınamadı.', errors);
    return { error: errors.join(' · ') };
  })().finally(() => { inFlight = null; });

  return inFlight;
}

// Kur satırı metni: "42,31". Ana para birimi USD gibi bir şey seçilirse
// "1 TRY = 0,02" anlamsız kalıyor; 1'in altındaki değerlerde basamak artıyor.
export function formatRate(value) {
  const v = Number(value) || 0;
  const digits = Math.abs(v) >= 1 ? 2 : 4;
  return v.toLocaleString('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function ratesAge() {
  const at = store.getSettings().ratesUpdatedAt;
  if (!at) return null;
  return Date.now() - store.ts(at);
}
