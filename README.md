# Abonelikler

Aylık ve yıllık abonelikleri takip eden, telefona ve bilgisayara kurulabilen PWA.
Derleme adımı yok, bağımlılık yok — dosyalar doğrudan çalışıyor.

- Yerel-öncelikli: veriler cihazda tutulur, uygulama internetsiz de açılır.
- Supabase ile senkron: aynı hesapla girdiğin her cihazda aynı liste.
- Çoklu para birimi (TRY/USD/EUR/GBP), kurlar otomatik çekilir.
- 70+ popüler servis hazır listede; olmayan için 37 simge ve 30 renk.
- Yaklaşan ödemeler, kategori dağılımı, deneme sürümü takibi, JSON yedek.

## Dosyalar

| Yol | Ne işe yarar |
|---|---|
| `index.html` · `styles.css` | Arayüz iskeleti |
| `js/model.js` | Tarih/para hesapları (saf fonksiyonlar) |
| `js/store.js` | Yerel veri deposu (localStorage) |
| `js/sync.js` | Supabase senkronu |
| `js/rates.js` | Otomatik döviz kuru |
| `js/catalog.js` | Popüler servis listesi |
| `js/glyphs.js` | Simge çizimleri |
| `js/app.js` | Arayüz mantığı |
| `sw.js` · `manifest.webmanifest` | Çevrimdışı çalışma ve "kurulabilir" olma |
| `config.js` | Supabase adresi ve anahtarı |
| `supabase/schema.sql` | Sunucudaki tablolar ve güvenlik kuralları |
| `tools/serve.ps1` | Yerelde denemek için mini sunucu |
| `tools/make-icons.ps1` | İkonları yeniden üretir |

## 1. Yerelde çalıştırma

```
powershell -ExecutionPolicy Bypass -File tools\serve.ps1
```

Sonra tarayıcıda `http://localhost:8080`.

> `index.html` dosyasına çift tıklamak **çalışmaz** — tarayıcılar `file://` üzerinden
> JavaScript modüllerini engelliyor. Bu yüzden ya yukarıdaki sunucu ya da yayına almak gerekiyor.

## 2. Supabase kurulumu (senkron için, tek seferlik)

1. Supabase panelinde **SQL Editor → New query**
2. `supabase/schema.sql` dosyasının tamamını yapıştır → **Run**
3. **Authentication → Sign In / Providers → Email** altında:
   - "Confirm email" **kapalıysa** hesap açar açmaz girersin (kişisel kullanım için pratik).
   - Açık bırakırsan hesap oluşturduktan sonra e-postandaki bağlantıya tıklaman gerekir.

Uygulamada **Ayarlar → Giriş yap → Hesabım yok, oluştur** ile hesabını aç.
Aynı e-posta/parola ile telefondan da gir; iki cihaz eşitlenir.

Güvenlik notu: `config.js` içindeki anahtar "publishable/anon" anahtarıdır, istemcide
durması normaldir. Veriyi koruyan şey `schema.sql` içindeki RLS kurallarıdır — herkes
yalnızca kendi satırlarını okuyabilir. `service_role` anahtarı **asla** bu projeye girmemeli.

## 3. Yayına alma (telefona kurmak için şart)

iOS bir web uygulamasını ancak **HTTPS** üzerinden ana ekrana ekletiyor. Ücretsiz yol:

```
git init
git add .
git commit -m "ilk surum"
git branch -M main
git remote add origin https://github.com/KULLANICI/abonelikler.git
git push -u origin main
```

GitHub'da depo → **Settings → Pages → Source: Deploy from a branch → main / (root)**.
Bir iki dakika sonra adres: `https://KULLANICI.github.io/abonelikler/`

Depoyu **private** yapabilirsin; GitHub Pages ücretsiz planda private depoyu yayınlamaz,
o yüzden ya public bırak (içinde kişisel veri yok, sadece kod var) ya da Cloudflare Pages kullan.

## 4. Uygulama olarak kurma

**iPhone:** Safari'de adresi aç → paylaş tuşu → **Ana Ekrana Ekle**.
(Chrome'dan değil, Safari'den yapmak gerekiyor.)

**Windows:** Edge veya Chrome'da adres çubuğunun sağındaki **Uygulamayı yükle** ikonu,
ya da ⋯ menüsü → **Uygulamalar → Bu siteyi uygulama olarak yükle**.

Her ikisinde de kendi ikonuyla, adres çubuğu olmadan açılır.

## Güncelleme

Dosyaları değiştirip tekrar `git push` yeterli. Service worker "önce ağ" çalıştığı için
uygulama bir sonraki açılışta yeni sürümü alır. Büyük değişikliklerde `sw.js` içindeki
`CACHE = 'abo-v1'` sürümünü artır.

## Döviz kurları

Açılışta ve 6 saatte bir otomatik çekiliyor; Ayarlar'daki tuşla elle de yenilenebiliyor.
Çevrimdışıyken son bilinen kur kullanılır.

Kaynak sırayla `open.er-api.com`, olmazsa `api.frankfurter.app`. İkisi de anahtar
istemiyor ve tarayıcıdan okunmaya izin veriyor (CORS).

**doviz.com neden kullanılmıyor:** tarayıcılar bir sayfanın başka bir siteden veri
okumasını CORS kuralıyla engelliyor, doviz.com da izin başlığı göndermiyor. İstemciden
çekmek mümkün değil. Özellikle onun serbest piyasa rakamları isteniyorsa, veriyi sunucu
tarafında alıp uygulamaya sunan bir Supabase Edge Function yazmak gerekir.

## Bilinen sınırlar

- iOS'ta gerçek bildirim (push) yok; yaklaşan ödemeler uygulamayı açtığında görünür.
- Servis logoları resmî logo değil, marka rengiyle boyanmış simge/baş harf rozeti
  (bkz. `js/catalog.js` başındaki not).
- Çakışma çözümü "son yazan kazanır" — iki cihazda aynı aboneliği aynı anda düzenlersen
  en son kaydedilen kalır.
