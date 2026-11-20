(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const state = { files: [], selectedId: null, mode: "cover", rotation: 0, flipH: false, flipV: false, processing: false, aspect: 1, previewUrl: null };
const els = {
  dropZone:$("dropZone"), fileInput:$("fileInput"), browseBtn:$("browseBtn"), addMoreBtn:$("addMoreBtn"),
  fileList:$("fileList"), queueCount:$("queueCount"), fileCount:$("fileCount"), previewImage:$("previewImage"),
  emptyPreview:$("emptyPreview"), previewStatus:$("previewStatus"), selectedName:$("selectedName"),
  dimensionsText:$("dimensionsText"), originalSizeText:$("originalSizeText"), beforeSize:$("beforeSize"),
  afterSize:$("afterSize"), beforeDimensions:$("beforeDimensions"), afterDimensions:$("afterDimensions"),
  savingsValue:$("savingsValue"), savingsBar:$("savingsBar"), width:$("widthInput"), height:$("heightInput"),
  lock:$("lockAspect"), preset:$("presetSelect"), format:$("formatSelect"), compression:$("compressionToggle"),
  quality:$("qualitySlider"), qualityValue:$("qualityValue"), target:$("targetToggle"), targetFields:$("targetFields"),
  targetSize:$("targetSize"), targetUnit:$("targetUnit"), process:$("processBtn"), downloadAll:$("downloadAllBtn"),
  progressWrap:$("progressWrap"), progressLabel:$("progressLabel"), progressPercent:$("progressPercent"),
  progressBar:$("progressBar"), themeToggle:$("themeToggle"), toast:$("toast"), processAll:$("processAllBtn")
};
const bytes = n => n < 1024 ? `${n} B` : n < 1024*1024 ? `${(n/1024).toFixed(n<10240?1:0)} KB` : `${(n/1048576).toFixed(2)} MB`;
const safeName = s => s.replace(/\.[^.]+$/,"").replace(/[^\w-]+/g,"-").slice(0,70) || "image";
const selected = () => state.files.find(f => f.id === state.selectedId) || null;
function notify(message){els.toast.textContent=message;els.toast.classList.add("show");clearTimeout(notify.timer);notify.timer=setTimeout(()=>els.toast.classList.remove("show"),3000);}
function setProgress(done,total,label){const pct=total?Math.round(done/total*100):0;els.progressWrap.hidden=false;els.progressLabel.textContent=label;els.progressPercent.textContent=pct+"%";els.progressBar.style.width=pct+"%";if(pct===100)setTimeout(()=>els.progressWrap.hidden=true,900);}
function resetTransform(){state.rotation=0;state.flipH=false;state.flipV=false;["cropTop","cropRight","cropBottom","cropLeft"].forEach(id=>$(id).value=0);state.mode="cover";document.querySelectorAll("#fitMode button").forEach(b=>b.classList.toggle("selected",b.dataset.mode==="cover"));}
function addFiles(fileList){
  const valid=Array.from(fileList||[]).filter(f=>f.type.startsWith("image/"));
  if(!valid.length){notify("Choose a valid image file.");return;}
  let added=0;
  valid.forEach(file=>{
    const id=(crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()));
    const url=URL.createObjectURL(file), img=new Image();
    const item={id,file,url,img,processedBlob:null,processedUrl:null,processedWidth:0,processedHeight:0,status:"Ready",error:null};
    img.onload=()=>{item.width=img.naturalWidth;item.height=img.naturalHeight;renderQueue();if(!state.selectedId)selectFile(id);};
    img.onerror=()=>{item.error="Could not read image";item.status="Error";renderQueue();};
    img.src=url;state.files.push(item);added++;
  });
  els.fileInput.value="";
  renderQueue();
  if(added)notify(`${added} image${added===1?"":"s"} added to queue.`);
}
function selectFile(id){
  const item=state.files.find(f=>f.id===id);if(!item)return;
  state.selectedId=id;state.rotation=0;state.flipH=false;state.flipV=false;state.mode="cover";
  ["cropTop","cropRight","cropBottom","cropLeft"].forEach(x=>$(x).value=0);
  if(item.width&&item.height){els.width.value=item.width;els.height.value=item.height;state.aspect=item.width/item.height;}
  els.selectedName.textContent=item.file.name;els.dimensionsText.textContent=item.width?`${item.width} × ${item.height}`:"Loading…";els.originalSizeText.textContent=bytes(item.file.size);
  els.beforeSize.textContent=bytes(item.file.size);els.beforeDimensions.textContent=item.width?`${item.width} × ${item.height}`:"—";
  els.afterSize.textContent=item.processedBlob?bytes(item.processedBlob.size):"—";els.afterDimensions.textContent=item.processedBlob?`${item.processedWidth} × ${item.processedHeight}`:"—";
  els.savingsValue.textContent=item.processedBlob?calcSavings(item.file.size,item.processedBlob.size):"—";
  els.savingsBar.style.width=item.processedBlob?Math.max(0,Math.min(100,(1-item.processedBlob.size/item.file.size)*100))+"%":"0%";
  els.previewStatus.textContent=item.processedBlob?"Processed":"Original preview";
  const showUrl=item.processedUrl||item.url;els.previewImage.src=showUrl;els.previewImage.hidden=false;els.emptyPreview.hidden=true;
  els.process.textContent="Process selected image →";renderQueue();
}
function calcSavings(original,after){const v=(1-after/original)*100;return v>0?`${v.toFixed(1)}% smaller`:v<0?`${Math.abs(v).toFixed(1)}% larger`:"No change";}
function renderQueue(){
  els.queueCount.textContent=state.files.length;
  els.fileCount.textContent=state.files.length;

  const processedCount=state.files.filter(file=>file.processedBlob).length;
  els.downloadAll.disabled=processedCount===0||state.processing;
  els.downloadAll.textContent=processedCount
    ? `↓ Download ZIP (${processedCount})`
    : "↓ Download all as ZIP";

  if(!state.files.length){
    els.fileList.innerHTML='<div class="queue-empty">Your uploaded images will appear here.</div>';
    return;
  }

  els.fileList.innerHTML="";

  state.files.forEach(item=>{
    const row=document.createElement("div");
    row.className="file-item"+(item.id===state.selectedId?" active":"");
    row.addEventListener("click",()=>selectFile(item.id));

    const thumb=document.createElement("img");
    thumb.className="file-thumb";
    thumb.src=item.processedUrl||item.url;
    thumb.alt="";

    const info=document.createElement("div");
    info.className="file-info";

    const name=document.createElement("strong");
    name.textContent=item.file.name;

    const detail=document.createElement("span");
    const originalDimensions=`${item.width||"…"} × ${item.height||"…"}`;
    const outputDimensions=item.processedBlob
      ? `${item.processedWidth} × ${item.processedHeight}`
      : originalDimensions;
    detail.textContent=item.processedBlob
      ? `${outputDimensions} · ${bytes(item.file.size)} → ${bytes(item.processedBlob.size)}`
      : `${originalDimensions} · Original ${bytes(item.file.size)}`;

    info.append(name,detail);

    const actions=document.createElement("div");
    actions.className="file-actions";

    const status=document.createElement("span");
    status.className="file-status"+(item.processedBlob?" done":"");
    status.textContent=item.processedBlob?"Processed":item.status;

    const download=document.createElement("button");
    download.className="file-download";
    download.type="button";
    download.textContent="↓ Download";
    download.disabled=!item.processedBlob||state.processing;
    download.title=item.processedBlob
      ? `Download ${item.file.name}`
      : "Process this image before downloading";
    download.setAttribute("aria-label",`Download processed image ${item.file.name}`);
    download.addEventListener("click",event=>{
      event.stopPropagation();
      downloadFile(item);
    });

    const remove=document.createElement("button");
    remove.className="remove-file";
    remove.type="button";
    remove.textContent="×";
    remove.title="Remove image";
    remove.setAttribute("aria-label",`Remove ${item.file.name}`);
    remove.disabled=state.processing;
    remove.addEventListener("click",event=>{
      event.stopPropagation();
      removeFile(item.id);
    });

    actions.append(status,download,remove);
    row.append(thumb,info,actions);
    els.fileList.append(row);
  });
}
function removeFile(id){const i=state.files.findIndex(f=>f.id===id);if(i<0)return;const f=state.files[i];URL.revokeObjectURL(f.url);if(f.processedUrl)URL.revokeObjectURL(f.processedUrl);state.files.splice(i,1);if(state.selectedId===id){state.selectedId=null;if(state.files.length)selectFile(state.files[0].id);else{els.previewImage.hidden=true;els.emptyPreview.hidden=false;els.selectedName.textContent="No image selected";els.dimensionsText.textContent="—";els.originalSizeText.textContent="—";els.beforeSize.textContent="—";els.afterSize.textContent="—";els.beforeDimensions.textContent="—";els.afterDimensions.textContent="—";els.savingsValue.textContent="—";els.savingsBar.style.width="0%";}}renderQueue();}
function cropRect(img){
  const t=clamp(Number($("cropTop").value)||0,0,90)/100,r=clamp(Number($("cropRight").value)||0,0,90)/100,b=clamp(Number($("cropBottom").value)||0,0,90)/100,l=clamp(Number($("cropLeft").value)||0,0,90)/100;
  if(t+b>=.95||l+r>=.95)throw new Error("Crop margins leave too little image area.");
  return {x:img.naturalWidth*l,y:img.naturalHeight*t,w:img.naturalWidth*(1-l-r),h:img.naturalHeight*(1-t-b)};
}
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function canvasFor(item){
  const img=item.img;if(!img.complete||!img.naturalWidth)throw new Error("Image is not ready yet.");
  const crop=cropRect(img),rot=((state.rotation%360)+360)%360,sw=rot%180?crop.h:crop.w,sh=rot%180?crop.w:crop.h;
  const outW=clamp(Math.round(Number(els.width.value)||img.naturalWidth),1,12000),outH=clamp(Math.round(Number(els.height.value)||img.naturalHeight),1,12000);
  const canvas=document.createElement("canvas");canvas.width=outW;canvas.height=outH;const ctx=canvas.getContext("2d",{alpha:true});
  if(els.format.value==="image/jpeg"){ctx.fillStyle="#ffffff";ctx.fillRect(0,0,outW,outH);}
  let dx=0,dy=0,dw=outW,dh=outH;
  if(state.mode==="contain"){const scale=Math.min(outW/sw,outH/sh);dw=sw*scale;dh=sh*scale;dx=(outW-dw)/2;dy=(outH-dh)/2;}
  if(state.mode==="cover"){const scale=Math.max(outW/sw,outH/sh);dw=sw*scale;dh=sh*scale;dx=(outW-dw)/2;dy=(outH-dh)/2;}
  ctx.save();ctx.translate(outW/2,outH/2);ctx.scale(state.flipH?-1:1,state.flipV?-1:1);ctx.rotate(rot*Math.PI/180);
  // Draw cropped source into the destination rectangle. Rotation occurs around the destination center.
  ctx.drawImage(img,crop.x,crop.y,crop.w,crop.h,-dw/2,-dh/2,dw,dh);ctx.restore();
  return canvas;
}
function toBlob(canvas,type,quality){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error(`This browser cannot export ${type.replace("image/","").toUpperCase()}. Try JPEG or WebP.`)),type,quality));}
async function encodeCanvas(canvas,quality){
  let type=els.format.value;
  if(type==="image/avif"){const test=await toBlob(canvas,type,quality).catch(()=>null);if(!test||test.type!=="image/avif")throw new Error("AVIF export is not supported by this browser. Choose WebP or JPEG.");return test;}
  return toBlob(canvas,type,quality);
}
async function findTargetBlob(canvas,targetBytes){
  const type=els.format.value;if(type==="image/png")throw new Error("Target-size mode needs JPEG, WebP or AVIF. PNG does not offer lossy quality control.");
  let low=.08,high=1,best=null;
  for(let i=0;i<9;i++){const q=(low+high)/2;const blob=await encodeCanvas(canvas,q);if(blob.size<=targetBytes){best=blob;low=q;}else high=q;}
  if(!best){const smallest=await encodeCanvas(canvas,.08);return {blob:smallest,met:false};}
  return {blob:best,met:true};
}
async function processItem(item){
  const canvas=canvasFor(item);let blob;
  const targetOn=els.target.checked;
  if(targetOn){const n=Number(els.targetSize.value);if(!n||n<=0)throw new Error("Enter a valid target file size.");const targetBytes=n*(els.targetUnit.value==="MB"?1048576:1024);const result=await findTargetBlob(canvas,targetBytes);blob=result.blob;item.targetMet=result.met;}
  else {const q=els.compression.checked?Number(els.quality.value)/100:1;blob=await encodeCanvas(canvas,q);item.targetMet=null;}
  item.processedBlob=blob;item.processedWidth=canvas.width;item.processedHeight=canvas.height;item.status="Processed";
  if(item.processedUrl)URL.revokeObjectURL(item.processedUrl);item.processedUrl=URL.createObjectURL(blob);
}
async function processSelected(){
  const item=selected();
  if(!item){notify("Add an image first.");return;}
  if(state.processing)return;

  try{
    state.processing=true;
    els.process.disabled=true;
    els.processAll.disabled=true;
    renderQueue();

    await processItem(item);
    selectFile(item.id);
    notify(item.targetMet===false
      ? "Processed, but the target size could not be reached at minimum quality."
      : "Image processed successfully.");
  }catch(err){
    notify(err.message||"Could not process this image.");
  }finally{
    state.processing=false;
    els.process.disabled=false;
    els.processAll.disabled=false;
    renderQueue();
  }
}
async function processAll(){
  if(!state.files.length||state.processing)return;state.processing=true;els.process.disabled=true;els.processAll.disabled=true;els.downloadAll.disabled=true;
  let done=0,errors=0;const total=state.files.length;setProgress(0,total,"Processing batch…");
  for(const item of state.files){try{item.status="Processing";renderQueue();await processItem(item);}catch(e){item.status="Failed";item.error=e.message;errors++;}done++;setProgress(done,total,`Processed ${done} of ${total}`);renderQueue();await new Promise(r=>setTimeout(r,0));}
  state.processing=false;els.process.disabled=false;els.processAll.disabled=false;renderQueue();if(selected())selectFile(state.selectedId);
  notify(errors?`${total-errors} images processed; ${errors} failed.`:`All ${total} images processed.`);
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function extensionFor(type){return type==="image/jpeg"?"jpg":type==="image/png"?"png":type==="image/webp"?"webp":type==="image/avif"?"avif":"img";}
function downloadFile(item){
  if(!item?.processedBlob){
    notify("Process this image before downloading.");
    return;
  }

  const filename=`${safeName(item.file.name)}-resized.${extensionFor(item.processedBlob.type)}`;
  downloadBlob(item.processedBlob,filename);
  notify(`Downloading ${filename}`);
}
async function downloadZip(){
  const done=state.files.filter(f=>f.processedBlob);if(!done.length){notify("Process images before creating a ZIP.");return;}if(typeof JSZip==="undefined"){notify("ZIP library did not load. Check your internet connection and retry.");return;}
  const zip=new JSZip();done.forEach((f,i)=>zip.file(`${String(i+1).padStart(2,"0")}-${safeName(f.file.name)}.${extensionFor(f.processedBlob.type)}`,f.processedBlob));
  try{els.downloadAll.disabled=true;notify("Creating ZIP archive…");const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:5}});downloadBlob(blob,"pro-resizer-export.zip");notify(`${done.length} processed images added to ZIP.`);}
  catch(e){notify("Could not create ZIP archive.");}finally{els.downloadAll.disabled=false;}
}
function updateAspect(source){if(!els.lock.checked)return;const w=Number(els.width.value),h=Number(els.height.value);if(source==="width"&&w>0)els.height.value=Math.max(1,Math.round(w/state.aspect));if(source==="height"&&h>0)els.width.value=Math.max(1,Math.round(h*state.aspect));}
function updateQuality(){
  els.qualityValue.textContent=els.quality.value+"%";
}

