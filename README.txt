MP4 DONUSTURUCU — CONTAINER FIX V9

Bu sürüm dosya adındaki uzantıya güvenmek yerine dosyanın başındaki baytlardan kapsayıcıyı tanır:
- MPEG-TS için 188 bayt aralıklı 0x47 senkron baytları kontrol edilir.
- MP4 için ftyp kutusu kontrol edilir.
- Liste üzerinde dosya adı ve gerçek içerik türü ayrı gösterilir.

TS içerikli dosyalar FFmpeg'e geçici .ts adıyla verilir ve `-f mpegts` ile açıkça tanıtılır.
MP4 çıkışında önce `-c copy` ile yeniden kodlamadan kayıpsız aktarım yapılır. Bu dosya için H.264/AAC akışları MP4'e uyumludur; yeniden kodlama gerekmemelidir.
Diğer formatlarda mevcut dönüştürme profilleri kullanılır.

GitHub Pages ana dizinindeki dosyaları ZIP'teki dosyalarla değiştir: index.html, app.js, style.css, manifest.webmanifest, sw.js, worker.js, icon.svg.
İlk açılışta FFmpeg çekirdeği için internet gerekir. Telefon performansı cihazda test edilmelidir.
