FILM DÖNÜŞTÜRÜCÜ — GITHUB PAGES HAZIR SÜRÜM

Bu sürüm Vite/npm derlemesi istemez. Dosyaların tamamını GitHub deponun ana dizinine yükle:
- index.html
- app.js
- style.css
- manifest.webmanifest
- sw.js
- icon.svg

GitHub Pages: Depo > Settings > Pages > Deploy from a branch > main / root.

Notlar:
- İlk dönüştürmede internet bağlantısı gerekir; FFmpeg modülü ve çekirdeği CDN üzerinden yüklenir.
- MP4: H.264/AAC, yuv420p.
- Orijinal dosya silme yalnızca desteklenen tarayıcıda klasör seçilirse çalışır.
- Android Chrome'da klasör seçimi API'si desteklenmeyebilir. Dosya seçimiyle dönüştürülen orijinal dosya otomatik silinmez.
- Telefonlarda büyük dosyalar bellek ve işlemci sınırına takılabilir.
