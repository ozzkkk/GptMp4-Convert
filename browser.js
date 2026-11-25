const $ = id => document.getElementById(id);
const address = $('address');
const mediaList = $('mediaList');
const items = new Map();

$('addressForm').addEventListener('submit', async event => {
  event.preventDefault();
  let value = address.value.trim();
  if (!value) return;
  if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
  try { await window.browserAPI.navigate(value); }
  catch (error) { alert(error.message || String(error)); }
});
$('back').onclick = () => window.browserAPI.back();
$('forward').onclick = () => window.browserAPI.forward();
$('reload').onclick = () => window.browserAPI.reload();

function render() {
  $('count').textContent = String(items.size);
  mediaList.replaceChildren();
  if (!items.size) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Bu sayfada henüz medya akışı algılanmadı.';
    mediaList.append(p);
    return;
  }
  for (const item of items.values()) {
    const row = document.createElement('div');
    row.className = 'media';
    const kind = document.createElement('b');
    kind.textContent = item.kind;
    const url = document.createElement('span');
    url.textContent = new URL(item.url).pathname.split('/').pop() || item.url;
    url.title = item.url;
    const copy = document.createElement('button');
    copy.textContent = 'Bağlantıyı kopyala';
    copy.onclick = () => window.browserAPI.copyUrl(item.url);
    row.append(kind, url, copy);
    mediaList.append(row);
  }
}
window.browserAPI.onDetected(item => {
  if (!items.has(item.url)) {
    items.set(item.url, item);
    render();
  }
});
window.browserAPI.onNavigated(info => {
  address.value = info.url;
  $('back').disabled = !info.canGoBack;
  $('forward').disabled = !info.canGoForward;
});
