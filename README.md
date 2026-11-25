# GptMp4 Convert

GptMp4 Convert, Vite tabanlı video dönüştürme PWA'sı ve Windows masaüstü kabuğu içerir.

## PWA geliştirme
Node.js 20+:
- `npm install`
- `npm run dev`
- `npm run build`

## Windows masaüstü sürümü (ilk geliştirme aşaması)
Masaüstü kabuğu Electron kullanır:
- `npm install`
- `npm run desktop:dev`
- Taşınabilir Windows EXE: `npm run desktop:pack`

İlk masaüstü prototipinde ana dönüştürme ekranı korunur. **Uygulama içi tarayıcı** ayrı bir uygulama penceresi açar. Medya algılama yalnızca bu pencerenin kendi Electron oturumundaki HTTP/HTTPS yanıtlarını izler; harici Chrome/Edge sekmeleri izlenmez.

Şu an algılama katmanı doğrudan MP4/WebM, HLS (.m3u8), DASH (.mpd) ve Content-Type ile tanınabilen video/ses yanıtlarını listeler. Bu ilk temel katmandır; MSE tabanlı akışların ve Flux Downloader'ın diğer ayrıştırıcılarının entegrasyonu sonraki geliştirme adımıdır. Bu aşamada algılanan medya bağlantıları listelenip kopyalanabilir; henüz indirme motoru bağlanmamıştır.

## Güvenlik ve kapsam
- Uzak sayfalar Node.js veya yerel dosya sistemine erişemez.
- Electron preload köprüleri sınırlı IPC metotları sunar.
- Tarayıcı yalnızca HTTP/HTTPS adreslerini açar ve yeni pencere/popup isteklerini engeller.
- DRM korumasını aşma veya korumalı akışları çözme hedeflenmez.
- Bazı siteler özel oynatıcılar, imzalı URL'ler veya DRM kullandığından her videonun algılanacağı garanti edilemez.

## Dönüştürme
- FFmpeg WebAssembly çekirdeği ilk çalıştırmada CDN'den yüklenir.
- MP4 profili H.264/AAC, yuv420p ve faststart kullanır.
- Büyük videolar tarayıcı belleği ve işlemci sınırlarına takılabilir.
