MP4 DONUSTURUCU — GITHUB PAGES CACHE FIX V5

Bu güncelleme, önceki Service Worker'ın eski cache kayıtlarını kullanmaya devam etmesi ihtimalini giderir.

YÜKLEME:
1. ZIP içindeki 7 dosyanın tamamını GitHub deposunun ana dizinine yükleyip eskilerin üzerine yaz.
2. Commit işlemini tamamla ve GitHub Pages'in yayınlanmasını bekle.
3. Sayfayı Chrome'da kapatıp tekrar aç. Bu sürüm Service Worker etkinleştiğinde eski uygulama cache'lerini temizler.
4. İlk açılışta internet bağlantısı açık olsun.

Dosyalar:
- index.html
- app.js
- style.css
- manifest.webmanifest
- sw.js
- worker.js
- icon.svg
- README.txt

Teknik değişiklik:
- Uygulama scripti app.js?v=5 olarak sürümlendi.
- Worker adresi sayfanın kendi alan adına sabitlendi.
- Service Worker artık sadece kendi cache sürümünden okur.
- Aktivasyonda önceki cache sürümleri silinir.
- worker.js çevrimdışı uygulama dosyaları arasına eklendi.

Not: Worker dosyasının aynı-origin başlangıcı düzeltilmiştir; worker modülünün CDN'den import edilebilmesi için ilk çalıştırmada internet ve CDN erişimi gerekir. Telefon üzerinde son doğrulama testi yapılmalıdır.
