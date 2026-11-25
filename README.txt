FILM DÖNÜŞTÜRÜCÜ V13.0

V13 düzeltmeleri:
- Dosya seçimi sonrası dosyalar tek tek incelenir; video MIME türü, uzantısı veya dosya imzası ile tanınır.
- Uzantısı/MIME bilgisi eksik gelen MP4, TS, MKV, AVI ve benzeri yaygın video dosyaları için içerik imzası kontrolü eklendi.
- Klasör seçimi önce doğrudan klasör erişimini dener.
- Doğrudan klasör erişimi desteklenmiyorsa webkitdirectory klasör seçicisine geçer.
- Alternatif klasör seçicide orijinaller otomatik silinmez ve çıktı indirme olarak verilir; tarayıcı bu yöntemde klasöre yazma/silme izni sağlamaz.
- Service Worker ve uygulama önbelleği V13 olarak yenilendi.

GitHub deposunun ana dizinindeki dosyaları ZIP içindeki dosyalarla değiştirin.
Dosyalar: index.html, app.js, style.css, sw.js, worker.js, manifest.webmanifest, icon.svg, README.txt.

Not: Klasörün aynı konumuna çıktı kaydetme ve orijinal silme yalnızca showDirectoryPicker destekleyen tarayıcıda ve kullanıcı klasör erişim izni verdiğinde mümkündür.
