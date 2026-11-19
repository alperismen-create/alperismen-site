# alperismen.com yeniden tasarım — konuşma özeti

Tarih: 12 Kasım 2026

## Amaç

Mevcut Wix sitesini (alperismen.com) Awwwards'tan seçilen bir örneğe benzeterek sıfırdan kurmak.
Seçilen örnek: **giordanobetti.com** (bağımsız görüntü yönetmeni portfolyosu).

## Şu anki durum

- Site yayında: https://alperismen.com (GitHub Pages, önünde Cloudflare).
- **19 Kasım 2026'dan beri Wix'ten çıkıldı:** DNS ve sertifika Cloudflare'de (ücretsiz plan, ad sunucuları `harlee`/`keaton.ns.cloudflare.com`, kayıtlar proxied, SSL modu Full, Always Use HTTPS açık). www'nin sertifikasını Cloudflare veriyor; GitHub'daki www sertifika takılması artık önemsiz. Alan adı kaydı Wix'ten Cloudflare Registrar'a aktarılıyor ($11.17/yıl; bitiş 22 Tem 2028 → 22 Tem 2029). Wix Premium Mini iptal edildi (otomatik yenileme kapalı, 26 May 2029'a kadar aktif); eski Wix sitesi alan adından ayrıldı.
- Depo: `alperismen-create/alperismen-site` (açık). Site dosyaları, `tools/` ve bu not aynı depoda; yalnızca `tools/realesrgan` (büyük, kullanılmıyor) depoda yok.
- Klasör: `Masaüstü\projeler\alperismen-site` — VS Code'da bu klasör açılır.
- Önizleme: `python tools/serve.py` çalıştırıp `http://localhost:5510` adresini açmak.
- Fotoğraflar Alper'in seçkisinden: `Masaüstü\alperismen.com\alper seçki` (`iş` = Editorial, `belgesel` = Documentary). Yeniden üretmek için: `python tools/build.py "C:/Users/ikara/Desktop/alperismen.com/alper seçki"`. İlk sıradaki kareler `tools/series.json` içindeki `first` listesinden gelir.

## Sitenin yapısı

| Sayfa | İçerik |
|---|---|
| Ana sayfa | Showreel solda çerçevede sessiz oynar; arkada aynı videonun yumuşatılmış hali ve hafif gren var. Çerçeveye tıklayınca büyür, ses açılır, oynatıcı kontrolleri gelir. |
| Fotoğraf | İki alan: **Editorial** (iş fotoğrafları) ve **Documentary** (sokak ve Hindistan). Her kare tek başına açılır ve pencereye sığar; altta kare başına bir çizgi olan zaman çizgisi var. |
| Hakkında | Solda büyük portre, sağda tek sütun biyografi. |
| İletişim | Yalnızca e-posta ve adres satırı. |

- **Diller:** İngilizce (varsayılan açılış), Türkçe, İspanyolca. Sağ üstte `TR / EN / ES` seçici; seçim tarayıcıda hatırlanır.
- **Font:** Inter (düz sans-serif).
- Telefon görünümü var ve denendi.

## Alper'in verdiği kararlar

