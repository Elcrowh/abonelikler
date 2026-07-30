// Arayüz katmanı: durumu okur, DOM'u çizer, olayları bağlar.

import * as M from './model.js';
import * as store from './store.js';
import * as sync from './sync.js';
import * as fx from './rates.js';   // "rates" adı aşağıdaki yardımcı fonksiyonla çakışıyor
import { GLYPH_IDS, GLYPHS, glyphSvg } from './glyphs.js';
import { CATALOG, searchCatalog } from './catalog.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const ui = {
  view: 'summary',
  search: '',
  sort: 'cost',
  statusFilter: 'counted',
  editingId: null,
  editColor: M.pickColor(),
  editIcon: '',
  authMode: 'signin',
};

/* ---------------- Yardımcılar ---------------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

let toastTimer;
function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.hidden = true; }, 2600);
}

function base() {
  return store.getSettings().baseCurrency;
}

function rates() {
  return store.getSettings().rates;
}

// Abonelik rozeti: renkli kutu + simge, simge yoksa baş harf.
function avatarEl({ name, color, icon }, large = false) {
  const node = el('div', large ? 'avatar lg' : 'avatar');
  node.style.background = color || '#78716c';
  node.style.color = M.readableOn(color);
  const svg = glyphSvg(icon, large ? 28 : 19);
  if (svg) node.append(svg);
  else node.append(document.createTextNode(M.monogram(name)));
  return node;
}

function cycleLabel(sub) {
  const n = Math.max(1, Number(sub.interval) || 1);
  const unit = M.UNITS[sub.unit]?.label || 'ay';
  if (n === 1) {
    return { day: 'Günlük', week: 'Haftalık', month: 'Aylık', year: 'Yıllık' }[sub.unit] || 'Aylık';
  }
  return `${n} ${unit}da bir`;
}

/* ---------------- Görünüm geçişi ---------------- */

function setView(name) {
  ui.view = name;
  for (const section of $$('.view')) {
    section.hidden = section.id !== `view-${name}`;
  }
  for (const tab of $$('.tab')) {
    tab.classList.toggle('active', tab.dataset.view === name);
  }
  $('#addBtn').hidden = name === 'settings';
  window.scrollTo({ top: 0 });
  render();
}

/* ---------------- Özet ---------------- */

function renderSummary() {
  const subs = store.getSubscriptions();
  const cur = base();
  const s = M.summarize(subs, cur, rates());

  $('#totalMonthly').textContent = M.formatMoney(s.monthly, cur);
  $('#totalYearly').textContent = M.formatMoney(s.yearly, cur);
  $('#totalCount').textContent = s.total
    ? `${s.count} aktif abonelik`
    : 'Henüz abonelik yok';
  $('#totalAvg').textContent = s.count
    ? `abonelik başına ${M.formatMoney(s.monthly / s.count, cur)}/ay`
    : '—';

  // Yaklaşan ödemeler
  const list = $('#upcomingList');
  list.textContent = '';
  const items = M.upcoming(subs, 30);
  if (!items.length) {
    list.append(el('div', 'empty', 'Önümüzdeki 30 günde ödeme görünmüyor.'));
  } else {
    const warnDays = store.getSettings().warnDays;
    for (const { sub, date, days } of items) {
      const row = el('button', 'item');
      row.type = 'button';
      if (days <= warnDays) row.classList.add('due-soon');

      const main = el('div', 'item-main');
      main.append(el('div', 'item-name', sub.name));
      main.append(el('div', 'item-meta', M.formatDate(date)));

      const right = el('div', 'item-right');
      right.append(el('div', 'item-amount', M.formatMoney(sub.amount, sub.currency)));
      right.append(el('div', 'item-note',
        days === 0 ? 'bugün' : days === 1 ? 'yarın' : `${days} gün kaldı`));

      row.append(avatarEl(sub), main, right);
      row.addEventListener('click', () => openEdit(sub.id));
      list.append(row);
    }
  }

  // Kategori dağılımı
  const cats = $('#categoryList');
  cats.textContent = '';
  const rows = M.byCategory(subs, cur, rates());
  if (!rows.length) {
    cats.append(el('div', 'empty', 'Abonelik ekleyince dağılım burada görünecek.'));
    return;
  }
  const max = rows[0].monthly || 1;
  const total = rows.reduce((acc, r) => acc + r.monthly, 0) || 1;
  for (const r of rows) {
    const card = el('div', 'card bar-row');
    const head = el('div', 'bar-head');
    head.append(el('span', null, r.category));
    const right = el('span', 'pct');
    right.textContent = `${M.formatMoney(r.monthly, cur)}/ay · %${Math.round((r.monthly / total) * 100)}`;
    head.append(right);
    const bar = el('div', 'bar');
    const fill = el('span');
    fill.style.width = `${Math.max(3, (r.monthly / max) * 100)}%`;
    bar.append(fill);
    card.append(head, bar);
    cats.append(card);
  }
}

