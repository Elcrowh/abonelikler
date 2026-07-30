// Kategori dağılımı halka grafiği.
//
// Renkler dataviz kılavuzunun kategorik paletinin koyu basamakları. Uygulamanın
// kart yüzeyine (#131316) karşı doğrulandı: parlaklık bandı, kroma tabanı,
// renk körlüğü ayrımı (en kötü komşu ΔE 8.4), normal görüş tabanı (ΔE 19.3) ve
// kontrast (hepsi ≥ 3:1) geçti.
//
// Renk sıraya göre değil, kategorinin kimliğine göre veriliyor: tutarlar
// değiştiğinde dilimler yer değiştirse bile bir kategori hep aynı rengi tutar.

import { CATEGORIES } from './model.js';

const SERIES = [
  '#3987e5', // mavi
  '#d95926', // turuncu
  '#199e70', // deniz yeşili
  '#c98500', // sarı
  '#d55181', // magenta
  '#008300', // yeşil
];

const OTHER_COLOR = '#898781'; // "Diğer" kovası kimlik taşımaz, nötr gri
const MAX_SLICES = 6;          // bunun üstü tek bir "Diğer" dilimine katlanır

const R = 60;                  // halka yarıçapı
const STROKE = 22;             // halka kalınlığı
const SIZE = 160;              // viewBox kenarı
const GAP = 2;                 // dilimler arası yüzey boşluğu (piksel)
const C = 2 * Math.PI * R;

// Görünen kategorilere sabit renk atar: sıralama tutara göre değil,
// model.js'teki kanonik kategori sırasına göre yapılır.
function assignColors(categories) {
  const present = CATEGORIES.filter((c) => categories.includes(c));
  // Kanonik listede olmayan bir kategori varsa (eski kayıt) sona eklenir.
  for (const c of categories) if (!present.includes(c)) present.push(c);

  const map = new Map();
  present.forEach((name, i) => map.set(name, SERIES[i % SERIES.length]));
  return map;
}

// rows: [{ category, monthly }] — azalan sırada
// Dönen: çizilecek dilimler, gerekiyorsa kuyruğu "Diğer"e katlanmış hâlde.
export function foldRows(rows) {
  if (rows.length <= MAX_SLICES + 1) return rows.map((r) => ({ ...r, folded: false }));

  const head = rows.slice(0, MAX_SLICES).map((r) => ({ ...r, folded: false }));
  const tail = rows.slice(MAX_SLICES);
  const sum = tail.reduce((acc, r) => acc + r.monthly, 0);
  head.push({ category: `Diğer (${tail.length} kategori)`, monthly: sum, folded: true });
  return head;
}

/**
 * Halka grafiği çizer.
 * @param {Array<{category:string, monthly:number}>} rows azalan sırada
 * @param {(value:number)=>string} formatValue para biçimlendirici
 * @param {string} centerLabel halkanın ortasındaki alt satır
 * @returns {{node: HTMLElement, slices: Array}}
 */
