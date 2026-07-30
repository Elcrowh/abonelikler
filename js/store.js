// Yerel veri deposu. Tek gerçek kaynak burası; senkron bunun üstüne çalışır.
// localStorage yeterli: birkaç yüz kayıt için hızlı ve senkron okunuyor.

import { newSubscription } from './model.js';

const KEY = 'abo.v1';

const DEFAULT_SETTINGS = {
  baseCurrency: 'TRY',
  // 1 birim yabancı para kaç TRY eder. Ayarlar ekranından elle güncellenir.
  rates: { USD: 42, EUR: 46, GBP: 54 },
  ratesUpdatedAt: '',
  warnDays: 7,
};

function emptyState() {
  return {
    subscriptions: [],
    deleted: {},      // id -> silinme zamanı (senkronun tombstone'ları)
    settings: { ...DEFAULT_SETTINGS },
    settingsUpdatedAt: new Date().toISOString(),
    lastSyncAt: '',
  };
}

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      ...emptyState(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch (err) {
    console.error('Yerel veri okunamadı, sıfırdan başlanıyor.', err);
    return emptyState();
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Yerel veri yazılamadı.', err);
  }
}

function emit() {
  persist();
  for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function getSubscriptions() {
  return state.subscriptions;
}

export function getSettings() {
  return state.settings;
}

export function getById(id) {
  return state.subscriptions.find((s) => s.id === id) || null;
}

export function addSubscription(patch) {
  const sub = newSubscription(patch);
  state.subscriptions.push(sub);
  emit();
  return sub;
}

export function updateSubscription(id, patch) {
  const sub = getById(id);
  if (!sub) return null;
  Object.assign(sub, patch, { updatedAt: new Date().toISOString() });
  emit();
  return sub;
}

export function removeSubscription(id) {
  const i = state.subscriptions.findIndex((s) => s.id === id);
  if (i === -1) return false;
  state.subscriptions.splice(i, 1);
  state.deleted[id] = new Date().toISOString();
  emit();
  return true;
}

export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  state.settingsUpdatedAt = new Date().toISOString();
  emit();
  return state.settings;
}

/* ---------------- Senkronun kullandığı düşük seviye giriş noktaları ---------------- */

// Zaman damgalarını metin olarak karşılaştırmak yanlış sonuç veriyor:
// yerelde "…Z", Postgres'ten dönerken "…+00:00" biçimi geliyor ve
// metin sıralamasında "Z" > "+" olduğu için yerel hep daha yeni görünüyordu.
// O yüzden her karşılaştırma milisaniyeye çevrilerek yapılıyor.
export function ts(value) {
  const n = Date.parse(value || '');
  return Number.isNaN(n) ? 0 : n;
}

// Damgayı tek biçime indirger; yerelde her zaman ISO "Z" biçimi tutulur.
function normalizeStamp(value) {
  const n = Date.parse(value || '');
  return Number.isNaN(n) ? new Date().toISOString() : new Date(n).toISOString();
}

// Uzaktan gelen kaydı yereldekiyle birleştirir (son yazan kazanır).
export function mergeRemote(remote) {
  const incoming = { ...remote, updatedAt: normalizeStamp(remote.updatedAt) };
  const deletedAt = state.deleted[incoming.id];
  if (deletedAt && ts(deletedAt) >= ts(incoming.updatedAt)) return;
  if (deletedAt) delete state.deleted[incoming.id]; // uzaktaki kayıt daha yeni, silme geçersiz

  const local = getById(incoming.id);
  if (!local) {
    state.subscriptions.push(incoming);
  } else if (ts(incoming.updatedAt) > ts(local.updatedAt)) {
    Object.assign(local, incoming);
  }
}

export function mergeRemoteDeletion(id, deletedAt) {
  const local = getById(id);
  if (local && ts(local.updatedAt) > ts(deletedAt)) return; // yerelde daha yeni düzenleme var
  const i = state.subscriptions.findIndex((s) => s.id === id);
  if (i !== -1) state.subscriptions.splice(i, 1);
  state.deleted[id] = normalizeStamp(deletedAt);
}

export function mergeRemoteSettings(settings, updatedAt) {
  if (ts(updatedAt) <= ts(state.settingsUpdatedAt)) return;
  state.settings = { ...DEFAULT_SETTINGS, ...settings };
  state.settingsUpdatedAt = normalizeStamp(updatedAt);
}

export function markSynced(at = new Date().toISOString()) {
  state.lastSyncAt = at;
}

export function commit() {
  emit();
}

/* ---------------- Yedekleme ---------------- */

export function exportJSON() {
  return JSON.stringify(
    {
      app: 'abonelik-takip',
      version: 1,
      exportedAt: new Date().toISOString(),
      subscriptions: state.subscriptions,
      settings: state.settings,
    },
    null,
    2
  );
}

// mode: 'merge' mevcutların üstüne ekler, 'replace' her şeyi değiştirir.
export function importJSON(text, mode = 'merge') {
  const data = JSON.parse(text);
  const incoming = Array.isArray(data.subscriptions) ? data.subscriptions : null;
  if (!incoming) throw new Error('Dosyada abonelik listesi bulunamadı.');

  if (mode === 'replace') {
    state.subscriptions = [];
    state.deleted = {};
  }
  let added = 0;
  let updated = 0;
  for (const raw of incoming) {
    const sub = newSubscription(raw);
    const local = getById(sub.id);
    if (!local) {
      state.subscriptions.push(sub);
      added++;
    } else if (ts(sub.updatedAt) > ts(local.updatedAt)) {
      Object.assign(local, sub);
      updated++;
    }
  }
  if (data.settings) {
    state.settings = { ...DEFAULT_SETTINGS, ...data.settings };
    state.settingsUpdatedAt = new Date().toISOString();
  }
  emit();
  return { added, updated };
}

export function resetAll() {
  state = emptyState();
  emit();
}

export { DEFAULT_SETTINGS };
