FILM DÖNÜŞTÜRÜCÜ — WORKER ORIGIN FIX V4

Bu sürüm FFmpeg'in ana Worker giriş dosyasını GitHub Pages alan adından (`./worker.js`) başlatır. Yerel worker, resmi FFmpeg worker modülünü jsDelivr'den import eder. Böylece Worker constructor'a doğrudan CDN adresi verilmez.

GitHub deponun ana dizinindeki dosyaları bu ZIP'teki dosyalarla değiştir:
- index.html
- app.js
- style.css
- manifest.webmanifest
- sw.js
- worker.js (YENİ DOSYA)
- icon.svg
- README.txt

ÖNEMLİ:
1. worker.js dosyasını da mutlaka GitHub ana dizinine yükle.
2. Commit/publish sonrası Chrome'da sayfayı tamamen kapatıp tekrar aç.
3. Eski service worker önbelleği kalırsa siteyi gizli sekmede açarak dene veya site verilerini temizle.

İlk FFmpeg çekirdek indirmesinde internet gerekir. MP4 profili H.264/AAC ve yuv420p kullanır. Orijinal silme yalnızca desteklenen klasör erişimi modunda çalışır.
