// Popüler servis listesi.
//
// Logolar hakkında: servislerin resmî logoları tescilli marka ve her birinin
// kendi kullanım koşulları var; ayrıca uzaktan indirilen bir logo uygulamanın
// çevrimdışı çalışmasını bozardı. Bu yüzden her servis, kendi marka rengiyle
// boyanmış bir kutu ve içinde ya konusuna uygun bir simge ya da baş harfiyle
// gösteriliyor. Renkler tanınırlığı sağlıyor, hiçbir dosya dışarıdan çekilmiyor.
//
// glyph verilmezse baş harf kullanılır.

export const CATALOG = [
  // Video / dizi-film
  { name: 'Netflix',              color: '#e50914', glyph: 'film',       category: 'Eğlence' },
  { name: 'Disney+',              color: '#1f4bd8', glyph: 'sparkles',   category: 'Eğlence' },
  { name: 'Amazon Prime Video',   color: '#00a8e1', glyph: 'play',       category: 'Eğlence' },
  { name: 'YouTube Premium',      color: '#ff0000', glyph: 'play',       category: 'Eğlence' },
  { name: 'HBO Max',              color: '#7b2bf9', glyph: 'play',       category: 'Eğlence' },
  { name: 'BluTV',                color: '#0a84ff', glyph: 'play',       category: 'Eğlence' },
  { name: 'Exxen',                color: '#e0b400', glyph: 'play',       category: 'Eğlence' },
  { name: 'Gain',                 color: '#ff4e00', glyph: 'play',       category: 'Eğlence' },
  { name: 'TOD',                  color: '#00a651', glyph: 'play',       category: 'Eğlence' },
  { name: 'Tabii',                color: '#00b3a4', glyph: 'play',       category: 'Eğlence' },
  { name: 'MUBI',                 color: '#e4572e', glyph: 'film',       category: 'Eğlence' },
  { name: 'Crunchyroll',          color: '#f47521', glyph: 'play',       category: 'Eğlence' },
  { name: 'Twitch',               color: '#9146ff', glyph: 'play',       category: 'Eğlence' },
  { name: 'Apple TV+',            color: '#8e8e93', glyph: 'tv',         category: 'Eğlence' },
  { name: 'Digiturk',             color: '#e4002b', glyph: 'tv',         category: 'Eğlence' },
  { name: 'D-Smart',              color: '#f7941d', glyph: 'tv',         category: 'Eğlence' },

  // Müzik / ses
  { name: 'Spotify',              color: '#1db954', glyph: 'music',      category: 'Müzik' },
  { name: 'Apple Music',          color: '#fa243c', glyph: 'music',      category: 'Müzik' },
  { name: 'YouTube Music',        color: '#ff0000', glyph: 'music',      category: 'Müzik' },
  { name: 'Deezer',               color: '#a238ff', glyph: 'music',      category: 'Müzik' },
  { name: 'fizy',                 color: '#e6007e', glyph: 'music',      category: 'Müzik' },
  { name: 'Tidal',                color: '#00c2c2', glyph: 'music',      category: 'Müzik' },
  { name: 'Audible',              color: '#f8991c', glyph: 'headphones', category: 'Müzik' },
  { name: 'Storytel',             color: '#f73e5a', glyph: 'headphones', category: 'Haber & Yayın' },

  // Oyun
  { name: 'Xbox Game Pass',       color: '#107c10', glyph: 'gamepad',    category: 'Oyun' },
  { name: 'PlayStation Plus',     color: '#0070d1', glyph: 'gamepad',    category: 'Oyun' },
  { name: 'Nintendo Switch Online', color: '#e60012', glyph: 'gamepad',  category: 'Oyun' },
  { name: 'EA Play',              color: '#ff4747', glyph: 'gamepad',    category: 'Oyun' },
  { name: 'Steam',                color: '#3a6a91', glyph: 'gamepad',    category: 'Oyun' },
  { name: 'Discord Nitro',        color: '#5865f2', glyph: 'mic',        category: 'Oyun' },

  // Yazılım / yapay zekâ
  { name: 'ChatGPT Plus',         color: '#10a37f', glyph: 'sparkles',   category: 'Yazılım' },
  { name: 'Claude Pro',           color: '#d97757', glyph: 'sparkles',   category: 'Yazılım' },
  { name: 'Gemini',               color: '#4285f4', glyph: 'sparkles',   category: 'Yazılım' },
  { name: 'GitHub Copilot',       color: '#6e7681', glyph: 'code',       category: 'Yazılım' },
  { name: 'Cursor',               color: '#4d4d55', glyph: 'code',       category: 'Yazılım' },
  { name: 'JetBrains',            color: '#ff318c', glyph: 'code',       category: 'Yazılım' },
  { name: 'Adobe Creative Cloud', color: '#da1f26', glyph: 'palette',    category: 'Yazılım' },
  { name: 'Microsoft 365',        color: '#d83b01', glyph: 'briefcase',  category: 'Yazılım' },
  { name: 'Canva',                color: '#00c4cc', glyph: 'palette',    category: 'Yazılım' },
  { name: 'Figma',                color: '#f24e1e', glyph: 'palette',    category: 'Yazılım' },
  { name: 'Notion',               color: '#787774', glyph: 'book',       category: 'Yazılım' },
  { name: 'Zoom',                 color: '#2d8cff', glyph: 'camera',     category: 'Yazılım' },
  { name: 'Slack',                color: '#611f69', glyph: 'mail',       category: 'Yazılım' },

  // Bulut / depolama
  { name: 'iCloud+',              color: '#3693f3', glyph: 'cloud',      category: 'Bulut & Depolama' },
  { name: 'Google One',           color: '#4285f4', glyph: 'cloud',      category: 'Bulut & Depolama' },
  { name: 'Dropbox',              color: '#0061ff', glyph: 'box',        category: 'Bulut & Depolama' },
  { name: 'OneDrive',             color: '#0364b8', glyph: 'cloud',      category: 'Bulut & Depolama' },

  // Eğitim
  { name: 'Duolingo',             color: '#58cc02', glyph: 'graduation', category: 'Eğitim' },
  { name: 'Udemy',                color: '#a435f0', glyph: 'graduation', category: 'Eğitim' },
  { name: 'Coursera',             color: '#0056d2', glyph: 'graduation', category: 'Eğitim' },

  // İletişim
  { name: 'Turkcell',             color: '#e0b100', glyph: 'phone',      category: 'İletişim' },
  { name: 'Vodafone',             color: '#e60000', glyph: 'phone',      category: 'İletişim' },
  { name: 'Türk Telekom',         color: '#522e91', glyph: 'phone',      category: 'İletişim' },
  { name: 'Telegram Premium',     color: '#2aabee', glyph: 'mail',       category: 'İletişim' },
  { name: 'X Premium',            color: '#6b7280', glyph: 'globe',      category: 'Haber & Yayın' },
  { name: 'LinkedIn Premium',     color: '#0a66c2', glyph: 'briefcase',  category: 'Diğer' },

  // Alışveriş / yaşam
  { name: 'Trendyol',             color: '#f27a1a', glyph: 'cart',       category: 'Diğer' },
  { name: 'Hepsiburada Premium',  color: '#ff6000', glyph: 'cart',       category: 'Diğer' },
  { name: 'Getir',                color: '#5d3ebc', glyph: 'cart',       category: 'Diğer' },
  { name: 'Yemeksepeti',          color: '#fa0050', glyph: 'cart',       category: 'Diğer' },
  { name: 'Migros',               color: '#e30613', glyph: 'cart',       category: 'Diğer' },

  // Sağlık / spor
  { name: 'MAC Fit',              color: '#ff5a1f', glyph: 'dumbbell',   category: 'Sağlık & Spor' },
  { name: 'Spor salonu',          color: '#f97316', glyph: 'dumbbell',   category: 'Sağlık & Spor' },
  { name: 'Strava',               color: '#fc4c02', glyph: 'heart',      category: 'Sağlık & Spor' },

  // Diğer
  { name: 'VPN',                  color: '#4687ff', glyph: 'shield',     category: 'Diğer' },
  { name: 'Patreon',              color: '#ff424d', glyph: 'heart',      category: 'Diğer' },
  { name: 'Kindle Unlimited',     color: '#ff9900', glyph: 'book',       category: 'Haber & Yayın' },
  { name: 'Barınma / kira',       color: '#64748b', glyph: 'home',       category: 'Barınma' },
  { name: 'Elektrik / doğalgaz',  color: '#eab308', glyph: 'bolt',       category: 'Barınma' },
  { name: 'Su',                   color: '#38bdf8', glyph: 'droplet',    category: 'Barınma' },
  { name: 'İnternet',             color: '#22c55e', glyph: 'wifi',       category: 'İletişim' },
];

// Arama: Türkçe karakterleri de kapsayacak şekilde küçült.
export function searchCatalog(query) {
  const q = (query || '').trim().toLocaleLowerCase('tr');
  if (!q) return CATALOG;
  return CATALOG.filter((item) =>
    item.name.toLocaleLowerCase('tr').includes(q) ||
    item.category.toLocaleLowerCase('tr').includes(q)
  );
}
