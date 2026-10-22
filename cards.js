// v13 QR-Tischkarten: weißer Hintergrund, Schrift navy, nur Logo auf navy, große Tischnummer
export function cardsHTML(list,{base,qr,wifi,wifiOnly,a4,fold}){
  const svg=txt=>{const q=qr(0,'M');q.addData(txt);q.make();return q.createSvgTag({cellSize:4,margin:0,scalable:true}).replace(/fill="#000000"/g,'fill="#0a1430"')};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const wifiQR=w=>'WIFI:T:WPA;S:'+String(w.ssid).replace(/([\;,:"])/g,'\\$1')+';P:'+String(w.pass).replace(/([\;,:"])/g,'\\$1')+';;';
  const front=x=>`<section class="card"><div class="vis">
    <div class="badge"><img src="logo.png" alt=""></div>
    <div class="qrw">${svg(base+'?t='+encodeURIComponent(x.t))}</div>
    <div class="scan">SCAN · MENU · BESTELLEN</div>
    <div class="tl">TISCH</div><div class="tn">${esc(x.t)}</div>${x.zone?`<div class="zn">${esc(x.zone)}</div>`:''}
  </div><div class="stand"></div></section>`;
  const back=()=>`<section class="card"><div class="vis">
    <div class="badge sm"><img src="logo.png" alt=""></div>
    <div class="wt">Free Wi-Fi</div>
    <div class="qrw">${svg(wifiQR(wifi))}</div>
    <div class="scan">SCAN · CONNECT</div>
    <div class="ssid">${esc(wifi.ssid)}</div>
  </div><div class="stand"></div></section>`;
  let pages;
  if(fold){ // A4 hoch: 2 Streifen nebeneinander; oben Menü-Karte, unten WLAN-Karte (180° gedreht) -> senkrecht schneiden, waagrecht falten
    pages='';for(let i=0;i<list.length;i+=2){const g=list.slice(i,i+2);
      const col=x=>x?`<div class="strip">${front(x)}<div class="rot">${wifi&&wifi.ssid?back():''}</div></div>`:'<div class="strip"></div>';
      pages+=`<div class="a4f">${col(g[0])}${col(g[1])}<i class="cut v"></i><i class="fold h"></i></div>`}}
  else if(!a4)pages=wifiOnly?back():list.map(x=>front(x)+(wifi&&wifi.ssid?back():'')).join('');
  else{const fr=wifiOnly?[0,1,2,3].map(back):list.map(front);const bk=!wifiOnly&&wifi&&wifi.ssid;pages='';
    for(let i=0;i<fr.length;i+=4){const g=fr.slice(i,i+4);while(g.length<4)g.push('<section class="card empty"></section>');
      pages+=`<div class="a4">${g.join('')}<i class="cut v"></i><i class="cut h"></i></div>`;
      if(bk){const n=Math.min(4,fr.length-i),b=[0,1,2,3].map(k=>k<n?back():'<section class="card empty"></section>');pages+=`<div class="a4">${[b[1],b[0],b[3],b[2]].join('')}<i class="cut v"></i><i class="cut h"></i></div>`}}}
  return `<!doctype html><html><head><meta charset="utf-8"><title>Zirlerberg QR-Karten</title><style>
@font-face{font-family:CG;src:url(font-cg600.woff2) format('woff2');font-weight:600}
@font-face{font-family:MR;src:url(font-mr600.woff2) format('woff2');font-weight:600}
@page{size:${a4||fold?'210mm 297mm':'105mm 148mm'};margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0;background:#ccc}
.card{width:105mm;height:148mm;background:#fff;color:#0a1430;position:relative;overflow:hidden;page-break-after:always;break-after:page;margin:0 auto}
@media screen{.card{margin:6mm auto;box-shadow:0 4px 20px #0004}}
.card:before{content:'';position:absolute;inset:8mm 8mm 32mm 8mm;border:.4mm solid #0a1430;border-radius:4mm;pointer-events:none}
.vis{height:116mm;display:flex;flex-direction:column;align-items:center;padding-top:11mm}
.badge{background:#0a1430;border-radius:3.5mm;padding:2mm 5mm;display:flex;align-items:center;justify-content:center}
.badge img{height:12.5mm;width:auto;display:block}.badge.sm img{height:10.5mm}
.qrw{width:37mm;height:37mm;margin-top:3mm}
.qrw svg{width:100%;height:100%;display:block}
.scan{font:600 6.3pt MR,sans-serif;letter-spacing:1.8pt;color:#0a1430;margin-top:2.2mm}
.tl{font:600 8pt MR,sans-serif;letter-spacing:4pt;color:#0a1430;margin-top:2mm}
.tn{font:600 62pt/0.9 CG,Georgia,serif;color:#0a1430;font-variant-numeric:lining-nums}
.zn{font:600 6.5pt MR,sans-serif;letter-spacing:1.2pt;color:#0a1430;opacity:.75;margin-top:.5mm;text-transform:uppercase}
.wt{font:600 22pt/1 CG,Georgia,serif;color:#0a1430;margin-top:3mm}
.ssid{font:600 9pt MR,sans-serif;letter-spacing:.8pt;color:#0a1430;margin-top:2.5mm}
.stand{height:32mm;background:#fff}
.a4{width:210mm;height:297mm;display:grid;grid-template-columns:105mm 105mm;grid-template-rows:148mm 148mm;position:relative;page-break-after:always;break-after:page;background:#fff;margin:0 auto}
.a4 .card{margin:0!important;box-shadow:none!important;page-break-after:auto;break-after:auto}
.a4 .card.empty:before{display:none}
.cut{position:absolute;pointer-events:none}
.cut.h{left:0;right:0;top:148mm;height:.2mm;background:repeating-linear-gradient(90deg,#999 0 3mm,transparent 3mm 5mm)}
.cut.v{top:0;bottom:0;left:105mm;width:.2mm;background:repeating-linear-gradient(180deg,#999 0 3mm,transparent 3mm 5mm)}
@media screen{.a4,.a4f{margin:6mm auto;box-shadow:0 4px 20px #0004}}
.a4f{width:210mm;height:297mm;display:grid;grid-template-columns:105mm 105mm;position:relative;page-break-after:always;break-after:page;background:#fff;margin:0 auto}
.strip{width:105mm;height:297mm;display:flex;flex-direction:column}
.strip .card{height:148.5mm;margin:0!important;box-shadow:none!important;page-break-after:auto;break-after:auto}
.rot{transform:rotate(180deg)}
.fold{position:absolute;pointer-events:none}
.fold.h{left:0;right:0;top:148.5mm;height:.25mm;background:repeating-linear-gradient(90deg,#bbb 0 1mm,transparent 1mm 2.5mm)}
</style></head><body>${pages}</body></html>`}