/* ---------------- Liste ---------------- */

function renderList() {
  const cur = base();
  const q = ui.search.trim().toLocaleLowerCase('tr');
  let subs = store.getSubscriptions().slice();

  if (ui.statusFilter === 'counted') subs = subs.filter(M.isCounted);
  else if (ui.statusFilter !== 'all') subs = subs.filter((s) => s.status === ui.statusFilter);

  if (q) {
    subs = subs.filter((s) =>
      [s.name, s.category, s.note, s.paymentMethod]
        .filter(Boolean)
        .some((v) => v.toLocaleLowerCase('tr').includes(q))
    );
  }

  subs.sort((a, b) => {
    if (ui.sort === 'name') return a.name.localeCompare(b.name, 'tr');
    if (ui.sort === 'date') {
      const da = M.nextPaymentDate(a);
      const db = M.nextPaymentDate(b);
      return (da?.getTime() ?? Infinity) - (db?.getTime() ?? Infinity);
    }
    return M.monthlyIn(b, cur, rates()) - M.monthlyIn(a, cur, rates());
  });

  const list = $('#subList');
  list.textContent = '';
  if (!subs.length) {
    list.append(el('div', 'empty',
      store.getSubscriptions().length
        ? 'Bu filtreye uyan abonelik yok.'
        : 'Sağ alttaki + ile ilk aboneliğini ekle.'));
    return;
  }

  for (const sub of subs) {
    const row = el('button', 'item');
    row.type = 'button';

    const main = el('div', 'item-main');
    const nameLine = el('div', 'item-name');
    nameLine.append(document.createTextNode(sub.name));
    if (sub.status === 'trial') nameLine.append(el('span', 'badge', 'Deneme'));
    if (sub.status === 'cancelled') nameLine.append(el('span', 'badge muted', 'İptal'));
    main.append(nameLine);

    const next = M.nextPaymentDate(sub);
    const meta = sub.status === 'cancelled'
      ? `${cycleLabel(sub)} · ${sub.category}`
      : `${cycleLabel(sub)} · sonraki ${M.formatDateShort(next)}`;
    main.append(el('div', 'item-meta', meta));

    const right = el('div', 'item-right');
    right.append(el('div', 'item-amount', M.formatMoney(sub.amount, sub.currency)));
    const monthly = M.monthlyIn(sub, cur, rates());
    right.append(el('div', 'item-note', `${M.formatMoney(monthly, cur)}/ay`));

    row.append(avatarEl(sub), main, right);
    row.addEventListener('click', () => openEdit(sub.id));
    list.append(row);
  }
}

/* ---------------- Ayarlar ---------------- */

