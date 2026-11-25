
import { FFmpeg } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js';

const $ = id => document.getElementById(id);
const fileInput = $('fileInput');
const filePickBtn = $('filePickBtn');
const folderInput = $('folderInput');
const fileList = $('fileList');
const format = $('format');
const deleteOriginal = $('deleteOriginal');
const convertBtn = $('convertBtn');
const status = $('status');
const progressBar = $('progressBar');
const progressText = $('progressText');
const results = $('results');

let selected = [];
let directoryHandle = null;
let ffmpeg = null;
let loading = null;
let busy = false;

const profiles = {
  mp4: 'H.264 video • AAC ses • 8-bit yuv420p • MP4 faststart',
  mkv: 'H.264 video • AAC ses • MKV kapsayıcı',
  webm: 'VP9 video • Opus ses • WebM kapsayıcı',
  avi: 'MPEG-4 video • MP3 ses • AVI kapsayıcı'
};

format.onchange = () => {
  $('profile').textContent = profiles[format.value];
  renderList();
};

function sizeText(n) {
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < 3) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
}

async function isVideo(file) {
  const ext = /\.(mp4|mkv|avi|mov|wmv|flv|ts|mts|m4v|webm|mpeg|mpg|3gp|m2ts)$/i.test(file.name);

  if (file.type?.startsWith('video/') || ext) return true;

  try {
    const b = new Uint8Array(await file.slice(0, 512).arrayBuffer());
    const ascii = a => String.fromCharCode(...b.slice(a, a + 4));

    if (
      ascii(4) === 'ftyp' ||
      ascii(0) === 'RIFF' ||
      ascii(0) === 'OggS' ||
      ascii(0) === '\u001aE\u00df\u00a3'
    ) return true;

    if (b[0] === 0x47 && b[188] === 0x47) return true;
    if (b[0] === 0 && b[1] === 0 && b[2] === 1) return true;

  } catch (e) {
    console.warn('Dosya türü okunamadı', e);
  }

  return false;
}

async function detectContainer(file) {
  const b = new Uint8Array(await file.slice(0, 600).arrayBuffer());

  for (const offset of [0, 4, 8]) {
    if (
      b[offset] === 0x47 &&
      b[offset + 188] === 0x47 &&
      b[offset + 376] === 0x47
    ) return 'mpegts';
  }

  for (let i = 0; i < Math.min(64, b.length - 4); i++) {
    if (
      b[i] === 0x66 &&
      b[i + 1] === 0x74 &&
      b[i + 2] === 0x79 &&
      b[i + 3] === 0x70
    ) return 'mp4';
  }

  return 'auto';
}

function outputName(item) {
  const ext = format.value;
  const stem = item.file.name.replace(/\.[^.]+$/, '');
  return `${stem}.${ext}`;
}

function renderList() {
  fileList.replaceChildren();

  $('queueCount').textContent = `${selected.length} video`;

  if (!selected.length) {
    fileList.innerHTML = '<div class="empty">Henüz video eklenmedi.</div>';
  }

  selected.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'file';

    const main = document.createElement('div');
    main.className = 'file-main';

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.file.name;

    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent =
      `${sizeText(item.file.size)} · ${
        item.container === 'mpegts' ? 'TS içerik' :
        item.container === 'mp4' ? 'MP4 içerik' :
        'Biçim otomatik'
      } · Çıkış: ${outputName(item)}`;

    main.append(name, meta);

    const side = document.createElement('div');
    side.className = 'file-side';

    const state = document.createElement('span');
    state.className = 'file-state' +
      (item.state === 'done' ? ' done' :
       item.state === 'error' ? ' error' : '');

    state.textContent =
      item.state === 'done' ? '✓ Tamamlandı' :
      item.state === 'error' ? 'Hata' :
      item.state === 'working' ? 'Dönüşüyor' :
      'Bekliyor';

    side.append(state);

    if (!busy && item.state !== 'done') {
      const rm = document.createElement('button');
      rm.className = 'remove';
      rm.textContent = '✕';
      rm.title = 'Listeden kaldır';
      rm.onclick = () => {
        selected.splice(i, 1);
        renderList();
      };
      side.append(rm);
    }

    row.append(main, side);
    fileList.append(row);
  });

  convertBtn.disabled = busy || !selected.some(x => x.state !== 'done');
  $('clearBtn').disabled = busy || !selected.length;
  $('addMoreBtn').disabled = busy;
}

