import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import './style.css';

const $ = (id) => document.getElementById(id);
const folderBtn=$('folderBtn'), filesBtn=$('filesBtn'), fileInput=$('fileInput');
const fileList=$('fileList'), format=$('format'), deleteOriginal=$('deleteOriginal');
const convertBtn=$('convertBtn'), status=$('status'), progressBar=$('progressBar');
const progressText=$('progressText'), results=$('results');
let selected=[], directoryHandle=null, ffmpeg=null, loading=null, busy=false;
const profiles={
 mp4:'H.264 video • AAC ses • 8-bit yuv420p • MP4 faststart',
 mkv:'H.264 video • AAC ses • MKV kapsayıcı',
 webm:'VP9 video • Opus ses • WebM kapsayıcı',
 avi:'MPEG-4 video • MP3 ses • AVI kapsayıcı'
};
format.addEventListener('change',()=> $('profile').textContent=profiles[format.value]);
function sizeText(n){if(!Number.isFinite(n))return '';const u=['B','KB','MB','GB'];let i=0;while(n>=1024&&i<u.length-1){n/=1024;i++}return `${n.toFixed(i?1:0)} ${u[i]}`}
function isVideo(name){return /\.(mp4|mkv|avi|mov|wmv|flv|ts|mts|m4v|webm|mpeg|mpg|3gp)$/i.test(name)}
function updateList(){
 fileList.innerHTML='';
 if(!selected.length){fileList.innerHTML='<div class="empty">Henüz video seçilmedi.</div>';convertBtn.disabled=true;return}
 selected.forEach((item,i)=>{const row=document.createElement('div');row.className='file';const name=document.createElement('span');name.className='name';name.textContent=item.file.name;const size=document.createElement('small');size.textContent=sizeText(item.file.size);const remove=document.createElement('button');remove.className='remove';remove.textContent='✕';remove.setAttribute('aria-label','Videoyu listeden çıkar');remove.onclick=()=>{selected.splice(i,1);updateList()};row.append(name,size,remove);fileList.append(row)});
 convertBtn.disabled=busy;
}
async function addFiles(files, handles=[]){
 for(let i=0;i<files.length;i++){const f=files[i];if(!isVideo(f.name))continue;if(selected.some(x=>x.file.name===f.name&&x.file.size===f.size))continue;selected.push({file:f,handle:handles[i]||null})}
 updateList();
}
filesBtn.onclick=()=>fileInput.click();
fileInput.onchange=async()=>{directoryHandle=null;deleteOriginal.checked=false;$('deleteHint').textContent='Dosya seçiciyle seçilen videolar tarayıcı tarafından otomatik silinemez.';await addFiles([...fileInput.files]);fileInput.value=''};
folderBtn.onclick=async()=>{
 if(!('showDirectoryPicker' in window)){status.textContent='Bu tarayıcı klasör erişimini desteklemiyor. “Video seç” düğmesini kullan.';return}
 try{
  directoryHandle=await window.showDirectoryPicker({mode:'readwrite'});
  const found=[], handles=[];
  for await(const [name,handle] of directoryHandle.entries()){if(handle.kind==='file'&&isVideo(name)){found.push(await handle.getFile());handles.push(handle)}}
  selected=[];await addFiles(found,handles);
  $('deleteHint').textContent='Klasör erişimi etkin. Orijinal dosya, yeni dosya başarıyla kaydedilip kontrol edildikten sonra silinebilir.';
  status.textContent=`Klasörde ${selected.length} video bulundu.`;
 }catch(e){if(e.name!=='AbortError')status.textContent=`Klasör açılamadı: ${e.message}`}
};
async function loadFFmpeg(){
 if(ffmpeg)return ffmpeg;if(loading)return loading;
 loading=(async()=>{
  status.textContent='FFmpeg motoru yükleniyor. İlk açılışta internet bağlantısı gerekir...';
  const instance=new FFmpeg();
  instance.on('progress',({progress})=>{const p=Math.max(0,Math.min(1,progress||0));progressBar.style.width=`${(p*100).toFixed(1)}%`;progressText.textContent=`%${(p*100).toFixed(1)}`});
  instance.on('log',({message})=>{if(message)console.debug('[FFmpeg]',message)});
  const base='https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
  await instance.load({coreURL:await toBlobURL(`${base}/ffmpeg-core.js`,'text/javascript'),wasmURL:await toBlobURL(`${base}/ffmpeg-core.wasm`,'application/wasm')});
  ffmpeg=instance;return instance;
 })();
 try{return await loading}catch(e){loading=null;throw e}
}
function argsFor(ext,input,output){
 if(ext==='mp4'||ext==='mkv')return ['-i',input,'-map','0:v:0?','-map','0:a:0?','-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k',...(ext==='mp4'?['-movflags','+faststart']:[]),'-y',output];
 if(ext==='webm')return ['-i',input,'-map','0:v:0?','-map','0:a:0?','-c:v','libvpx-vp9','-crf','32','-b:v','0','-c:a','libopus','-b:a','128k','-y',output];
 return ['-i',input,'-map','0:v:0?','-map','0:a:0?','-c:v','mpeg4','-q:v','4','-c:a','libmp3lame','-q:a','3','-y',output];
}
function downloadBlob(bytes,name){const url=URL.createObjectURL(new Blob([bytes]));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
async function saveOutput(bytes,name,source){
 if(directoryHandle&&source.handle){
  let outName=name;
  if(outName.toLowerCase()===source.file.name.toLowerCase())outName=`${source.file.name.replace(/\.[^.]+$/,'')}_converted.${format.value}`;
  const outHandle=await directoryHandle.getFileHandle(outName,{create:true});
  const writable=await outHandle.createWritable();await writable.write(bytes);await writable.close();
  const saved=await outHandle.getFile();if(saved.size!==bytes.length||saved.size===0)throw new Error('Kaydedilen çıktı doğrulanamadı.');
  if(deleteOriginal.checked){
   if(source.handle.name===outName)throw new Error('Kaynak dosyanın üzerine yazma engellendi; orijinal silinmedi.');
   await directoryHandle.removeEntry(source.file.name);
  }
  return `Klasöre kaydedildi: ${outName}${deleteOriginal.checked?' • Orijinal silindi':''}`;
 }
 downloadBlob(bytes,name);return `İndirme başlatıldı: ${name} • Orijinal korundu`;
}
convertBtn.onclick=async()=>{
 if(busy||!selected.length)return;busy=true;convertBtn.disabled=true;results.innerHTML='';progressBar.style.width='0%';
 try{
  const engine=await loadFFmpeg();const ext=format.value;
  for(let i=0;i<selected.length;i++){
   const item=selected[i], input=`input_${i}_${Date.now()}.${item.file.name.split('.').pop()||'bin'}`;
   const base=item.file.name.replace(/\.[^.]+$/,'');let output=`${base}.${ext}`;
   if(output.toLowerCase()===item.file.name.toLowerCase())output=`${base}_converted.${ext}`;
   status.textContent=`Dönüştürülüyor (${i+1}/${selected.length}): ${item.file.name}`;
   progressBar.style.width='0%';progressText.textContent='Başlatılıyor...';
   await engine.writeFile(input,new Uint8Array(await item.file.arrayBuffer()));
   const code=await engine.exec(argsFor(ext,input,output));
   if(code!==0)throw new Error(`${item.file.name}: FFmpeg işlem kodu ${code}`);
   const data=await engine.readFile(output);
   if(!(data instanceof Uint8Array)||data.length===0)throw new Error('Çıktı dosyası boş veya okunamadı.');
   const message=await saveOutput(data,output,item);
   const div=document.createElement('div');div.className='result';div.textContent=`✓ ${message}`;results.append(div);
   await engine.deleteFile(input);await engine.deleteFile(output);
  }
  status.textContent='Tüm dönüştürme işlemleri tamamlandı.';progressBar.style.width='100%';progressText.textContent='Tamamlandı';
 }catch(e){console.error(e);status.textContent=`Hata: ${e.message}`;const div=document.createElement('div');div.className='result error';div.textContent=`Dönüştürme başarısız: ${e.message}`;results.append(div)}
 finally{busy=false;convertBtn.disabled=selected.length===0}
};
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));
updateList();