function renderSettings() {
  const settings = store.getSettings();

  const baseSel = $('#baseCurrency');
  if (!baseSel.options.length) {
    for (const c of M.CURRENCIES) {
      baseSel.append(new Option(`${c} ${M.CURRENCY_SYMBOL[c]}`, c));
    }
  }
  baseSel.value = settings.baseCurrency;

  const list = $('#rateList');
  list.textContent = '';
  for (const c of M.CURRENCIES) {
    if (c === settings.baseCurrency) continue;
    const row = el('div', 'rate-row');
    row.append(el('span', null, `1 ${c}`));
    const value = M.convert(1, c, settings.baseCurrency, settings.rates);
    row.append(el('b', null,
      `${fx.formatRate(value)} ${M.CURRENCY_SYMBOL[settings.baseCurrency]}`));
    list.append(row);
  }

  $('#ratesUpdated').textContent = settings.ratesUpdatedAt
    ? `Otomatik güncellendi: ${new Date(settings.ratesUpdatedAt).toLocaleString('tr-TR')}`
    : 'Kurlar henüz alınmadı.';

  $('#warnDays').value = settings.warnDays;

  renderSyncCard();
}

function renderSyncCard() {
  const card = $('#syncCard');
  card.textContent = '';

  if (!sync.isConfigured) {
    card.append(el('p', 'help', 'Senkron ayarlanmamış. config.js dosyasına Supabase bilgilerini gir.'));
    return;
  }

  const line = el('div', 'sync-line');
  const state = el('div', 'sync-state');

  if (sync.isSignedIn()) {
    const user = sync.getUser();
    state.append(document.createTextNode('Giriş yapıldı: '));
    state.append(el('b', null, user?.email || '—'));
    const last = store.getState().lastSyncAt;
    line.append(state);

    const out = el('button', 'btn compact', 'Çıkış');
    out.addEventListener('click', async () => {
      await sync.signOut();
      toast('Çıkış yapıldı. Veriler bu cihazda duruyor.');
      render();
    });
    line.append(out);
    card.append(line);
    card.append(el('p', 'help', last
      ? `Son eşitleme: ${new Date(last).toLocaleString('tr-TR')}`
      : 'Henüz eşitlenmedi. Üstteki yenile tuşuna basabilirsin.'));
  } else {
    state.textContent = 'Giriş yapılmadı — veriler yalnızca bu cihazda.';
    line.append(state);
    const inBtn = el('button', 'btn primary compact', 'Giriş yap');
    inBtn.addEventListener('click', () => openAuth('signin'));
    line.append(inBtn);
    card.append(line);
    card.append(el('p', 'help',
      'Aynı hesapla telefonundan da girersen abonelikler iki cihazda da aynı olur.'));
  }
}

/* ---------------- Ana çizim ---------------- */

function render() {
  if (ui.view === 'summary') renderSummary();
  else if (ui.view === 'list') renderList();
  else renderSettings();
  updateSyncDot();
}

function updateSyncDot(status) {
  const dot = $('#syncDot');
  const btn = $('#syncBtn');
  btn.classList.toggle('spin', status === 'syncing');
  dot.className = 'sync-dot';
  if (!sync.isConfigured || !sync.isSignedIn()) dot.classList.add('off');
  else if (status === 'error') dot.classList.add('error');
  else if (store.getState().lastSyncAt) dot.classList.add('ok');
}

/* ---------------- Ekle / düzenle ---------------- */

function fillSelects() {
  const curSel = $('#currencySelect');
  for (const c of M.CURRENCIES) curSel.append(new Option(`${c} ${M.CURRENCY_SYMBOL[c]}`, c));

  const catSel = $('#categorySelect');
  for (const c of M.CATEGORIES) catSel.append(new Option(c, c));

  const stSel = $('#statusSelect');
  for (const [value, label] of Object.entries(M.STATUS)) stSel.append(new Option(label, value));

  const grid = $('#glyphGrid');
  // İlk kutu "simge yok" anlamına gelir: baş harf gösterilir.
  const none = el('button', 'glyph-btn');
  none.type = 'button';
  none.dataset.glyph = '';
  none.title = 'Simge yok — baş harf';
  none.textContent = 'Aa';
  none.addEventListener('click', () => { ui.editIcon = ''; syncPickers(); });
  grid.append(none);

  for (const id of GLYPH_IDS) {
    const b = el('button', 'glyph-btn');
    b.type = 'button';
    b.dataset.glyph = id;
    b.title = GLYPHS[id].label;
    b.append(glyphSvg(id));
    b.addEventListener('click', () => { ui.editIcon = id; syncPickers(); });
    grid.append(b);
  }
}

