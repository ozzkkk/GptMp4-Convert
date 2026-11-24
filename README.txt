MP4 DÖNÜŞTÜRÜCÜ — CORE ESM FIX V7

Bu sürümde tespit edilen çekirdek formatı uyuşmazlığı düzeltildi:
- Önceki sürüm @ffmpeg/core paketinin dist/umd/ffmpeg-core.js dosyasını yüklüyordu.
- @ffmpeg/ffmpeg 0.12.10 worker'ı modül worker olarak çalışır ve çekirdeği dynamic import ile yükler; bu nedenle ESM çekirdeği gerekir.
- Yeni sürüm dist/esm/ffmpeg-core.js ve aynı klasördeki ffmpeg-core.wasm dosyalarını kullanır.

GitHub Pages ana dizinindeki dosyaları ZIP içindekilerle değiştir:
index.html, app.js, style.css, manifest.webmanifest, sw.js, worker.js, icon.svg.

Bu düzeltme kod incelemesinde bulunan UMD/ESM uyumsuzluğunu hedefler. Gerçek telefonda dönüşüm testi yapılmadan başarılı olduğu varsayılmamalıdır.
İlk çekirdek indirmesi için internet bağlantısı gerekir.
