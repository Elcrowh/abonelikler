// Supabase ile senkron. Kütüphane yok; REST uçlarına doğrudan fetch atılıyor,
// böylece çevrimdışı çalışma için CDN bağımlılığı kalmıyor.

import * as store from './store.js';

const SESSION_KEY = 'abo.session.v1';

const cfg = window.APP_CONFIG || {};
const URL_BASE = (cfg.SUPABASE_URL || '').replace(/\/$/, '');
const ANON = cfg.SUPABASE_ANON_KEY || '';

let session = loadSession();
const listeners = new Set();

export const isConfigured = Boolean(URL_BASE && ANON);

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(status) {
  for (const fn of listeners) fn(status);
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveSession(s) {
  session = s;
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

export function getUser() {
  return session?.user || null;
}

export function isSignedIn() {
  return Boolean(session?.access_token);
}

async function authRequest(path, body) {
  const res = await fetch(`${URL_BASE}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error_description || json.msg || json.message || 'İstek başarısız.');
  }
  return json;
}

function storeSession(json) {
  saveSession({
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + (json.expires_in || 3600) * 1000,
    user: json.user ? { id: json.user.id, email: json.user.email } : session?.user,
  });
}

export async function signUp(email, password) {
  const json = await authRequest('signup', { email, password });
  if (json.access_token) storeSession(json);
  emit();
  // E-posta doğrulaması açıksa token gelmez; kullanıcıya bunu söyleyeceğiz.
  return { needsConfirmation: !json.access_token };
}

export async function signIn(email, password) {
  const json = await authRequest('token?grant_type=password', { email, password });
  storeSession(json);
  emit();
}

export async function signOut() {
  saveSession(null);
  emit();
}

async function ensureToken() {
  if (!session) throw new Error('Oturum yok.');
  if (Date.now() < session.expires_at - 60000) return session.access_token;
  const json = await authRequest('token?grant_type=refresh_token', {
    refresh_token: session.refresh_token,
  });
  storeSession(json);
  return session.access_token;
}

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const token = await ensureToken();
  const headers = {
    apikey: ANON,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Sunucu hatası (${res.status}): ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* ---------------- Senkron akışı ---------------- */

let running = false;

export async function sync() {
  if (!isConfigured) return { skipped: 'config' };
  if (!isSignedIn()) return { skipped: 'auth' };
  if (!navigator.onLine) return { skipped: 'offline' };
  if (running) return { skipped: 'busy' };

  running = true;
  emit('syncing');
  try {
    const userId = session.user.id;

    // 1) Uzaktakini çek ve yerelle birleştir.
    const rows = await rest('subscriptions?select=id,data,updated_at,deleted');
    for (const row of rows || []) {
      if (row.deleted) store.mergeRemoteDeletion(row.id, row.updated_at);
      else store.mergeRemote({ ...row.data, id: row.id, updatedAt: row.updated_at });
    }

    const settingsRows = await rest('app_settings?select=data,updated_at&limit=1');
    if (settingsRows && settingsRows[0]) {
      store.mergeRemoteSettings(settingsRows[0].data, settingsRows[0].updated_at);
    }

    const state = store.getState();
    const remoteById = new Map((rows || []).map((r) => [r.id, r]));

    // 2) Yerelde daha yeni olanları gönder.
    const payload = state.subscriptions
      .filter((s) => {
        const r = remoteById.get(s.id);
        return !r || store.ts(s.updatedAt) > store.ts(r.updated_at) || r.deleted;
      })
      .map((s) => ({
        id: s.id,
        user_id: userId,
        data: s,
        updated_at: s.updatedAt,
        deleted: false,
      }));

    // 3) Yerel silmeleri tombstone olarak gönder.
    for (const [id, at] of Object.entries(state.deleted)) {
      const r = remoteById.get(id);
      if (r && r.deleted) continue;
      payload.push({ id, user_id: userId, data: {}, updated_at: at, deleted: true });
    }

    if (payload.length) {
      await rest('subscriptions', {
        method: 'POST',
        body: payload,
        prefer: 'resolution=merge-duplicates,return=minimal',
      });
    }

    if (store.ts(state.settingsUpdatedAt) > store.ts(settingsRows?.[0]?.updated_at)) {
      await rest('app_settings', {
        method: 'POST',
        body: [{ user_id: userId, data: state.settings, updated_at: state.settingsUpdatedAt }],
        prefer: 'resolution=merge-duplicates,return=minimal',
      });
    }

    store.markSynced();
    store.commit();
    emit('ok');
    return { ok: true };
  } catch (err) {
    console.error('Senkron hatası', err);
    emit('error');
    return { error: err.message };
  } finally {
    running = false;
  }
}

// Bağlantı geri geldiğinde ve sekme öne çıktığında sessizce dene.
window.addEventListener('online', () => sync());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') sync();
});