// Renk ızgarası. Listeden seçilen servisin marka rengi paletin dışında
// kalabiliyor; o durumda seçili renk ızgaranın başına ayrıca eklenir,
// yoksa kullanıcı hangi rengin geçerli olduğunu göremiyor.
function renderColorGrid() {
  const row = $('#colorRow');
  row.textContent = '';
  const colors = M.PALETTE.includes(ui.editColor)
    ? M.PALETTE
    : [ui.editColor, ...M.PALETTE];

  for (const c of colors) {
    const b = el('button', 'swatch');
    b.type = 'button';
    b.style.background = c;
    b.dataset.color = c;
    b.title = c === ui.editColor && !M.PALETTE.includes(c) ? `${c} (marka rengi)` : c;
    b.classList.toggle('active', c === ui.editColor);
    b.addEventListener('click', () => {
      ui.editColor = c;
      syncPickers();
    });
    row.append(b);
  }
}

// Seçili renk/simge işaretlerini ve önizleme rozetini tazeler.
function syncPickers() {
  renderColorGrid();
  for (const b of $$('.glyph-btn')) {
    b.classList.toggle('active', b.dataset.glyph === ui.editIcon);
  }
  const holder = $('#editAvatar');
  const preview = avatarEl(
    { name: $('#editForm').name.value, color: ui.editColor, icon: ui.editIcon },
    true
  );
  holder.replaceWith(preview);
  preview.id = 'editAvatar';
}

/* ---------------- Popüler servis seçici ---------------- */

function renderServiceGrid(query = '') {
  const grid = $('#serviceGrid');
  grid.textContent = '';
  const items = searchCatalog(query);
  $('#pickerEmpty').hidden = items.length > 0;

  for (const item of items) {
    const b = el('button', 'service-btn');
    b.type = 'button';
    b.append(avatarEl({ name: item.name, color: item.color, icon: item.glyph }));
    b.append(el('span', null, item.name));
    b.addEventListener('click', () => applyService(item));
    grid.append(b);
  }
}

function applyService(item) {
  const form = $('#editForm');
  form.name.value = item.name;
  form.category.value = item.category;
  ui.editColor = item.color;
  ui.editIcon = item.glyph || '';
  syncPickers();
  $('#pickerDialog').close();
  toast(`${item.name} seçildi`);
}

function openEdit(id) {
  const form = $('#editForm');
  form.reset();
  ui.editingId = id || null;

  const sub = id ? store.getById(id) : null;
  $('#editTitle').textContent = sub ? 'Aboneliği düzenle' : 'Yeni abonelik';
  $('#deleteBtn').hidden = !sub;

  const data = sub || M.newSubscription({ currency: base() });
  form.name.value = data.name;
  form.amount.value = sub ? data.amount : '';
  form.currency.value = data.currency;
  form.interval.value = data.interval;
  form.unit.value = data.unit;
  form.anchorDate.value = data.anchorDate;
  form.category.value = data.category;
  form.status.value = data.status;
  form.trialEnd.value = data.trialEnd || '';
  form.paymentMethod.value = data.paymentMethod || '';
  form.url.value = data.url || '';
  form.note.value = data.note || '';
  ui.editColor = data.color;
  ui.editIcon = data.icon || '';
  syncPickers();
  toggleTrialField();

  $('#editDialog').showModal();
  if (!sub) setTimeout(() => form.name.focus(), 60);
}

