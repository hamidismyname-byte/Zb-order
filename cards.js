// Zirlerberg – druckfertige QR-Tischkarten (A6, untere 3 cm stecken im Ständer)
export function cardsHTML(list,{base,qr,wifi,wifiOnly,a4}){
  // list: [{t:'23', zone:'Hauptsaal'}]; base: '…/g.html'; qr: qrcode-generator-Funktion
  const svg=txt=>{const q=qr(0,'M');q.addData(txt);q.make();return q.createSvgTag({cellSize:4,margin:0,scalable:true})};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const wifiQR=w=>'WIFI:T:WPA;S:'+String(w.ssid).replace(/([\;,:"])/g,'\\$1')+';P:'+String(w.pass).replace(/([\;,:"])/g,'\\$1')+';;';
  const front=x=>`<section class="card"><div class="vis">
    <img class="logo" src="logo.png" alt="">
    <div class="qrw">${svg(base+'?t='+encodeURIComponent(x.t))}</div>
    <div class="scan">SCAN · MENU</div>
    <div class="tl">TISCH</div><div class="tn">${esc(x.t)}</div>${x.zone?`<div class="zn">${esc(x.zone)}</div>`:''}
  </div><div class="stand"></div></section>`;
  const back=()=>`<section class="card"><div class="vis">
    <img class="logo" src="logo.png" alt="" style="width:26mm">
    <div class="wt">Free Wi-Fi</div>
    <div class="qrw">${svg(wifiQR(wifi))}</div>
    <div class="scan">SCAN · CONNECT</div>
    <div class="zn" style="margin-top:3mm">${esc(wifi.ssid)}</div>
  </div><div class="stand"></div></section>`;
  let pages;
  if(!a4)pages=wifiOnly?(wifi&&wifi.ssid?back():''):list.map(x=>front(x)+(wifi&&wifi.ssid?back():'')).join('');
  else{ // Sammeldruck: 4 Karten A6 auf A4 (2×2), Rückseiten gespiegelt für beidseitigen Druck (lange Kante)
    const fr=wifiOnly?Array.from({length:Math.max(1,list.length)},()=>back()):list.map(front);const bk=!wifiOnly&&wifi&&wifi.ssid;pages='';
    for(let i=0;i<fr.length;i+=4){const g=fr.slice(i,i+4);while(g.length<4)g.push('<section class="card empty"></section>');
      pages+=`<div class="a4">${g.join('')}<i class="cut v"></i><i class="cut h"></i></div>`;
      if(bk){const n=Math.min(4,fr.length-i),b=[0,1,2,3].map(k=>k<n?back():'<section class="card empty"></section>');pages+=`<div class="a4">${[b[1],b[0],b[3],b[2]].join('')}<i class="cut v"></i><i class="cut h"></i></div>`}}}
  return `<!doctype html><html><head><meta charset="utf-8"><title>Zirlerberg QR-Karten</title><style>
@font-face{font-family:CG;src:url(font-cg600.woff2) format('woff2');font-weight:600}
@font-face{font-family:MR;src:url(font-mr600.woff2) format('woff2');font-weight:600}
@page{size:${a4?'210mm 297mm':'105mm 148mm'};margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0;background:#555}
.card{width:105mm;height:148mm;background:#0a1430;color:#f4efe4;position:relative;overflow:hidden;page-break-after:always;break-after:page;margin:0 auto}
@media screen{.card{margin:6mm auto;box-shadow:0 4px 20px #0008}}
.card:before{content:'';position:absolute;inset:4mm 4mm 34mm 4mm;border:.35mm solid rgba(214,176,106,.55);border-radius:4mm;pointer-events:none}
.vis{height:118mm;display:flex;flex-direction:column;align-items:center;padding-top:8mm}
.logo{width:25mm;height:auto}
.qrw{width:46mm;height:46mm;background:#fff;border-radius:3.5mm;padding:3mm;margin-top:4mm}
.qrw svg{width:100%;height:100%;display:block}
.scan{font:600 6pt MR,sans-serif;letter-spacing:2.2pt;color:rgba(244,239,228,.65);margin-top:2.5mm}
.tl{font:600 6.5pt MR,sans-serif;letter-spacing:3.5pt;color:#d6b06a;margin-top:3.5mm}
.tn{font:600 28pt/1 CG,Georgia,serif;color:#d6b06a;margin-top:.5mm;font-variant-numeric:lining-nums}
.zn{font:600 7pt MR,sans-serif;letter-spacing:1.2pt;color:rgba(244,239,228,.7);margin-top:1mm;text-transform:uppercase}
.wt{font:600 20pt/1 CG,Georgia,serif;color:#d6b06a;margin-top:4mm}
.stand{height:30mm;background:#0a1430}
.a4{width:210mm;height:297mm;display:grid;grid-template-columns:105mm 105mm;grid-template-rows:148mm 148mm;position:relative;page-break-after:always;break-after:page;background:#fff;margin:0 auto}
.a4 .card{margin:0!important;box-shadow:none!important;page-break-after:auto;break-after:auto}
.a4 .card.empty{background:#fff}.a4 .card.empty:before{display:none}
.cut{position:absolute;background:repeating-linear-gradient(90deg,#999 0 3mm,transparent 3mm 5mm);pointer-events:none}
.cut.h{left:0;right:0;top:148mm;height:.2mm}.cut.v{top:0;bottom:0;left:105mm;width:.2mm;background:repeating-linear-gradient(180deg,#999 0 3mm,transparent 3mm 5mm)}
@media screen{.a4{margin:6mm auto;box-shadow:0 4px 20px #0008}}
</style></head><body>${pages}</body></html>`}