async function addFiles(files, handles = []) {
  let added = 0;
  let skipped = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];

    if (!(await isVideo(f))) {
      skipped++;
      continue;
    }

    if (selected.some(x =>
      x.file.name === f.name && x.file.size === f.size
    )) continue;

    const container = await detectContainer(f);

    selected.push({
      file: f,
      handle: handles[i] || null,
      container,
      state: 'waiting'
    });

    added++;
  }

  renderList();

  status.textContent = added
    ? `${added} video dönüşüm listesine eklendi.${skipped ? ` ${skipped} video olmayan dosya atlandı.` : ''}`
    : skipped
      ? `${skipped} dosya video olmadığı için eklenmedi.`
      : 'Yeni video eklenmedi.';
}

async function chooseVideos() {
  // Dosya sistemi erişimi destekleniyorsa gerçek dosya tutamaçları alınır.
  if (window.showOpenFilePicker) {
    try {
      const handles = await window.showOpenFilePicker({
        multiple: true,
        types: [{
          description: 'Video dosyaları',
          accept: {
            'video/*': [
              '.mp4', '.mkv', '.avi', '.mov', '.wmv',
              '.flv', '.ts', '.mts', '.m2ts', '.m4v',
              '.webm', '.mpeg', '.mpg', '.3gp'
            ]
          }
        }]
      });

      const files = [];

      for (const handle of handles) {
        files.push(await handle.getFile());
      }

      await addFiles(files, handles);

      $('deleteHint').textContent =
        'Aynı uzantılı çıktı, izin verilirse seçilen orijinal dosyanın yerine yazılır. Uzantı değişecekse aynı klasöre erişmek için Klasör Seç özelliğini kullan.';

      return;

    } catch (e) {
      if (e?.name === 'AbortError') return;

      console.warn(
        'Gelişmiş dosya seçici kullanılamadı; standart seçici açılıyor.',
        e
      );
    }
  }

  fileInput.click();
}

filePickBtn.onclick = chooseVideos;
$('addMoreBtn').onclick = chooseVideos;

fileInput.addEventListener('change', async () => {
  try {
    const picked = Array.from(fileInput.files || []);

    if (picked.length) {
      await addFiles(picked);
      status.textContent =
        `${picked.length} dosya incelendi; videolar dönüşüm listesine eklendi.`;
    } else {
      status.textContent = 'Dosya seçilmedi.';
    }

  } catch (e) {
    console.error(e);
    status.textContent = `Dosyalar eklenemedi: ${e?.message || String(e)}`;
  } finally {
    fileInput.value = '';
  }
});

folderInput?.addEventListener('change', async () => {
  try {
    const picked = Array.from(folderInput.files || []);

    if (picked.length) {
      directoryHandle = null;

      await addFiles(picked);

      deleteOriginal.checked = false;
      deleteOriginal.disabled = true;

      $('deleteHint').textContent =
        'Bu yöntem klasöre yazma izni vermez. Çıktılar indirilecektir; orijinaller otomatik silinemez.';

      status.textContent =
        `Seçilen klasörde ${picked.length} dosya bulundu; videolar listeye eklendi.`;
    } else {
      status.textContent = 'Klasör seçilmedi.';
    }

  } catch (e) {
    console.error(e);
    status.textContent = `Klasör okunamadı: ${e?.message || String(e)}`;
  } finally {
    folderInput.value = '';
  }
});

$('clearBtn').onclick = () => {
  if (busy) return;

  selected = [];
  renderList();

  status.textContent = 'Dönüşüm listesi temizlendi.';
  results.replaceChildren();
};

$('folderBtn').onclick = async () => {
  if (window.showDirectoryPicker) {
    try {
      directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      const fs = [];
      const hs = [];

      for await (const [name, h] of directoryHandle.entries()) {
        if (h.kind === 'file') {
          const f = await h.getFile();

          if (await isVideo(f)) {
            fs.push(f);
            hs.push(h);
          }
        }
      }

      deleteOriginal.disabled = false;

      await addFiles(fs, hs);

      $('deleteHint').textContent =
        'Klasör erişimi açık. Çıktılar aynı klasöre kaydedilir; eski dosyalar yalnızca çıktı doğrulandıktan sonra silinir.';

      status.textContent =
        `Klasörden ${fs.length} video bulundu ve listeye eklendi.`;

      return;

    } catch (e) {
      if (e.name === 'AbortError') return;

      console.warn(
        'Doğrudan klasör erişimi kullanılamadı; alternatif seçici deneniyor.',
        e
      );

      directoryHandle = null;
    }
  }

  if (folderInput) {
    status.textContent = 'Klasör seçicisi açılıyor...';
    folderInput.click();
  } else {
    status.textContent =
      'Bu tarayıcı klasör seçimini desteklemiyor. Dosyalardan video seç düğmesini kullan.';
  }
};

