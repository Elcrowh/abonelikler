// Abonelik simgeleri. 24x24 kutuda, çizgi (stroke) tabanlı yollar.
// Listede olmayan servisler için kullanıcı buradan bir simge seçiyor.

export const GLYPHS = {
  tv:        { label: 'Televizyon', d: 'M2 7h20v12H2z M8 3l4 4 4-4' },
  film:      { label: 'Film',       d: 'M3 4h18v16H3z M7 4v16 M17 4v16 M3 8h4 M3 12h4 M3 16h4 M17 8h4 M17 12h4 M17 16h4' },
  play:      { label: 'Oynat',      d: 'M6 3l14 9-14 9z' },
  music:     { label: 'Müzik',      d: 'M9 18V5l12-2v13 M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
  headphones:{ label: 'Kulaklık',   d: 'M3 18v-6a9 9 0 0 1 18 0v6 M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z' },
  mic:       { label: 'Mikrofon',   d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3' },
  gamepad:   { label: 'Oyun',       d: 'M6 11h4 M8 9v4 M15 12h.01 M17.5 10h.01 M7 6h10a5 5 0 0 1 5 5v2a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5v-2a5 5 0 0 1 5-5z' },
  cloud:     { label: 'Bulut',      d: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z' },
  code:      { label: 'Kod',        d: 'M16 18l6-6-6-6 M8 6l-6 6 6 6' },
  terminal:  { label: 'Terminal',   d: 'M4 17l6-6-6-6 M12 19h8' },
  book:      { label: 'Kitap',      d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
  graduation:{ label: 'Eğitim',     d: 'M22 10L12 5 2 10l10 5 10-5z M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5' },
  dumbbell:  { label: 'Spor',       d: 'M6.5 6.5v11 M17.5 6.5v11 M3 9v6 M21 9v6 M6.5 12h11' },
  heart:     { label: 'Sağlık',     d: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z' },
  news:      { label: 'Haber',      d: 'M4 3h16v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z M8 8h8 M8 12h8 M8 16h5' },
  phone:     { label: 'Telefon',    d: 'M7 2h10v20H7z M11 18h2' },
  wifi:      { label: 'İnternet',   d: 'M5 12.5a10 10 0 0 1 14 0 M8.5 16a5 5 0 0 1 7 0 M2 9a15 15 0 0 1 20 0 M12 20h.01' },
  globe:     { label: 'Web',        d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20 M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z' },
  shield:    { label: 'Güvenlik',   d: 'M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6z' },
  database:  { label: 'Veri',       d: 'M12 2c4.4 0 8 1.3 8 3v14c0 1.7-3.6 3-8 3s-8-1.3-8-3V5c0-1.7 3.6-3 8-3z M4 5c0 1.7 3.6 3 8 3s8-1.3 8-3 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3' },
  mail:      { label: 'Posta',      d: 'M2 5h20v14H2z M2 6l10 7 10-7' },
  calendar:  { label: 'Takvim',     d: 'M3 5h18v16H3z M3 10h18 M8 3v4 M16 3v4' },
  camera:    { label: 'Kamera',     d: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  palette:   { label: 'Tasarım',    d: 'M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.6-1.3-.3-.4-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.4A5.7 5.7 0 0 0 22 9.7C22 5.5 17.5 2 12 2z M7.5 11h.01 M12 8h.01 M16.5 11h.01' },
  cart:      { label: 'Alışveriş',  d: 'M9 21h.01 M20 21h.01 M1 2h3l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6' },
  coffee:    { label: 'Kahve',      d: 'M18 8h1a4 4 0 0 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z M6 2v3 M10 2v3 M14 2v3' },
  plane:     { label: 'Seyahat',    d: 'M17.8 19.2L16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-.9 1.7L9 11l-2 4-3-1v2l3 2 2 3h2l-1-3 4-2 3.1 5.1a1 1 0 0 0 1.7-.9z' },
  car:       { label: 'Ulaşım',     d: 'M5 17h.01 M19 17h.01 M3 15v-4l2-5h14l2 5v4 M3 12h18 M7 15h10' },
  home:      { label: 'Ev',         d: 'M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  paw:       { label: 'Evcil hayvan', d: 'M11 14c-3 0-5 2-5 4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3c0-2-2-4-5-4z M5.5 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M18.5 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M9.5 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M14.5 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  chart:     { label: 'Grafik',     d: 'M3 3v18h18 M7 15l4-5 3 3 5-6' },
  briefcase: { label: 'İş',         d: 'M3 7h18v13H3z M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M3 12h18' },
  sparkles:  { label: 'Yapay zekâ', d: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z' },
  box:       { label: 'Kutu',       d: 'M21 8l-9-5-9 5v8l9 5 9-5z M3 8l9 5 9-5 M12 13v8' },
  star:      { label: 'Yıldız',     d: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1z' },
  bolt:      { label: 'Enerji',     d: 'M13 2L3 14h8l-1 8 10-12h-8z' },
  droplet:   { label: 'Su',         d: 'M12 2.7l5 5a7 7 0 1 1-10 0z' },
};

export const GLYPH_IDS = Object.keys(GLYPHS);

// Verilen simgeyi SVG düğümü olarak üretir. Simge yoksa null döner.
export function glyphSvg(id, size = 20) {
  const glyph = GLYPHS[id];
  if (!glyph) return null;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', glyph.d);
  svg.append(path);
  return svg;
}
