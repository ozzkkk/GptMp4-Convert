import { FFmpeg } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js';

const $=id=>document.getElementById(id);
const fileInput=$('fileInput'),fileList=$('fileList'),format=$('format'),deleteOriginal=$('deleteOriginal'),convertBtn=$('convertBtn'),status=$('status'),progressBar=$('progressBar'),progressText=$('progressText'),results=$('results');
let selected=[],directoryHandle=null,ffmpeg=null,loading=null,busy=false;
const profiles={mp4:'H.264 video • AAC ses • 8-bit yuv420p • MP4 faststart',mkv:'H.264 video • AAC ses • MKV kapsayıcı',webm:'VP9 video • Opus ses • WebM kapsayıcı',avi:'MPEG-4 video • MP3 ses • AVI kapsayıcı'};
format.onchange=()=>{$('profile').textContent=profiles[format.value];renderList()};
function sizeText(n){const u=['B','KB','MB','GB'];let i=0;while(n>=1024&&i<3){n/=1024;i++}return `${n.toFixed(i?1:0)} ${u[i]}`}
function isVideo(file){return file.type?.startsWith('video/')||/\.(mp4|mkv|avi|mov|wmv|flv|ts|mts|m4v|webm|mpeg|mpg|3gp|m2ts)$/i.test(file.name)}
async function detectContainer(file){
 const b=new Uint8Array(await file.slice(0,600).arrayBuffer());
 for(const offset of [0,4,8])if(b[offset]===0x47&&b[offset+188]===0x47&&b[offset+376]===0x47)return 'mpegts';
 for(let i=0;i<Math.min(64,b.length-4);i++)if(b[i]===0x66&&b[i+1]===0x74&&b[i+2]===0x79&&b[i+3]===0x70)return 'mp4';
 return 'auto';
}
function outputName(item){const ext=format.value,stem=item.file.name.replace(/\.[^.]+$/,'');return `${stem}.${ext}`}
function renderList(){
 fileList.replaceChildren();
 $('queueCount').textContent=`${selected.length} video`;
 if(!selected.length){fileList.innerHTML='<div class="empty">Henüz video eklenmedi.</div>'}
 selected.forEach((item,i)=>{
  const row=document.createElement('div');row.className='file';
  const main=document.createElement('div');main.className='file-main';
  const name=document.createElement('span');name.className='name';name.textContent=item.file.name;
  const meta=document.createElement('span');meta.className='meta';meta.textContent=`${sizeText(item.file.size)} · ${item.container==='mpegts'?'TS içerik':item.container==='mp4'?'MP4 içerik':'Biçim otomatik'} · Çıkış: ${outputName(item)}`;
  main.append(name,meta);
  const side=document.createElement('div');side.className='file-side';
  const state=document.createElement('span');state.className='file-state'+(item.state==='done'?' done':item.state==='error'?' error':'');
  state.textContent=item.state==='done'?'✓ Tamamlandı':item.state==='error'?'Hata':item.state==='working'?'Dönüşüyor':'Bekliyor';
  side.append(state);
  if(!busy&&item.state!=='done'){const rm=document.createElement('button');rm.className='remove';rm.textContent='✕';rm.title='Listeden kaldır';rm.onclick=()=>{selected.splice(i,1);renderList()};side.append(rm)}
  row.append(main,side);fileList.append(row);
 });
 convertBtn.disabled=busy||!selected.some(x=>x.state!=='done');
 $('clearBtn').disabled=busy||!selected.length;
 $('addMoreBtn').disabled=busy;
}
async function addFiles(files,handles=[]){
 let added=0,skipped=0;
 for(let i=0;i<files.length;i++){
  const f=files[i];
  if(!isVideo(f)){skipped++;continue}
  if(selected.some(x=>x.file.name===f.name&&x.file.size===f.size)){continue}
  const container=await detectContainer(f);
  selected.push({file:f,handle:handles[i]||null,container,state:'waiting'});
  added++;
 }
 renderList();
 status.textContent=added?`${added} video dönüşüm listesine eklendi.${skipped?` ${skipped} video olmayan dosya atlandı.`:''}`:skipped?`${skipped} dosya video olmadığı için eklenmedi.`:'Yeni video eklenmedi.'};
}
$('filesBtn').onclick=()=>$('fileInput').click();
$('addMoreBtn').onclick=()=>$('fileInput').click();
fileInput.onchange=async()=>{await addFiles([...fileInput.files]);fileInput.value=''};
$('clearBtn').onclick=()=>{if(busy)return;selected=[];renderList();status.textContent='Dönüşüm listesi temizlendi.';results.replaceChildren()};
$('folderBtn').onclick=async()=>{
 if(!window.showDirectoryPicker){status.textContent='Bu tarayıcı klasör erişimini desteklemiyor. Dosyalardan video seç düğmesini kullan.';return}
 try{
  directoryHandle=await window.showDirectoryPicker({mode:'readwrite'});
  const fs=[],hs=[];
  for await(const [name,h] of directoryHandle.entries())if(h.kind==='file'){const f=await h.getFile();if(isVideo(f)){fs.push(f);hs.push(h)}}
  await addFiles(fs,hs);
  $('deleteHint').textContent='Klasör erişimi açık. Dönüştürülen dosyalar bu klasöre doğrudan kaydedilir; istersen orijinaller başarıyla kaydedildikten sonra silinir.';
  status.textContent=`Klasörden ${fs.length} video bulundu ve listeye eklendi.`;
 }catch(e){if(e.name!=='AbortError')status.textContent=`Klasör açılamadı: ${e.message}`}
};
async function loadEngine(){
 if(ffmpeg)return ffmpeg;if(loading)return loading;
 loading=(async()=>{
  status.textContent='FFmpeg çekirdeği indiriliyor. İlk açılışta internet gerekir...';
  const f=new FFmpeg();
  f.on('progress',({progress})=>{const p=Math.max(0,Math.min(1,progress||0));progressBar.style.width=`${p*100}%`;progressText.textContent=`%${(p*100).toFixed(1)}`});
  const base='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
  const fetchBlob=async(url,type)=>{const r=await fetch(url);if(!r.ok)throw new Error(`FFmpeg dosyası indirilemedi: ${r.status}`);return URL.createObjectURL(new Blob([await r.arrayBuffer()],{type}))};
  const coreURL=await fetchBlob(`${base}/ffmpeg-core.js`,'text/javascript');
  const wasmURL=await fetchBlob(`${base}/ffmpeg-core.wasm`,'application/wasm');
  const classWorkerURL=new URL('./worker.js',document.baseURI).href;
  status.textContent='FFmpeg Worker yükleniyor...';
  await f.load({classWorkerURL,coreURL,wasmURL});ffmpeg=f;return f;
 })();
 try{return await loading}catch(e){loading=null;throw e}
}
function inputArgs(item,input){return item.container==='mpegts'?['-f','mpegts','-i',input]:['-i',input]}
function mp4CopyArgs(item,input,out){return [...inputArgs(item,input),'-map','0:v:0?','-map','0:a:0?','-c','copy','-movflags','+faststart','-y',out]}
function args(ext,input,out,item){
 const src=inputArgs(item,input);
 if(ext==='mp4'||ext==='mkv')return [...src,'-map','0:v:0?','-map','0:a:0?','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k',...(ext==='mp4'?['-movflags','+faststart']:[]),'-y',out];
 if(ext==='webm')return [...src,'-map','0:v:0?','-map','0:a:0?','-c:v','libvpx-vp9','-crf','32','-b:v','0','-c:a','libopus','-b:a','128k','-y',out];
 return [...src,'-map','0:v:0?','-map','0:a:0?','-c:v','mpeg4','-q:v','4','-c:a','libmp3lame','-q:a','3','-y',out];
}
function download(data,name){
 const url=URL.createObjectURL(new Blob([data]));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
async function saveOutput(data,name,item){
 if(directoryHandle){
  const h=await directoryHandle.getFileHandle(name,{create:true});
  const w=await h.createWritable();await w.write(data);await w.close();
  const saved=await h.getFile();
  if(saved.size!==data.length||!saved.size)throw new Error('Çıktı doğrulanamadı; orijinal korunuyor.');
  if(deleteOriginal.checked&&item.handle)await directoryHandle.removeEntry(item.file.name);
  return 'Klasöre kaydedildi';
 }
 download(data,name);
 return 'İndirme başlatıldı';
}
convertBtn.onclick=async()=>{
 if(busy||!selected.some(x=>x.state!=='done'))return;
 busy=true;results.replaceChildren();progressBar.style.width='0%';renderList();
 try{
  const f=await loadEngine(),ext=format.value;
  const queue=selected.filter(x=>x.state!=='done');
  for(let i=0;i<queue.length;i++){
   const item=queue[i],index=selected.indexOf(item);
   item.state='working';renderList();
   const inputExt=item.container==='mpegts'?'ts':item.container==='mp4'?'mp4':(item.file.name.split('.').pop()||'bin');
   const input=`source_${i}.${inputExt}`,output=`converted_${i}.${ext}`;
   status.textContent=`Dönüştürülüyor (${i+1}/${queue.length}): ${item.file.name}`;
   await f.writeFile(input,new Uint8Array(await item.file.arrayBuffer()));
   let code=1;
   if(ext==='mp4'){
    status.textContent=`Kayıpsız aktarım deneniyor (${i+1}/${queue.length}): ${item.file.name}`;
    try{code=await f.exec(mp4CopyArgs(item,input,output))}catch(e){console.warn('Stream copy başarısız, yeniden kodlama deneniyor',e);code=1}
    let copied=null;if(code===0){try{copied=await f.readFile(output)}catch{}}
    if(!copied||!copied.length){try{await f.deleteFile(output)}catch{};status.textContent=`Uyumlu MP4 kodlaması yapılıyor: ${item.file.name}`;code=await f.exec(args(ext,input,output,item))}
   }else code=await f.exec(args(ext,input,output,item));
   if(code!==0)throw new Error(`${item.file.name}: FFmpeg kodu ${code}`);
   const data=await f.readFile(output);
   if(!(data instanceof Uint8Array)||!data.length)throw new Error('Çıktı boş veya okunamadı.');
   const saved=await saveOutput(data,outputName(item),item);
   item.state='done';item.saved=saved;item.output=outputName(item);renderList();
   const d=document.createElement('div');d.className='result';d.textContent=`✓ ${item.file.name} → ${item.output} · ${saved}`;results.append(d);
   await f.deleteFile(input);await f.deleteFile(output);
  }
  status.textContent='Listedeki dönüştürmeler tamamlandı.';
  progressBar.style.width='100%';progressText.textContent='Tamamlandı';
 }catch(e){
  console.error(e);status.textContent=`Hata: ${e?.message||String(e)}`;
  const d=document.createElement('div');d.className='result error';d.textContent=`Dönüştürme başarısız: ${e?.message||String(e)}`;results.append(d);
 }finally{busy=false;renderList()}
};
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('PWA çevrimdışı desteği:',e)));
renderList();
