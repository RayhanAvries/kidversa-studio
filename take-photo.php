<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>Capture - Kidversa Studio</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        html,body { width:100%; height:100%; overflow:hidden; font-family:'Plus Jakarta Sans',sans-serif; background:#FAFAFA; touch-action:pan-x pan-y; -webkit-tap-highlight-color:transparent; user-select:none; -webkit-user-select:none; }
        .app { width:100%; height:100%; display:flex; flex-direction:column; position:relative; overflow:hidden; }
        .top-bar { background:rgba(255,255,255,0.92); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); padding:8px 14px; display:flex; justify-content:space-between; align-items:center; z-index:100; flex-shrink:0; border-bottom:1px solid #F0F0F0; gap:6px; min-height:44px; }
        .brand { color:#1F2937; font-size:clamp(0.75rem,2vw,0.9rem); font-weight:700; display:flex; align-items:center; gap:5px; white-space:nowrap; }
        .brand span { color:#A855F7; }
        .top-actions { display:flex; align-items:center; gap:6px; }
        .timer-wrap { background:#F5F5F5; border-radius:40px; padding:6px 12px; border:1px solid #E8E8E8; }
        .timer { color:#1F2937; font-size:clamp(0.8rem,2.2vw,1.1rem); font-weight:700; font-variant-numeric:tabular-nums; transition:color 0.3s; }
        .timer.warn { color:#EF4444; animation:pulse 0.6s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.05)} }
        .btn-back { background:#F5F5F5; border:1px solid #E8E8E8; border-radius:40px; padding:6px 12px; color:#6B7280; cursor:pointer; font-size:0.7rem; font-weight:600; display:flex; align-items:center; gap:4px; transition:all 0.25s; font-family:inherit; white-space:nowrap; }
        .btn-back:active { transform:scale(0.94); background:#EEE; }
        .main-area { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; padding:8px; min-height:0; overflow-y:auto; overflow-x:hidden; z-index:1; gap:10px; }
        .main-area::-webkit-scrollbar { display:none; }
        .photo-wrap { position:relative; width:100%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .photo-box { position:relative; aspect-ratio:16/9; width:100%; max-width:100%; background:#000; border-radius:12px; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,0.08),0 0 0 1px #EEE; }
        @media(orientation:portrait){ .photo-box{width:min(94vw,calc(100vh - 270px)*1.777);} }
        @media(orientation:landscape){ .photo-box{width:min(82vw,calc(100vh - 210px)*1.777);max-width:960px;} }
        @media(max-width:380px){ .photo-box{width:92vw;} }
        @media(min-width:768px){ .photo-box{max-width:680px;} }
        @media(min-width:1024px){ .photo-box{max-width:800px;} }
        @media(min-width:1440px){ .photo-box{max-width:900px;} }
        @media(min-width:1920px){ .photo-box{max-width:960px;} }
        .layer { position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;background:#000; }
        #camVideo { display:block;transform:scaleX(-1); }
        #camCanvas { display:none; }
        #frameImg { position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;pointer-events:none;z-index:10;display:none; }
        #filterFx { position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;mix-blend-mode:overlay; }
        .countdown { position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:25;background:rgba(0,0,0,0.35); }
        .countdown.on { display:flex; }
        .countdown span { font-size:clamp(4rem,14vw,9rem);font-weight:900;color:#FFF;text-shadow:0 0 60px rgba(168,85,247,0.8),0 0 120px rgba(234,179,8,0.6);animation:pop 0.7s cubic-bezier(0.68,-0.55,0.265,1.55); }
        @keyframes pop { 0%{transform:scale(2.4);opacity:0} 60%{transform:scale(0.85);opacity:1} 100%{transform:scale(1);opacity:1} }
        .flash { position:absolute;inset:0;background:#FFF;z-index:24;opacity:0;pointer-events:none;transition:opacity 0.08s; }
        .flash.on { opacity:1;transition:opacity 0s; }
        .btn-row { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; padding:0 8px; flex-shrink:0; width:100%; }
        button { padding:14px 22px; font-size:clamp(0.8rem,2vw,0.9rem); border:none; border-radius:50px; cursor:pointer; font-weight:700; transition:all 0.28s cubic-bezier(0.68,-0.55,0.265,1.55); letter-spacing:0.5px; touch-action:manipulation; white-space:nowrap; font-family:inherit; display:flex; align-items:center; gap:7px; }
        button:active { transform:scale(0.93); }
        .btn-capture { background:#A855F7; color:#FFF; box-shadow:0 6px 22px rgba(168,85,247,0.25); flex:1; max-width:200px; justify-content:center; font-size:clamp(0.85rem,2.2vw,1rem); padding:16px 28px; }
        .btn-retake { background:#FFF; color:#1F2937; border:2px solid #E5E7EB; flex:1; max-width:120px; justify-content:center; }
        .btn-done { background:#EAB308; color:#FFF; box-shadow:0 6px 22px rgba(234,179,8,0.25); flex:1; max-width:120px; justify-content:center; }
        button:disabled { opacity:0.4; cursor:not-allowed; transform:none!important; }
        .toast { position:absolute;bottom:70px;left:50%;transform:translateX(-50%);z-index:30;padding:7px 14px;border-radius:40px;background:rgba(255,255,255,0.95);color:#1F2937;text-align:center;font-size:clamp(0.55rem,1.3vw,0.7rem);font-weight:600;display:none;white-space:nowrap;border:1px solid #E5E7EB;box-shadow:0 5px 18px rgba(0,0,0,0.04);animation:slideUp 0.3s ease; }
        .toast.show { display:block; }
        .toast.warn { border-color:#EAB308;color:#92400E; }
        @keyframes slideUp { from{transform:translate(-50%,16px);opacity:0} to{transform:translate(-50%,0);opacity:1} }
        .controls { background:rgba(255,255,255,0.92); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); padding:6px 8px 10px; flex-shrink:0; z-index:100; border-top:1px solid #F0F0F0; }
        .section-title { font-size:0.6rem;font-weight:700;color:#B0B0B0;text-transform:uppercase;letter-spacing:2px;text-align:center;margin-bottom:3px; }
        .scroll-row { display:flex; gap:8px; overflow-x:auto; padding:4px 0; scrollbar-width:none; -ms-overflow-style:none; -webkit-overflow-scrolling:touch; scroll-behavior:smooth; justify-content:center; }
        .scroll-row::-webkit-scrollbar { display:none; }
        @media(max-width:767px){ .scroll-row { justify-content:flex-start; } }
        .filter-card { cursor:pointer; border:2px solid #E8E8E8; border-radius:12px; padding:3px; transition:all 0.28s cubic-bezier(0.68,-0.55,0.265,1.55); background:#FFF; text-align:center; min-width:64px; flex-shrink:0; }
        .filter-card:active { transform:scale(0.9); }
        .filter-card.sel { border-color:#A855F7; background:rgba(168,85,247,0.04); box-shadow:0 0 12px rgba(168,85,247,0.1); }
        .filter-thumb { width:52px; height:29px; border-radius:5px; overflow:hidden; margin:0 auto 2px; background:#000; position:relative; }
        .filter-thumb video { width:100%; height:100%; object-fit:cover; transform:scaleX(-1); display:block; }
        .filter-thumb canvas { display:none; position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; }
        .filter-label { font-size:0.55rem;font-weight:600;color:#888;letter-spacing:0.2px; }
        .filter-card.sel .filter-label { color:#A855F7; }
        .frame-card { cursor:pointer; border:2px solid #E8E8E8; border-radius:12px; padding:3px; transition:all 0.28s cubic-bezier(0.68,-0.55,0.265,1.55); background:#FFF; text-align:center; min-width:64px; flex-shrink:0; }
        .frame-card:active { transform:scale(0.9); }
        .frame-card.sel { border-color:#A855F7; background:rgba(168,85,247,0.04); box-shadow:0 0 12px rgba(168,85,247,0.1); }
        .frame-thumb { width:52px; height:29px; border-radius:4px; overflow:hidden; margin:0 auto 2px; background:#F3F4F6; }
        .frame-thumb img { width:100%; height:100%; object-fit:cover; }
        .frame-label { font-size:0.55rem;font-weight:600;color:#888;letter-spacing:0.2px; }
        .frame-card.sel .frame-label { color:#A855F7; }
        .modal-bg { position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:200;display:none;align-items:center;justify-content:center;padding:16px; }
        .modal-bg.on { display:flex;animation:fadeIn 0.25s; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal-box { background:#FFF;border-radius:22px;padding:24px 18px;width:100%;max-width:300px;text-align:center;box-shadow:0 24px 50px rgba(0,0,0,0.18);animation:popIn 0.35s cubic-bezier(0.68,-0.55,0.265,1.55); }
        @keyframes popIn { from{transform:scale(0.8) translateY(28px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
        .modal-icon { width:55px;height:55px;background:linear-gradient(135deg,#A855F7,#7C3AED);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.4rem;color:#FFF; }
        .modal-title { font-size:1.1rem;font-weight:800;color:#1F2937;margin-bottom:3px; }
        .modal-sub { font-size:0.73rem;color:#888;margin-bottom:18px; }
        .modal-actions { display:flex;flex-direction:column;gap:6px; }
        .btn-modal { width:100%;padding:11px 14px;border-radius:14px;font-size:0.78rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;border:none;transition:all 0.25s;font-family:inherit; }
        .btn-modal:active { transform:scale(0.96); }
        .btn-print { background:#A855F7;color:#FFF;box-shadow:0 5px 16px rgba(168,85,247,0.18); }
        .btn-home { background:transparent;color:#888;border:1.5px solid #E5E7EB; }
        .btn-close { background:transparent;color:#B0B0B0;margin-top:3px;font-size:0.7rem;cursor:pointer;border:none;font-family:inherit; }
        @supports(padding:max(0px)){ .top-bar{padding-top:max(8px,env(safe-area-inset-top))} .controls{padding-bottom:max(10px,env(safe-area-inset-bottom))} }
    </style>
</head>
<body>
<div class="app">
    <div class="top-bar">
        <div class="brand"><i class="fas fa-star" style="color:#EAB308;font-size:0.7rem"></i>Kidversa <span>Studio</span></div>
        <div class="top-actions">
            <div class="timer-wrap"><span class="timer" id="timer">01:30</span></div>
            <button class="btn-back" onclick="location.href='index.php'"><i class="fas fa-arrow-left"></i>Back</button>
        </div>
    </div>
    <div class="main-area" id="mainArea">
        <div class="photo-wrap">
            <div class="photo-box" id="photoBox">
                <video id="camVideo" class="layer" autoplay playsinline muted></video>
                <canvas id="camCanvas" class="layer"></canvas>
                <div id="filterFx"></div>
                <img id="frameImg" src="" alt="Frame">
                <div class="flash" id="flashFx"></div>
                <div class="countdown" id="cdOverlay"><span id="cdNumber">3</span></div>
                <div class="toast warn" id="toastWarn"><i class="fas fa-exclamation-triangle"></i> Time's up! Last capture</div>
            </div>
        </div>
        <div class="btn-row">
            <button class="btn-capture" id="btnCapture" disabled><i class="fas fa-camera"></i>Capture</button>
            <button class="btn-retake" id="btnRetake" style="display:none"><i class="fas fa-redo"></i>Retake</button>
            <button class="btn-done" id="btnDone" style="display:none"><i class="fas fa-check"></i>Done</button>
        </div>
    </div>
    <div class="controls">
        <div class="section-title">Filters</div>
        <div class="scroll-row" id="filterRow"></div>
        <div class="section-title" style="margin-top:5px">Frames</div>
        <div class="scroll-row" id="frameRow"></div>
    </div>
</div>
<div class="modal-bg" id="printModal">
    <div class="modal-box">
        <div class="modal-icon"><i class="fas fa-check-circle"></i></div>
        <div class="modal-title">Photo Ready!</div>
        <div class="modal-sub">Your photo is ready to print</div>
        <div class="modal-actions">
            <button class="btn-modal btn-print" onclick="printNow()"><i class="fas fa-print"></i>Print Photo</button>
            <button class="btn-modal btn-home" onclick="location.href='index.php'"><i class="fas fa-home"></i>Back to Home</button>
            <button class="btn-close" onclick="closeModal()">Cancel</button>
        </div>
    </div>
</div>
<script>
const TW=1920,TH=1080;
const FILTERS=[
    {id:'none',name:'Original',filter:'none',overlay:''},
    {id:'gray',name:'Mono',filter:'grayscale(100%)',overlay:''},
    {id:'sepia',name:'Sepia',filter:'sepia(80%)',overlay:''},
    {id:'vintage',name:'Vintage',filter:'sepia(35%) contrast(88%) brightness(92%)',overlay:'rgba(210,180,140,0.1)'},
    {id:'cool',name:'Arctic',filter:'hue-rotate(170deg) saturate(75%) brightness(108%)',overlay:'rgba(100,150,255,0.07)'},
    {id:'warm',name:'Golden',filter:'hue-rotate(-25deg) saturate(125%) brightness(102%)',overlay:'rgba(255,200,100,0.08)'},
    {id:'drama',name:'Drama',filter:'contrast(135%) saturate(105%) brightness(88%)',overlay:'rgba(0,0,0,0.05)'},
    {id:'dream',name:'Dreamy',filter:'contrast(82%) saturate(65%) brightness(112%) blur(0.3px)',overlay:'rgba(255,255,255,0.07)'},
    {id:'vivid',name:'Vivid',filter:'saturate(190%) contrast(108%) brightness(106%)',overlay:'rgba(255,220,50,0.03)'},
    {id:'noir',name:'Noir',filter:'grayscale(100%) contrast(150%) brightness(75%)',overlay:'rgba(0,0,0,0.12)'}
];

class Booth {
    constructor(){
        this.vid=document.getElementById('camVideo'); this.cnv=document.getElementById('camCanvas'); this.ctx=this.cnv.getContext('2d');
        this.frameImg=document.getElementById('frameImg'); this.fxOverlay=document.getElementById('filterFx');
        this.box=document.getElementById('photoBox'); this.btnCap=document.getElementById('btnCapture');
        this.btnRet=document.getElementById('btnRetake'); this.btnDone=document.getElementById('btnDone');
        this.timerEl=document.getElementById('timer'); this.toastWarn=document.getElementById('toastWarn');
        this.modal=document.getElementById('printModal'); this.cdOverlay=document.getElementById('cdOverlay');
        this.cdNumber=document.getElementById('cdNumber'); this.flashFx=document.getElementById('flashFx');
        this.filterRow=document.getElementById('filterRow'); this.frameRow=document.getElementById('frameRow');
        this.mainArea=document.getElementById('mainArea');
        this.selFilter='none'; this.selFrame=''; this.captured=null; this.finalData=null;
        this.stream=null; this.raf=null; this.ready=false; this.timeLeft=90; this.timer=null;
        this.active=true; this.lastChance=false; this.counting=false;
        this.filterVideos=[]; this.previewRaf=null; this.frameFiles=[];
        this.init();
    }
    async init(){
        await this.loadFrameFiles();
        this.buildFilters();
        this.buildFrames();
        this.bindEvents();
        if(this.frameFiles.length>0){ this.selFrame=this.frameFiles[0]; this.loadFrame(); }
        await this.startCam();
        this.startTimer();
    }
    async loadFrameFiles(){
        try {
            const response = await fetch('frame-list.php');
            if(response.ok){
                const data = await response.json();
                this.frameFiles = data.frames || [];
            }
        } catch(e){}
        if(this.frameFiles.length === 0){
            this.frameFiles = ['kidversa','koran'];
        }
    }
    buildFilters(){
        this.filterRow.innerHTML='';
        FILTERS.forEach((f,i)=>{
            const d=document.createElement('div'); d.className=`filter-card${i===0?' sel':''}`; d.dataset.filter=f.id;
            d.innerHTML=`<div class="filter-thumb"><video id="fv${f.id}" muted playsinline></video><canvas id="fc${f.id}"></canvas></div><div class="filter-label">${f.name}</div>`;
            this.filterRow.appendChild(d);
        });
    }
    buildFrames(){
        this.frameRow.innerHTML='';
        this.frameFiles.forEach((name,i)=>{
            const displayName = name.replace(/[-_]/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
            const d=document.createElement('div'); d.className=`frame-card${i===0?' sel':''}`; d.dataset.frame=name;
            d.innerHTML=`<div class="frame-thumb"><img src="frame/${name}.png" alt="${displayName}" onerror="this.style.display='none'"></div><div class="frame-label">${displayName}</div>`;
            this.frameRow.appendChild(d);
        });
    }
    initFilterPreviews(){
        if(!this.stream) return;
        this.filterVideos=[];
        FILTERS.forEach(f=>{
            const videoEl=document.getElementById(`fv${f.id}`);
            const canvasEl=document.getElementById(`fc${f.id}`);
            if(videoEl && canvasEl){
                videoEl.srcObject=this.stream;
                videoEl.play().catch(()=>{});
                this.filterVideos.push({video:videoEl,canvas:canvasEl,filter:f.filter,overlay:f.overlay});
            }
        });
        this.startPreviewLoop();
    }
    startPreviewLoop(){
        if(this.previewRaf) cancelAnimationFrame(this.previewRaf);
        const loop=()=>{
            this.filterVideos.forEach(item=>{
                if(item.video.readyState>=2){
                    item.canvas.width=52; item.canvas.height=29;
                    const ctx=item.canvas.getContext('2d');
                    ctx.filter=item.filter;
                    ctx.save(); ctx.scale(-1,1); ctx.drawImage(item.video,-52,0,52,29); ctx.restore();
                    ctx.filter='none';
                    if(item.overlay){ ctx.fillStyle=item.overlay; ctx.fillRect(0,0,52,29); }
                }
            });
            this.previewRaf=requestAnimationFrame(loop);
        };
        loop();
    }
    stopPreviewLoop(){
        if(this.previewRaf){ cancelAnimationFrame(this.previewRaf); this.previewRaf=null; }
        this.filterVideos.forEach(item=>{ if(item.video) item.video.srcObject=null; });
        this.filterVideos=[];
    }
    bindEvents(){
        this.filterRow.addEventListener('click',e=>{
            const c=e.target.closest('.filter-card'); if(!c)return;
            this.filterRow.querySelectorAll('.filter-card').forEach(el=>el.classList.remove('sel'));
            c.classList.add('sel'); this.selFilter=c.dataset.filter; this.applyFilter();
            if(this.captured) this.showCaptured();
        });
        this.frameRow.addEventListener('click',e=>{
            const c=e.target.closest('.frame-card'); if(!c)return;
            this.frameRow.querySelectorAll('.frame-card').forEach(el=>el.classList.remove('sel'));
            c.classList.add('sel'); this.selFrame=c.dataset.frame; this.loadFrame();
            if(this.captured) this.showCaptured();
        });
        this.btnCap.addEventListener('click',()=>this.startCountdown());
        this.btnRet.addEventListener('click',()=>this.retake());
        this.btnDone.addEventListener('click',()=>this.finish());
        document.addEventListener('touchmove',e=>{if(!e.target.closest('.scroll-row'))e.preventDefault();},{passive:false});
        document.addEventListener('gesturestart',e=>e.preventDefault());
        window.addEventListener('resize',()=>{if(this.ready)this.updateCanvas();});
        window.addEventListener('orientationchange',()=>setTimeout(()=>{if(this.ready)this.updateCanvas();},300));
    }
    applyFilter(){
        const f=FILTERS.find(x=>x.id===this.selFilter); if(!f)return;
        this.vid.style.filter=f.filter; this.cnv.style.filter=f.filter;
        this.fxOverlay.style.background=f.overlay; this.fxOverlay.style.display=f.overlay?'block':'none';
    }
    startTimer(){
        this.timer=setInterval(()=>{this.timeLeft--;this.updateTimer();if(this.timeLeft<=10&&this.timeLeft>0)this.timerEl.classList.add('warn');if(this.timeLeft<=0)this.endSession();},1000);
    }
    updateTimer(){
        const m=Math.floor(Math.max(0,this.timeLeft)/60),s=Math.max(0,this.timeLeft)%60;
        this.timerEl.textContent=`${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }
    endSession(){
        clearInterval(this.timer); this.active=false; this.timerEl.textContent='00:00'; this.timerEl.classList.add('warn');
        if(!this.captured){ this.lastChance=true; this.showToast(); }
        else { this.btnCap.disabled=true; }
    }
    showToast(){ this.toastWarn.classList.add('show'); setTimeout(()=>this.toastWarn.classList.remove('show'),3000); }
    startCountdown(){
        if(!this.ready||this.counting)return;
        if(!this.active&&this.lastChance){ this.capture(); return; }
        this.counting=true; this.btnCap.disabled=true; let c=3;
        this.cdOverlay.classList.add('on'); this.cdNumber.textContent=c;
        const iv=setInterval(()=>{c--;if(c>0){this.cdNumber.textContent=c;this.cdNumber.style.animation='none';this.cdNumber.offsetHeight;this.cdNumber.style.animation='pop 0.7s cubic-bezier(0.68,-0.55,0.265,1.55)';}else{clearInterval(iv);this.cdOverlay.classList.remove('on');this.flash();this.capture();this.counting=false;if(this.active)this.btnCap.disabled=false;}},1000);
    }
    flash(){ this.flashFx.classList.add('on'); setTimeout(()=>this.flashFx.classList.remove('on'),80); }
    async startCam(){
        try{
            this.stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:TW},height:{ideal:TH},facingMode:'user',aspectRatio:{ideal:16/9}},audio:false});
            await this.setupVid();
        }catch(e){ await this.fallbackCam(); }
    }
    async fallbackCam(){
        try{
            this.stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720},facingMode:'user'},audio:false});
            await this.setupVid();
        }catch(e){ await this.anyCam(); }
    }
    async anyCam(){
        try{
            this.stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
            await this.setupVid();
        }catch(e){
            this.btnCap.disabled=false; this.btnCap.innerHTML='<i class="fas fa-sync"></i>Retry';
            this.btnCap.onclick=()=>{this.btnCap.innerHTML='<i class="fas fa-camera"></i>Capture';this.btnCap.onclick=null;this.startCam();};
        }
    }
    async setupVid(){
        this.vid.srcObject=this.stream;
        this.vid.onloadedmetadata=()=>{this.updateCanvas();this.ready=true;this.btnCap.disabled=false;this.applyFilter();this.startDraw();this.initFilterPreviews();};
        await this.vid.play();
    }
    updateCanvas(){
        const r=this.box.getBoundingClientRect(),w=Math.floor(r.width),h=Math.floor(r.height);
        if(w>0&&h>0&&(this.cnv.width!==w||this.cnv.height!==h)){this.cnv.width=w;this.cnv.height=h;}
    }
    startDraw(){
        if(this.raf)cancelAnimationFrame(this.raf);
        const draw=()=>{if(!this.captured&&this.vid.readyState>=2&&this.ready){this.updateCanvas();if(this.cnv.width>0){this.ctx.save();this.ctx.scale(-1,1);this.ctx.drawImage(this.vid,-this.cnv.width,0,this.cnv.width,this.cnv.height);this.ctx.restore();}}this.raf=requestAnimationFrame(draw);};
        draw();
    }
    loadFrame(){
        const img=new Image(); img.onload=()=>{this.frameImg.src=`frame/${this.selFrame}.png`;this.frameImg.style.display='block';};
        img.onerror=()=>{this.frameImg.style.display='none';}; img.src=`frame/${this.selFrame}.png`;
    }
    capture(){
        if(!this.ready||this.cnv.width===0)return;
        this.stopPreviewLoop();
        this.captured=this.cnv.toDataURL('image/png'); this.showCaptured();
        this.vid.style.display='none'; this.cnv.style.display='block';
        this.cnv.style.filter=FILTERS.find(x=>x.id===this.selFilter).filter;
        this.fxOverlay.style.display='none'; this.btnCap.style.display='none';
        if(this.active){this.btnRet.style.display='flex';}else{this.btnRet.style.display='none';}
        this.btnDone.style.display='flex';
        if(!this.active){this.lastChance=true;this.btnCap.disabled=true;}
        this.mainArea.scrollTop=0;
    }
    showCaptured(){
        if(!this.captured)return;
        const img=new Image(); img.onload=()=>{this.updateCanvas();this.ctx.clearRect(0,0,this.cnv.width,this.cnv.height);this.ctx.filter=FILTERS.find(x=>x.id===this.selFilter).filter;this.ctx.drawImage(img,0,0,this.cnv.width,this.cnv.height);this.ctx.filter='none';};
        img.src=this.captured; this.loadFrame();
    }
    retake(){
        if(!this.active&&this.lastChance)return;
        this.captured=null; this.finalData=null; this.vid.style.display='block'; this.cnv.style.display='none';
        this.frameImg.style.display='block';
        const f=FILTERS.find(x=>x.id===this.selFilter);
        this.fxOverlay.style.display=f.overlay?'block':'none'; this.cnv.style.filter='none';
        this.ctx.clearRect(0,0,this.cnv.width,this.cnv.height);
        this.btnCap.style.display='flex'; this.btnRet.style.display='none'; this.btnDone.style.display='none'; this.applyFilter();
        this.initFilterPreviews();
    }
    finish(){
        if(!this.captured)return;
        this.genFinal(()=>{this.modal.classList.add('on');});
    }
    genFinal(cb){
        const fc=document.createElement('canvas'); fc.width=TW; fc.height=TH; const fctx=fc.getContext('2d');
        fctx.fillStyle='#FFF'; fctx.fillRect(0,0,TW,TH);
        const img=new Image(); img.onload=()=>{
            fctx.filter=FILTERS.find(x=>x.id===this.selFilter).filter; fctx.drawImage(img,0,0,TW,TH); fctx.filter='none';
            const fi=new Image(); fi.onload=()=>{fctx.drawImage(fi,0,0,TW,TH);this.finalData=fc.toDataURL('image/png',1);cb();};
            fi.onerror=()=>{this.finalData=fc.toDataURL('image/png',1);cb();}; fi.src=`frame/${this.selFrame}.png`;
        };
        img.onerror=()=>{this.finalData=null;cb();}; img.src=this.captured;
    }
    destroy(){
        this.stopPreviewLoop();
        if(this.stream){this.stream.getTracks().forEach(t=>t.stop());this.stream=null;}
        if(this.raf){cancelAnimationFrame(this.raf);this.raf=null;}
        if(this.timer){clearInterval(this.timer);this.timer=null;}
    }
}
let booth;
window.addEventListener('load',()=>{booth=new Booth();});
window.addEventListener('beforeunload',()=>{if(booth)booth.destroy();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(booth?.raf){cancelAnimationFrame(booth.raf);booth.raf=null;}if(booth)booth.stopPreviewLoop();}else{if(booth&&!booth.captured&&booth.ready){booth.startDraw();booth.initFilterPreviews();}}});
function closeModal(){document.getElementById('printModal').classList.remove('on');}
function printNow(){
    if(!booth?.finalData)return;
    const w=window.open('','_blank','width=800,height=600'); if(!w){alert('Allow pop-ups to print');return;}
    w.document.write(`<!DOCTYPE html><html><head><title>Print</title><style>*{margin:0;padding:0}body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff}img{max-width:100%;max-height:100vh;object-fit:contain}@media print{@page{size:210mm 148mm landscape;margin:0}body{margin:0;width:210mm;height:148mm;display:flex;justify-content:center;align-items:center}img{width:210mm;height:148mm;object-fit:contain}}</style></head><body><img src="${booth.finalData}" onload="setTimeout(function(){window.print()},400)"></body></html>`);
    w.document.close();
}
document.getElementById('printModal').addEventListener('click',function(e){if(e.target===this)closeModal();});
</script>
</body>
</html>