function updateFormatControls(){
  const isPng=els.format.value==="image/png";

  // PNG export does not use the lossy quality parameter in Canvas.toBlob().
  els.compression.disabled=isPng;
  els.quality.disabled=isPng||!els.compression.checked;

  // Target-size search relies on lossy quality control, so disable it for PNG.
  els.target.disabled=isPng;
  els.target.closest(".check-line").title=isPng
    ? "Target-size compression is unavailable for PNG. Choose JPEG or WebP."
    : "Find the highest quality that fits the selected target size.";

  if(isPng&&els.target.checked){
    els.target.checked=false;
    els.targetFields.hidden=true;
  }
}

function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("pro-resizer-theme",theme);$("themeIcon").textContent=theme==="dark"?"☀":"☾";$("themeLabel").textContent=theme==="dark"?"Light appearance":"Dark appearance";$("themeToggle").querySelector(".theme-state").textContent=theme==="dark"?"ON":"OFF";}
function bindEvents(){
  els.dropZone.addEventListener("click",e=>{if(e.target.closest("button"))return;els.fileInput.click();});
  els.dropZone.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();els.fileInput.click();}});
  els.browseBtn.addEventListener("click",e=>{e.stopPropagation();els.fileInput.click();});els.addMoreBtn.addEventListener("click",()=>els.fileInput.click());
  els.fileInput.addEventListener("change",e=>addFiles(e.target.files));
  ["dragenter","dragover"].forEach(type=>els.dropZone.addEventListener(type,e=>{e.preventDefault();els.dropZone.classList.add("dragover");}));
  ["dragleave","drop"].forEach(type=>els.dropZone.addEventListener(type,e=>{e.preventDefault();els.dropZone.classList.remove("dragover");}));
  els.dropZone.addEventListener("drop",e=>addFiles(e.dataTransfer.files));
  els.width.addEventListener("input",()=>updateAspect("width"));els.height.addEventListener("input",()=>updateAspect("height"));
  els.preset.addEventListener("change",()=>{if(els.preset.value==="custom")return;const [w,h]=els.preset.value.split("x").map(Number);if(w&&h){els.width.value=w;els.height.value=h;state.aspect=w/h;els.lock.checked=false;}});
  document.querySelectorAll("#fitMode button").forEach(b=>b.addEventListener("click",()=>{state.mode=b.dataset.mode;document.querySelectorAll("#fitMode button").forEach(x=>x.classList.toggle("selected",x===b));}));
  $("rotateLeft").addEventListener("click",()=>state.rotation=(state.rotation-90)%360);$("rotateRight").addEventListener("click",()=>state.rotation=(state.rotation+90)%360);
  $("flipH").addEventListener("click",()=>state.flipH=!state.flipH);$("flipV").addEventListener("click",()=>state.flipV=!state.flipV);
  $("resetCrop").addEventListener("click",()=>["cropTop","cropRight","cropBottom","cropLeft"].forEach(id=>$(id).value=0));
  els.quality.addEventListener("input",updateQuality);
  els.compression.addEventListener("change",updateFormatControls);
  els.format.addEventListener("change",updateFormatControls);
  els.target.addEventListener("change",()=>els.targetFields.hidden=!els.target.checked);
  els.process.addEventListener("click",processSelected);els.processAll.addEventListener("click",processAll);els.downloadAll.addEventListener("click",downloadZip);
  $("clearAllBtn").addEventListener("click",()=>{state.files.slice().forEach(f=>removeFile(f.id));notify("Workspace cleared.");});
  els.themeToggle.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
  // Download selected image from preview using Ctrl/Cmd + Enter.
  document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();processSelected();}});
}
function initPointerSpotlight() {
  const spotlight = $("pointerGrid");
  if (!spotlight) return;

  // Only enable this effect where a precise hovering pointer exists.
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!finePointer.matches) return;

  const root = document.documentElement;
  let isVisible = false;

  function showSpotlight() {
    if (!isVisible) {
      spotlight.classList.add("is-visible");
      isVisible = true;
    }
  }

  function hideSpotlight() {
    spotlight.classList.remove("is-visible");
    isVisible = false;
  }

  // Update CSS coordinates directly from the pointer event. No RAF loop,
  // easing factor, timeout, or interpolation is used, so it does not trail.
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;

    root.style.setProperty("--pointer-x", `${event.clientX}px`);
    root.style.setProperty("--pointer-y", `${event.clientY}px`);
    showSpotlight();
  }, { passive: true });

  // Hide the spotlight when the pointer leaves the browser viewport.
  window.addEventListener("mouseout", (event) => {
    if (!event.relatedTarget && !event.toElement) hideSpotlight();
  });
  window.addEventListener("blur", hideSpotlight);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hideSpotlight();
  });
}

function init(){setTheme(localStorage.getItem("pro-resizer-theme")||"light");updateQuality();bindEvents();initPointerSpotlight();updateFormatControls();renderQueue();
  // AVIF is feature-detected when a real export is requested; browser support varies.
  window.addEventListener("beforeunload",()=>state.files.forEach(f=>{URL.revokeObjectURL(f.url);if(f.processedUrl)URL.revokeObjectURL(f.processedUrl);}));
}
init();
})();