- Örnek site: Giordano Betti.
- Ana sayfa showreel ile açılır; **video listesi yok**, yalnızca showreel.
- **Fotoğraf seri listesi yok.**
- Serif font istenmedi; minimalist düz font.
- **Telefon numarası sitede olmayacak.**
- Gren yalnızca arka plandaki videoda, ana videoda değil; abartısız.
- Arka plan videosu fazla yakınlaştırılmayacak, ne döndüğü seçilecek.
- Ana video büyük olacak (ekran genişliğinin %54'ü).
- Fotoğraflar alt alta dizilmeyecek; pencere boyutuna göre ölçeklenecek.
- Fotoğraf sayfasında Editorial ve Documentary diye iki alan; Editorial = iş fotoğrafları.
- Site tek dilde görünecek, dil seçici olacak; varsayılan İngilizce.
- Kaldırılan yazılar: "Ankara merkezli fotoğrafçı ve film yapımcısı", "Showreel / Basic Photography&Video", Hakkında ve İletişim sayfalarındaki küçük etiketler.
- Editorial / Documentary yazıları fotoğrafın sol üst köşesinde, fotoğrafa yapışık olmadan.
- **Claude'un yaptığı fotoğraf seçkisi beğenilmedi**; Alper kendi seçkisini verecek.

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `index.html`, `style.css`, `app.js` | Sitenin kendisi |
| `i18n.js` | Üç dildeki tüm metinler |
| `data.js` | Fotoğraf listesi (otomatik üretilir, elle düzenlenmez) |
| `img/` | Web için küçültülmüş fotoğraflar (otomatik üretilir) |
| `media/` | Showreel (42 MB), arka plan kopyası, kapak karesi, portre |
| `tools/series.json` | Hangi klasör hangi seri, hangi alan |
| `tools/build.py` | Seçki klasöründen `img/` ve `data.js` üretir |
| `tools/serve.py` | Yerel önizleme sunucusu |

Fotoğrafları değiştirmek için: seçki klasörünü ve `tools/series.json` dosyasını güncelle, sonra
`python tools/build.py <seçki klasörü>` çalıştır.

## Arşiv ve mevcut seçki

- Arşiv: `Masaüstü\alperismen.com` (6.678 dosya, 40,6 GB). Orijinallere dokunulmadı.
- Claude'un seçkisi: `Masaüstü\alperismen.com\_secki` (kopyalar). Editorial 46 kare, Documentary 56 kare.
- Showreel kaynağı: `showreel\1büyük.mp4` (273 MB). Sitedeki kopya üstten ve alttan siyah bantları kırpılmış ve sıkıştırılmış halidir.

## Açık konular

- **Yayın (12 Kasım 2026, yapıldı):** Site GitHub Pages'te, depo `alperismen-create/alperismen-site` (açık). Ana adres https://alperismen.com; sertifika GitHub tarafından otomatik yenilenir. Alan adı Wix'te kalıyor; Wix DNS'te 4 A kaydı (185.199.108–111.153) ve `www` CNAME → `alperismen-create.github.io`. Güncellemek için: değişikliği commit edip `git push`; CSS/JS/data.js değiştiyse `index.html` içindeki `?v=` etiketini de değiştir (yoksa tarayıcı önbelleği eski dosyayla karışır). Eski Wix adresleri (`/videography`, `/photography`, `/bio-contact`) `404.html` ile yeni sayfalara yönlenir. Wix Premium site aboneliği artık gereksiz, iptali konuşulmadı.
- **www sertifikası:** GitHub tarafında takılı kaldı; Cloudflare önüne alınarak çözüldü (yukarıya bakın).
- **İspanyolca metinler** Claude'un çevirisi; anadili İspanyolca olan biri kontrol etmedi.
- **Küçük dosyalar:** İş fotoğraflarının yarısı 1.000–1.500 piksel (`iş\küçük` klasöründen). Portre 800 piksel. Orijinalleri gelirse değiştirilecek.
- **Bozuk dosyalar:** Arşivde `portfolyo` altında 19 fotoğraf 0 bayt; diskten yeniden kopyalanması gerekiyor.
- **Sağdaki ince siyah çizgi:** Video çerçeve içinde %2 büyütülerek giderildi; tüm planlarda tek tek kontrol edilmedi.
- **Otomatik oynatma** gerçek bir tarayıcıda gözle doğrulanmadı.
- **Siteye alınmayanlar** (Alper'in kararı): makam portreleri, şarkıcı portresi, takım posteri, Varanasi ölü yakma kareleri, Beşiktaş olayları.
- Önizleme için Lego Defense projesinin `.claude\launch.json` dosyasına `alperismen-site` girişi eklendi; o projeye başka etkisi yok.
