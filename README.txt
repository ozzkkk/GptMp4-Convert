FILM DÖNÜŞTÜRÜCÜ — GITHUB PAGES HAZIR SÜRÜM (WORKER DÜZELTMESİ)

Bu sürüm FFmpeg WebAssembly worker dosyasını CDN'den alıp Blob URL olarak yükler. Böylece farklı origin kaynaklı worker kurma hatasını önlemeyi amaçlar.

GitHub deponun ana dizinindeki dosyaları aşağıdaki 7 dosyayla değiştir:
- index.html
- app.js
- style.css
- manifest.webmanifest
- sw.js
- icon.svg
- README.txt

ÖNEMLİ: Güncellemeden sonra siteyi Chrome'da tamamen kapatıp yeniden aç. Hâlâ eski sürüm görünürse site verilerini/önbelleğini temizle veya gizli sekmede dene.

- İlk dönüştürmede internet bağlantısı gerekir.
- MP4: H.264/AAC, yuv420p.
- Orijinal dosya silme yalnızca desteklenen tarayıcıda klasör seçilirse çalışır.
- Telefonlarda büyük dosyalar bellek ve işlemci sınırına takılabilir.