function toggleTrialField() {
  $('#trialField').hidden = $('#editForm').status.value !== 'trial';
}

function saveEdit(event) {
  const form = $('#editForm');
  const patch = {
    name: form.name.value.trim(),
    amount: Number(form.amount.value) || 0,
    currency: form.currency.value,
    interval: Math.max(1, Number(form.interval.value) || 1),
    unit: form.unit.value,
    anchorDate: form.anchorDate.value,
    category: form.category.value,
    status: form.status.value,
    trialEnd: form.status.value === 'trial' ? form.trialEnd.value : '',
    paymentMethod: form.paymentMethod.value.trim(),
    url: form.url.value.trim(),
    note: form.note.value.trim(),
    icon: ui.editIcon,
    color: ui.editColor,
  };

  if (ui.editingId) {
    store.updateSubscription(ui.editingId, patch);
    toast('Güncellendi');
  } else {
    store.addSubscription(patch);
    toast('Eklendi');
  }
  ui.editingId = null;
  sync.sync();
}

/* ---------------- Giriş ---------------- */

function openAuth(mode) {
  ui.authMode = mode;
  const form = $('#authForm');
  form.reset();
  $('#authError').hidden = true;
  $('#authTitle').textContent = mode === 'signin' ? 'Giriş yap' : 'Hesap oluştur';
  $('#authSubmit').textContent = mode === 'signin' ? 'Giriş yap' : 'Hesap oluştur';
  $('#authToggle').textContent = mode === 'signin'
    ? 'Hesabım yok, oluştur'
    : 'Hesabım var, giriş yap';
  form.password.autocomplete = mode === 'signin' ? 'current-password' : 'new-password';
  $('#authDialog').showModal();
}

async function submitAuth(event) {
  event.preventDefault();
  const form = $('#authForm');
  const btn = $('#authSubmit');
  const err = $('#authError');
  err.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Bekle…';

  try {
    const email = form.email.value.trim();
    const password = form.password.value;
    if (ui.authMode === 'signin') {
      await sync.signIn(email, password);
      toast('Giriş başarılı, eşitleniyor…');
    } else {
      const { needsConfirmation } = await sync.signUp(email, password);
      if (needsConfirmation) {
        err.textContent = 'Hesap oluşturuldu. E-postana gelen doğrulama bağlantısına tıklayıp sonra giriş yap.';
        err.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Hesap oluştur';
        return;
      }
      toast('Hesap oluşturuldu, eşitleniyor…');
    }
    $('#authDialog').close();
    await sync.sync();
    render();
  } catch (e) {
    err.textContent = translateAuthError(e.message);
    err.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = ui.authMode === 'signin' ? 'Giriş yap' : 'Hesap oluştur';
  }
}

function translateAuthError(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'E-posta veya parola hatalı.';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.';
  }
  if (m.includes('password')) return 'Parola en az 6 karakter olmalı.';
  if (m.includes('failed to fetch')) return 'Bağlantı kurulamadı. İnternetini kontrol et.';
  return msg;
}

/* ---------------- Yedek ---------------- */