async function loadEngine() {
  if (ffmpeg) return ffmpeg;
  if (loading) return loading;

  loading = (async () => {
    status.textContent =
      'FFmpeg çekirdeği indiriliyor. İlk açılışta internet gerekir...';

    const f = new FFmpeg();

    f.on('progress', ({ progress }) => {
      const p = Math.max(0, Math.min(1, progress || 0));

      progressBar.style.width = `${p * 100}%`;
      progressText.textContent = `%${(p * 100).toFixed(1)}`;
    });

    const base =
      'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';

    const fetchBlob = async (url, type) => {
      const r = await fetch(url);

      if (!r.ok) {
        throw new Error(`FFmpeg dosyası indirilemedi: ${r.status}`);
      }

      return URL.createObjectURL(
        new Blob([await r.arrayBuffer()], { type })
      );
    };

    const coreURL = await fetchBlob(
      `${base}/ffmpeg-core.js`,
      'text/javascript'
    );

    const wasmURL = await fetchBlob(
      `${base}/ffmpeg-core.wasm`,
      'application/wasm'
    );

    const classWorkerURL =
      new URL('./worker.js', document.baseURI).href;

    status.textContent = 'FFmpeg Worker yükleniyor...';

    await f.load({
      classWorkerURL,
      coreURL,
      wasmURL
    });

    ffmpeg = f;
    return f;
  })();

  try {
    return await loading;
  } catch (e) {
    loading = null;
    throw e;
  }
}

function inputArgs(item, input) {
  return item.container === 'mpegts'
    ? ['-f', 'mpegts', '-i', input]
    : ['-i', input];
}

function mp4CopyArgs(item, input, out) {
  return [
    ...inputArgs(item, input),
    '-map', '0:v:0?',
    '-map', '0:a:0?',
    '-c', 'copy',
    '-movflags', '+faststart',
    '-y', out
  ];
}

function args(ext, input, out, item) {
  const src = inputArgs(item, input);

  if (ext === 'mp4' || ext === 'mkv') {
    return [
      ...src,
      '-map', '0:v:0?',
      '-map', '0:a:0?',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      ...(ext === 'mp4' ? ['-movflags', '+faststart'] : []),
      '-y', out
    ];
  }

  if (ext === 'webm') {
    return [
      ...src,
      '-map', '0:v:0?',
      '-map', '0:a:0?',
      '-c:v', 'libvpx-vp9',
      '-crf', '32',
      '-b:v', '0',
      '-c:a', 'libopus',
      '-b:a', '128k',
      '-y', out
    ];
  }

  return [
    ...src,
    '-map', '0:v:0?',
    '-map', '0:a:0?',
    '-c:v', 'mpeg4',
    '-q:v', '4',
    '-c:a', 'libmp3lame',
    '-q:a', '3',
    '-y', out
  ];
}

