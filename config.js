// Supabase bağlantı ayarları.
// Supabase panelinde: Project Settings -> API sayfasındaki değerler.
// Buradaki anahtar "publishable/anon" anahtarıdır; istemcide durması normaldir,
// veriyi koruyan şey RLS kurallarıdır (supabase/schema.sql).
// service_role anahtarı ASLA bu dosyaya yazılmamalı.

window.APP_CONFIG = {
  SUPABASE_URL: 'https://ylpkzkxzzrjcmudnmpqm.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_SiUbNdeh9F-fJIceSPRMPA_xXCsjWet',
};
