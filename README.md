# Film Dönüştürücü PWA — Tek Klasör

Tüm uygulama dosyaları aynı klasördedir; `src` ve `public` klasörleri yoktur.

## GitHub Pages için
1. Bu ZIP'i telefonda açıp içindeki dosyaları çıkarın.
2. GitHub'da bir depo oluşturun.
3. ZIP içindeki dosyaların tamamını deponun ana dizinine yükleyin (index.html ana dizinde olmalı).
4. GitHub Pages'i Settings → Pages bölümünden etkinleştirin.
5. Vite tabanlı bu sürüm için derleme gerekir: GitHub Actions ile `npm install` ve `npm run build` çalıştırıp `dist` klasörünü yayınlayın. Alternatif olarak bilgisayarda `npm run build` sonrası `dist` içeriğini Pages'e yükleyin.

## Yerel geliştirme
Node.js 20+:
- `npm install`
- `npm run dev`
- Yayın paketi: `npm run build`

## Önemli
- FFmpeg WebAssembly ilk çalıştırmada çekirdeği CDN'den indirir; ilk açılışta internet gerekir.
- MP4 profili H.264/AAC, yuv420p ve faststart kullanır.
- Otomatik orijinal silme sadece desteklenen tarayıcıda klasör seçimi ile çalışabilir. Normal dosya seçicide orijinal silinmez.
- Büyük videolar telefonda bellek/işlemci sınırına takılabilir.