function download(data, name) {
  const url = URL.createObjectURL(new Blob([data]));

  const a = document.createElement('a');
  a.href = url;
  a.download = name;

  document.body.append(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function saveOutput(data, name, item) {
  const sourceExt = item.file.name.split('.').pop().toLowerCase();
  const targetExt = format.value.toLowerCase();

  // Aynı uzantı: dönüştürülmüş dosyayı seçilen orijinalin yerine yaz.
  if (item.handle && sourceExt === targetExt) {
    const permission = await item.handle.queryPermission({
      mode: 'readwrite'
    });

    const granted = permission === 'granted'
      ? permission
      : await item.handle.requestPermission({ mode: 'readwrite' });

    if (granted !== 'granted') {
      throw new Error(
        'Orijinal dosyanın yerine yazmak için dosya erişim izni verilmedi.'
      );
    }

    const writable = await item.handle.createWritable();

    await writable.write(data);
    await writable.close();

    const saved = await item.handle.getFile();

    if (!saved.size || saved.size !== data.length) {
      throw new Error('Değiştirilen dosya doğrulanamadı.');
    }

    return `Aynı klasörde orijinal dosyanın yerine yazıldı: ${item.file.name}`;
  }

  // Klasör izni varsa farklı uzantılı dosyayı aynı klasöre kaydet.
  if (directoryHandle && item.handle) {
    const h = await directoryHandle.getFileHandle(name, {
      create: true
    });

    const w = await h.createWritable();

    await w.write(data);
    await w.close();

    const saved = await h.getFile();

    if (saved.size !== data.length || !saved.size) {
      throw new Error('Çıktı doğrulanamadı; orijinal dosya korunuyor.');
    }

    if (deleteOriginal.checked) {
      await directoryHandle.removeEntry(item.file.name);
    }

    return `Aynı klasöre kaydedildi: ${name}${
      deleteOriginal.checked ? ' · Eski dosya silindi' : ''
    }`;
  }

  // Sadece dosya tutamacı varsa üst klasöre erişim yoktur.
  // Bu durumda yanlışlıkla indirme başlatma veya orijinali silme.
  if (item.handle && sourceExt !== targetExt) {
    throw new Error(
      `Çıkış uzantısı .${targetExt}, kaynak uzantısı .${sourceExt}. ` +
      'Tarayıcı seçilen dosyanın üst klasörüne erişim vermiyor. ' +
      'Yeni dosyayı yanına kaydetmek ve eskisini silmek için ' +
      '“Klasör Seç” düğmesini kullan. Orijinal dosya korunuyor.'
    );
  }

  download(data, name);

  return 'İndirme başlatıldı. Standart dosya seçici aynı klasöre yazma izni vermiyor.';
}

convertBtn.onclick = async () => {
  if (busy || !selected.some(x => x.state !== 'done')) return;

  busy = true;
  results.replaceChildren();
  progressBar.style.width = '0%';
  renderList();

  try {
    const f = await loadEngine();
    const ext = format.value;

    const queue = selected.filter(x => x.state !== 'done');

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];

      item.state = 'working';
      renderList();

      const inputExt =
        item.container === 'mpegts' ? 'ts' :
        item.container === 'mp4' ? 'mp4' :
        (item.file.name.split('.').pop() || 'bin');

      const input = `source_${i}.${inputExt}`;
      const output = `converted_${i}.${ext}`;

      status.textContent =
        `Dönüştürülüyor (${i + 1}/${queue.length}): ${item.file.name}`;

      await f.writeFile(
        input,
        new Uint8Array(await item.file.arrayBuffer())
      );

      let code = 1;

      if (ext === 'mp4') {
        status.textContent =
          `Kayıpsız aktarım deneniyor (${i + 1}/${queue.length}): ${item.file.name}`;

        try {
          code = await f.exec(mp4CopyArgs(item, input, output));
        } catch (e) {
          console.warn(
            'Stream copy başarısız, yeniden kodlama deneniyor',
            e
          );
          code = 1;
        }

        let copied = null;

        if (code === 0) {
          try {
            copied = await f.readFile(output);
          } catch {}
        }

        if (!copied || !copied.length) {
          try {
            await f.deleteFile(output);
          } catch {}

          status.textContent =
            `Uyumlu MP4 kodlaması yapılıyor: ${item.file.name}`;

          code = await f.exec(args(ext, input, output, item));
        }

      } else {
        code = await f.exec(args(ext, input, output, item));
      }

      if (code !== 0) {
        throw new Error(`${item.file.name}: FFmpeg kodu ${code}`);
      }

      const data = await f.readFile(output);

      if (!(data instanceof Uint8Array) || !data.length) {
        throw new Error('Çıktı boş veya okunamadı.');
      }

      const saved = await saveOutput(
        data,
        outputName(item),
        item
      );

      item.state = 'done';
      item.saved = saved;
      item.output = outputName(item);

      renderList();

      const d = document.createElement('div');
      d.className = 'result';
      d.textContent =
        `✓ ${item.file.name} → ${item.output} · ${saved}`;

      results.append(d);

      await f.deleteFile(input);
      await f.deleteFile(output);
    }

    status.textContent = 'Listedeki dönüştürmeler tamamlandı.';
    progressBar.style.width = '100%';
    progressText.textContent = 'Tamamlandı';

  } catch (e) {
    console.error(e);

    status.textContent =
      `Hata: ${e?.message || String(e)}`;

    const d = document.createElement('div');
    d.className = 'result error';
    d.textContent =
      `Dönüştürme başarısız: ${e?.message || String(e)}`;

    results.append(d);

  } finally {
    busy = false;
    renderList();
  }
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch(e => console.warn('PWA çevrimdışı desteği:', e));
  });
}

renderList();