function exportBackup() {
  const blob = new Blob([store.exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `abonelikler-${M.todayISO()}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importBackup(file) {
  try {
    const text = await file.text();
    const { added, updated } = store.importJSON(text, 'merge');
    toast(`${added} yeni, ${updated} güncellenen kayıt alındı.`);
    sync.sync();
  } catch (err) {
    toast(`İçe aktarılamadı: ${err.message}`);
  }
}

/* ---------------- Olay bağlantıları ---------------- */

function wire() {
  for (const tab of $$('.tab')) {
    tab.addEventListener('click', () => setView(tab.dataset.view));
  }

  $('#addBtn').addEventListener('click', () => openEdit(null));
  $('#addBtnTop').addEventListener('click', () => openEdit(null));

  $('#cancelEdit').addEventListener('click', () => $('#editDialog').close());
  $('#editForm').addEventListener('submit', saveEdit);
  $('#statusSelect').addEventListener('change', toggleTrialField);
  // Ad yazılırken baş harf rozeti canlı güncellensin.
  $('#editForm').name.addEventListener('input', syncPickers);

  $('#pickServiceBtn').addEventListener('click', () => {
    $('#pickerSearch').value = '';
    renderServiceGrid('');
    $('#pickerDialog').showModal();
  });
  $('#cancelPicker').addEventListener('click', () => $('#pickerDialog').close());
  $('#pickerSearch').addEventListener('input', (e) => renderServiceGrid(e.target.value));

  $('#deleteBtn').addEventListener('click', () => {
    const sub = store.getById(ui.editingId);
    if (!sub) return;
    if (!confirm(`"${sub.name}" silinsin mi?`)) return;
    store.removeSubscription(ui.editingId);
    ui.editingId = null;
    $('#editDialog').close();
    toast('Silindi');
    sync.sync();
  });

  $('#searchInput').addEventListener('input', (e) => {
    ui.search = e.target.value;
    renderList();
  });
  $('#sortSelect').addEventListener('change', (e) => {
    ui.sort = e.target.value;
    renderList();
  });
  for (const chip of $$('#statusChips .chip')) {
    chip.addEventListener('click', () => {
      ui.statusFilter = chip.dataset.status;
      for (const c of $$('#statusChips .chip')) c.classList.toggle('active', c === chip);
      renderList();
    });
  }

  $('#baseCurrency').addEventListener('change', (e) => {
    store.updateSettings({ baseCurrency: e.target.value });
  });

  $('#refreshRatesBtn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = 'Alınıyor…';
    const result = await fx.refreshRates({ force: true });
    btn.disabled = false;
    btn.textContent = 'Kurları yenile';
    if (result.ok) toast('Kurlar güncellendi');
    else if (result.skipped === 'offline') toast('Çevrimdışısın, son bilinen kur kullanılıyor.');
    else toast('Kurlar alınamadı, son bilinen kur kullanılıyor.');
    renderSettings();
  });
  $('#warnDays').addEventListener('change', (e) => {
    store.updateSettings({ warnDays: Math.min(60, Math.max(1, Number(e.target.value) || 7)) });
  });

  $('#exportBtn').addEventListener('click', exportBackup);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) importBackup(file);
    e.target.value = '';
  });

  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Bu cihazdaki tüm abonelikler ve ayarlar silinecek. Emin misin?')) return;
    store.resetAll();
    toast('Temizlendi');
    fx.refreshRates({ force: true }).then(render); // kurlar sıfırlandı, hemen geri al
  });

  $('#authForm').addEventListener('submit', submitAuth);
  $('#cancelAuth').addEventListener('click', () => $('#authDialog').close());
  $('#authToggle').addEventListener('click', () => {
    openAuth(ui.authMode === 'signin' ? 'signup' : 'signin');
  });

  $('#syncBtn').addEventListener('click', async () => {
    if (!sync.isConfigured) return toast('Senkron ayarlanmamış.');
    if (!sync.isSignedIn()) return openAuth('signin');
    const result = await sync.sync();
    if (result.error) toast(`Eşitlenemedi: ${result.error}`);
    else if (result.skipped === 'offline') toast('Çevrimdışısın, bağlanınca eşitlenecek.');
    else toast('Eşitlendi');
    render();
  });

  store.subscribe(() => render());
  sync.onChange((status) => {
    updateSyncDot(status);
    if (ui.view === 'settings') renderSyncCard();
  });
}

/* ---------------- Başlangıç ---------------- */

function boot() {
  fillSelects();
  wire();
  setView('summary');

  if (sync.isSignedIn()) sync.sync();

  // Kurlar 6 saatten eskiyse sessizce tazele.
  fx.refreshRates().then((r) => { if (r.ok) render(); });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => {
        console.warn('Service worker kaydedilemedi', err);
      });
    });
  }
}

boot();