export function renderDonut(rows, formatValue, centerLabel = 'aylık toplam') {
  const folded = foldRows(rows);
  const total = folded.reduce((acc, r) => acc + r.monthly, 0);
  const colors = assignColors(folded.filter((r) => !r.folded).map((r) => r.category));

  const slices = folded.map((r) => ({
    ...r,
    color: r.folded ? OTHER_COLOR : colors.get(r.category),
    share: total ? r.monthly / total : 0,
  }));

  const wrap = document.createElement('div');
  wrap.className = 'donut-card card';

  const chart = document.createElement('div');
  chart.className = 'donut-chart';

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute('class', 'donut-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label',
    `Kategori dağılımı: ${slices.map((s) => `${s.category} yüzde ${Math.round(s.share * 100)}`).join(', ')}`);

  const g = document.createElementNS(ns, 'g');
  // Dilimler saat 12'den başlasın.
  g.setAttribute('transform', `rotate(-90 ${SIZE / 2} ${SIZE / 2})`);

  // Zemin halkası: toplam sıfırken de bir şey görünsün.
  const track = document.createElementNS(ns, 'circle');
  track.setAttribute('cx', SIZE / 2);
  track.setAttribute('cy', SIZE / 2);
  track.setAttribute('r', R);
  track.setAttribute('class', 'donut-track');
  track.setAttribute('stroke-width', STROKE);
  g.append(track);

  // Dilimler halkaya tutara göre değil, kanonik kategori sırasına göre diziliyor.
  // Sebebi: halkada hangi iki rengin yan yana geleceğini bu sıra belirliyor.
  // Tutara göre dizilseydi komşuluk her fiyat değişiminde başka bir çifte
  // düşerdi ve doğrulanmamış bir kombinasyon yan yana gelebilirdi (turkuaz ile
  // magenta gibi: renk körlüğü altında ΔE 1.6, yani ayırt edilemez).
  // Kanonik sırada komşuluk hep paletin kendi sırası: en kötü çift ΔE 8.4.
  // Gösterge listesi büyükten küçüğe sıralı kalıyor.
  const ringOrder = [...slices].sort((a, b) => {
    if (a.folded !== b.folded) return a.folded ? 1 : -1; // "Diğer" hep sonda
    return CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category);
  });

  const tekDilim = slices.length === 1;
  let offset = 0;

  for (const slice of ringOrder) {
    const raw = slice.share * C;
    // Dilimler arasında 2 piksellik yüzey boşluğu; tek dilimde boşluk olmaz.
    // Payı çok küçük bir kategori boşluk düşülünce tamamen kaybolmasın diye
    // 1 piksellik bir taban bırakılıyor.
    const len = tekDilim ? raw : Math.max(raw > 0 ? 1 : 0, raw - GAP);
    const arc = document.createElementNS(ns, 'circle');
    arc.setAttribute('cx', SIZE / 2);
    arc.setAttribute('cy', SIZE / 2);
    arc.setAttribute('r', R);
    arc.setAttribute('class', 'donut-arc');
    arc.setAttribute('stroke', slice.color);
    arc.setAttribute('stroke-width', STROKE);
    arc.setAttribute('stroke-dasharray', `${len} ${C - len}`);
    arc.setAttribute('stroke-dashoffset', -offset);
    g.append(arc);
    slice.arc = arc;   // gösterge satırı kendi dilimini bulabilsin
    offset += raw;
  }

  svg.append(g);
  chart.append(svg);

  // Ortadaki değer. Varsayılan toplam; bir dilim seçilince o dilime döner.
  const center = document.createElement('div');
  center.className = 'donut-center';
  const centerValue = document.createElement('strong');
  centerValue.className = 'donut-value';
  centerValue.textContent = formatValue(total);
  const centerName = document.createElement('span');
  centerName.className = 'donut-caption';
  centerName.textContent = centerLabel;
  center.append(centerValue, centerName);
  chart.append(center);

  wrap.append(chart);

  // Gösterge aynı zamanda tablo görünümü: her değer metin olarak da burada.
  const legend = document.createElement('div');
  legend.className = 'donut-legend';

  const rowsEl = slices.map((slice) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'legend-row';

    const chip = document.createElement('span');
    chip.className = 'legend-chip';
    chip.style.background = slice.color;

    const name = document.createElement('span');
    name.className = 'legend-name';
    name.textContent = slice.category;

    const value = document.createElement('span');
    value.className = 'legend-value';
    value.textContent = formatValue(slice.monthly);

    const pct = document.createElement('span');
    pct.className = 'legend-pct';
    // %10'un altında bir ondalık; toFixed nokta verdiği için tr-TR ile biçimlenir.
    const digits = slice.share < 0.1 ? 1 : 0;
    pct.textContent = `%${(slice.share * 100).toLocaleString('tr-TR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`;

    row.append(chip, name, value, pct);
    legend.append(row);
    return { row, slice, arc: slice.arc };
  });

  // Vurgulama: dilime ya da gösterge satırına dokununca diğerleri soluyor,
  // orta alan o dilimin değerine dönüyor. Tekrar dokununca geri alınıyor.
  let selected = -1;
  function highlight(index) {
    selected = index === selected ? -1 : index;
    rowsEl.forEach(({ row, arc }, i) => {
      const on = selected === -1 || i === selected;
      arc.classList.toggle('dim', !on);
      row.classList.toggle('dim', !on);
      row.setAttribute('aria-pressed', String(i === selected));
    });
    if (selected === -1) {
      centerValue.textContent = formatValue(total);
      centerName.textContent = centerLabel;
    } else {
      const s = slices[selected];
      centerValue.textContent = formatValue(s.monthly);
      centerName.textContent = s.category;
    }
  }

  rowsEl.forEach(({ row, arc }, i) => {
    row.addEventListener('click', () => highlight(i));
    arc.style.cursor = 'pointer';
    arc.addEventListener('click', () => highlight(i));
  });

  wrap.append(legend);
  return { node: wrap, slices };
}
