MP4 DÖNÜŞTÜRÜCÜ V11 — DOSYA SEÇİCİ DÜZELTMESİ

- Dosyalardan video seç kontrolü artık doğrudan HTML label-for bağlantısıyla yerel dosya input'unu açar. Android Chrome/PWA'da gizli input.click() çağrısına bağımlı değildir.
- Dosya input'u artık display:none/hidden değildir; erişilebilir biçimde görsel olarak gizlenmiştir.
- accept filtresi video/* ve yaygın video uzantılarını içerir; seçim çoklu dosyayı destekler.
- İki seçim düğmesi mobil ekranda yan yana, eşit genişlikte hizalanır.
- Service Worker önbelleği V11 olarak yenilenir.

GitHub ana dizinindeki 8 dosyayı ZIP'tekilerle değiştirin:
index.html, app.js, style.css, manifest.webmanifest, sw.js, worker.js, icon.svg, README.txt.
